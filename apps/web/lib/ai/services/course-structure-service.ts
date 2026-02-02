import { AIModelFactory, currentAIConfig } from "../model-factory";
import { DomainMapSchema, CourseStructureSchema, AssessmentOutputSchema } from "../schemas";
import { prisma } from "@study-flow/db";
import { z } from "zod";
import { ingestResource } from "@/lib/rag/vector-store";

const model = AIModelFactory.createModel(currentAIConfig);

/**
 * CourseStructureService
 * Handles course creation, domain mapping, and module/chapter structure generation
 */
export class CourseStructureService {

    /**
     * Phase A: Generate Domain Map (Delegates to Architect Analyzer Node)
     */
    static async generateDomainMap(topic: string, goal: string, sourceText?: string, useOnlyResources?: boolean) {
        console.log(`[CourseStructure] 🚀 Generating Domain Map for "${topic}"`);
        const { analyzerNode } = await import("../engine/architect/nodes/analyzer");

        // Construct minimal state for the node
        const state: any = { topic, goal, sourceText, useOnlyResources };
        const result = await analyzerNode(state);

        if (result.error) throw new Error(result.error);
        return result.domainMap; // Node returns { domainMap: ... }
    }

    /**
     * Phase B: Generate Course Structure (Delegates to Architect Structurer Node)
     */
    static async generateCourseStructure(domainMap: any, userLevel: string) {
        console.log(`[CourseStructure] 📚 Generating course structure (Level: ${userLevel})`);
        const { structurerNode } = await import("../engine/architect/nodes/structurer");

        const state: any = {
            topic: domainMap.subject || "Unknown Topic",
            level: userLevel,
            domainMap: domainMap
        };

        const result = await structurerNode(state);

        if (result.error) throw new Error(result.error);
        return result.structure;
    }

    /**
     * Phase B: Generate Diagnostic Quiz (Level 2 Implementation)
     */
    static async generateDiagnosticQuiz(topic: string, goal: string, level: string, concepts: string[], sourceText?: string, useOnlyResources?: boolean) {
        console.log(`[CourseStructure] 📝 Generating diagnostic quiz for "${topic}"`);
        const { ChatPromptTemplate } = await import("@langchain/core/prompts");
        const { AssessmentOutputSchema } = await import("../schemas");

        const model = AIModelFactory.createModel(currentAIConfig); // Use default factory config

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are an expert tutor. Create a diagnostic quiz (Multiple Choice) to assess the user's knowledge.
             Subject: {topic}
             Level: {level}
             Known Concepts: {concepts}
             Goal: {goal}
             ${sourceText ? "Source Material: {sourceText}" : ""}
             ${useOnlyResources ? "IMPORTANT: STRICT MODE. Use ONLY the provided Source Material to generate questions." : ""}
             
             Requirements:
             - 3-5 high-value questions testing conceptual understanding.
             - Focus on misconceptions.
             - Provide an 'explanation' for the correct answer.
             
             CRITICAL: Return ONLY the raw JSON data matching the schema. Do NOT generate a React component or UI code. Just the data.
            `],
            ["user", "Generate the quiz questions data."]
        ]);

        const chain = prompt.pipe(model.withStructuredOutput(AssessmentOutputSchema));

        return await chain.invoke({
            topic,
            level,
            goal,
            concepts: concepts.join(", "),
            sourceText: sourceText ? sourceText.substring(0, 4000) : ""
        });
    }

    /**
     * Phase B.2: Infer Knowledge Profile (Level 2 Implementation)
     */
    static async inferKnowledgeProfile(topic: string, level: string, concepts: string[], quizResults: any[]) {
        console.log(`[CourseStructure] 🧠 Inferring profile for "${topic}"`);
        const { ChatPromptTemplate } = await import("@langchain/core/prompts");
        const { z } = await import("zod");

        const model = AIModelFactory.createModel(currentAIConfig);
        const ProfileSchema = z.object({
            judgments: z.array(z.string())
        });

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are a Cognitive Scientist. Infer a knowledge profile.
             Subject: {topic}
             Level: {level}
             Self-Reported Concepts: {concepts}
             Quiz Performance: {quizResults}
             
             Task:
             - Generate 3-4 specific observations (judgments).
             - Be constructive.
             - Use "We've observed..." phrasing.
            `],
            ["user", "Infer the knowledge profile."]
        ]);

        const chain = prompt.pipe(model.withStructuredOutput(ProfileSchema));

        return await chain.invoke({
            topic,
            level,
            concepts: concepts.join(", "),
            quizResults: JSON.stringify(quizResults)
        });
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
        assessmentData?: any,
        useOnlyResources?: boolean
    ) {
        return this.createCourse({
            userId,
            topic,
            goal,
            level,
            sourceText,
            assessmentData,
            useOnlyResources
        });
    }

    /**
     * Create course in database with full structure
     */
    /**
     * Create course in database with full structure (LangGraph Architecture)
     */
    static async createCourse(input: {
        userId: string;
        topic: string;
        goal: string;
        level: string;
        sourceText?: string;
        useOnlyResources?: boolean;
        assessmentData?: any;
    }) {
        console.log(`[CourseArchitect] 🎓 Creating course: "${input.topic}"`);

        // Dynamic import to avoid circular dep issues during init
        const { courseArchitectGraph } = await import("../engine/architect/graph");

        // Invoke the Graph
        const result = await courseArchitectGraph.invoke({
            topic: input.topic,
            goal: input.goal,
            level: input.level,
            sourceText: input.sourceText,
            useOnlyResources: input.useOnlyResources,
            domainMap: null,
            structure: null,
            error: null
        });

        if (result.error || !result.domainMap || !result.structure) {
            throw new Error(result.error || "Failed to generate course structure");
        }

        const domainMap = result.domainMap;
        const structure = result.structure;

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
                    domainMap: domainMap,
                    keyConcepts: domainMap.keyConcepts,
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

        console.log(`[CourseArchitect] ✅ Course Created: ${course.id}`);

        if (input.sourceText) {
            console.log(`[CourseArchitect] 📥 Ingesting Source Text (${input.sourceText.length} chars)`);
            // Ingest loosely in background (don't await strictly if we want speed, but for now await to be safe)
            try {
                await ingestResource(course.id, input.sourceText, 'text', 'Initial Logic Source');
                console.log(`[CourseArchitect]  Source Text Ingested & Embedded`);
            } catch (e) {
                console.error(`[CourseArchitect]  Failed to ingest source text`, e);
            }
        }

        return course;
    }
}
