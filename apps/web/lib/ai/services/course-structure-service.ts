import { AIModelFactory, currentAIConfig } from "../model-factory";
import { DomainMapSchema, CourseStructureSchema, AssessmentOutputSchema } from "../schemas";
import { prisma } from "@study-flow/db";
import { z } from "zod";

const model = AIModelFactory.createModel(currentAIConfig);

/**
 * CourseStructureService
 * Handles course creation, domain mapping, and module/chapter structure generation
 */
export class CourseStructureService {

    /**
     * Helper to safely parse JSON from AI with validation
     */
    private static async safeParseJSON<T>(prompt: string, schema?: z.ZodSchema<T>): Promise<T> {
        const start = Date.now();
        console.log(`[CourseStructure] 🟡 Generating JSON...`);

        try {
            const result = await model.invoke(prompt);
            const text = result.content.toString();
            const cleaned = text.replace(/```(?:json|javascript)?/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);

            if (schema) {
                const validated = schema.safeParse(parsed);
                if (!validated.success) {
                    console.error("[CourseStructure] ❌ Validation Failed:", validated.error.format());
                    throw new Error(`Invalid structure: ${validated.error.message}`);
                }
                console.log(`[CourseStructure] ✅ Validated (${Date.now() - start}ms)`);
                return validated.data;
            }

            console.log(`[CourseStructure] ✅ Parsed (${Date.now() - start}ms)`);
            return parsed;
        } catch (error) {
            console.error("[CourseStructure] ❌ Parse Error:", prompt.substring(0, 100) + "...");
            throw error;
        }
    }

    /**
     * Phase A: Generate Domain Map
     */
    static async generateDomainMap(topic: string, goal: string, sourceText?: string) {
        console.log(`[CourseStructure] 🚀 Generating Domain Map for "${topic}"`);

        const prompt = `
        You are an expert curriculum designer.
        User wants to learn: "${topic}"
        Goal: "${goal}"
        ${sourceText ? `Primary Resource: ${sourceText.substring(0, 4000)}` : ''}
        
        Task:
        1. Create a "Domain Map" for this subject
        2. Break into 4-7 core "Topic Groups"
        3. For each group, explain why it matters
        4. List 5-10 "Key Concepts" users should know
        ${sourceText ? "IMPORTANT: Prioritize concepts from the resource." : ""}

        Output Format (JSON ONLY):
        {
          "domainMap": {
             "subject": "...",
             "welcomeMessage": "...",
             "keyConcepts": ["..."],
             "groups": [
                { "id": "...", "title": "...", "description": "...", "order": 1, "whyImportant": "..." }
             ]
          }
        }
        `;

        return await this.safeParseJSON<any>(prompt);
    }

    /**
     * Phase B: Generate Course Structure (Modules & Chapters)
     */
    static async generateCourseStructure(domainMap: any, userLevel: string) {
        console.log(`[CourseStructure] 📚 Generating course structure (Level: ${userLevel})`);

        const prompt = `
        Domain Map: ${JSON.stringify(domainMap.domainMap)}
        User Level: ${userLevel}
        
        Task: Create a course structure with modules and chapters.
        
        Rules:
        - 3-5 modules
        - 3-4 chapters per module
        - Use "Neuroscience Sequencing": priming → core → application
        - Each concept needs 1-2 sentences explaining its purpose
        
        Output Format (JSON ONLY):
        {
          "modules": [
            {
              "title": "...",
              "description": "...",
              "order": 1,
              "chapters": [
                {
                  "title": "...",
                  "description": "...",
                  "order": 1,
                  "concepts": [
                    { "title": "...", "description": "...", "type": "priming|core|application", "order": 1 }
                  ]
                }
              ]
            }
          ]
        }
        `;

        // We use a custom schema here because the legacy CourseStructureSchema uses a flat 'subTopics' list
        // but we want a nested structure for the database.
        const ConceptSchema = z.object({
            title: z.string(),
            description: z.string(),
            type: z.enum(["priming", "core", "application"]),
            order: z.number()
        });

        const ChapterSchema = z.object({
            title: z.string(),
            description: z.string(),
            order: z.number(),
            concepts: z.array(ConceptSchema)
        });

        const ModuleSchema = z.object({
            title: z.string(),
            description: z.string(),
            order: z.number(),
            chapters: z.array(ChapterSchema)
        });

        const ResultSchema = z.object({
            modules: z.array(ModuleSchema)
        });

        return await this.safeParseJSON<any>(prompt, ResultSchema);
    }

    /**
     * Phase B: Generate Diagnostic Quiz
     */
    static async generateDiagnosticQuiz(topic: string, goal: string, level: string, concepts: string[], sourceText?: string) {
        console.log(`[CourseStructure] 📝 Generating diagnostic quiz for "${topic}"`);

        const prompt = `
        You are an expert tutor. Create a diagnostic quiz for "${topic}".
        Level: ${level}. Known concepts: ${concepts.join(', ')}.
        
        Task:
        Generate a diagnostic quiz (Multiple Choice) to verify knowledge.
        - Include 3-5 high-value questions.
        - Focus on misconceptions.
        ${sourceText ? "- Use the provided resource as the primary source of truth." : ""}
        
        Output Format (JSON ONLY):
        {
          "questions": [
            {
              "id": "q1",
              "question": "...",
              "options": [
                { "id": "a", "text": "..." },
                { "id": "b", "text": "..." }
              ],
              "correctOptionId": "a",
              "explanation": "..."
            }
          ]
        }
        `;

        // Note: Using any for now as schema might need adjustment, but conceptually mapping to AssessmentOutputSchema
        return await this.safeParseJSON<any>(prompt, AssessmentOutputSchema);
    }

    /**
     * Generate Course Blueprint (Alias/Wrapper for createCourse with Assessment Data)
     */
    static async generateCourseBlueprint(
        userId: string,
        topic: string,
        goal: string,
        level: string,
        sourceText?: string,
        assessmentData?: any
    ) {
        return this.createCourse({
            userId,
            topic,
            goal,
            level,
            sourceText,
            assessmentData
        });
    }

    /**
     * Create course in database with full structure
     */
    static async createCourse(input: {
        userId: string;
        topic: string;
        goal: string;
        level: string;
        sourceText?: string;
        assessmentData?: any;
    }) {
        console.log(`[CourseStructure] 🎓 Creating course: "${input.topic}"`);

        // Phase A: Generate domain map
        const domainMapData = await this.generateDomainMap(input.topic, input.goal, input.sourceText);

        // Phase B: Generate structure
        const structure = await this.generateCourseStructure(domainMapData, input.level);

        // Save to database
        const course = await prisma.course.create({
            data: {
                title: input.topic,
                subject: input.topic,
                description: input.goal,
                goal: input.goal,
                userId: input.userId,
                level: input.level,
                assessmentData: input.assessmentData ?? undefined,
                sourceData: {
                    domainMap: domainMapData.domainMap,
                    keyConcepts: domainMapData.domainMap.keyConcepts,
                    sourceText: input.sourceText
                },
                modules: {
                    create: structure.modules.map((module: any) => ({
                        title: module.title,
                        description: module.description,
                        order: module.order,
                        chapters: {
                            create: module.chapters.map((chapter: any) => ({
                                title: chapter.title,
                                order: chapter.order,
                                concepts: {
                                    create: chapter.concepts.map((concept: any) => ({
                                        title: concept.title,
                                        type: concept.type,
                                        order: concept.order,
                                        isReady: false,
                                        content: {
                                            description: concept.description
                                        }
                                    }))
                                }
                            }))
                        }
                    }))
                }
            },
            include: { modules: { include: { chapters: { include: { concepts: true } } } } }
        });

        console.log(`[CourseStructure] ✅ Course Created: ${course.id}`);
        return course;
    }
}
