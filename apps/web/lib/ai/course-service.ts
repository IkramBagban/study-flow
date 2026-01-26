import { AIModelFactory, currentAIConfig } from "./model-factory";
import { DomainMapSchema, CourseStructureSchema, MicroConceptSchema, AssessmentOutputSchema } from "./schemas";
import { prisma } from "@study-flow/db";
import { DirectorAgent } from "./agents/director-agent";
import { ProfessorAgent } from "./agents/professor-agent";
import { VisualizerAgent } from "./agents/visualizer-agent";
import { InquisitorAgent } from "./agents/inquisitor-agent";

// Legacy global model
const model = AIModelFactory.createModel(currentAIConfig);
const domainMapGenerator = model.withStructuredOutput(DomainMapSchema);
const courseStructureGenerator = model.withStructuredOutput(CourseStructureSchema);
const assessmentGenerator = model.withStructuredOutput(AssessmentOutputSchema);

export class CourseService {

    // -- Modular Agents --
    private static director = new DirectorAgent();
    private static professor = new ProfessorAgent();
    private static visualizer = new VisualizerAgent();
    private static inquisitor = new InquisitorAgent();

    /**
     * Helper to safely parse JSON from AI response
     * (Retained for legacy Phase A/B methods until fully refactored)
     */
    private static async safeParseJSON<T>(prompt: string, validator?: any): Promise<T> {
        try {
            if (validator) {
                try {
                    return await validator.invoke(prompt);
                } catch (e) {
                    console.warn("[CourseService] Structured output failed, falling back to manual parse.", e);
                }
            }
            const result = await model.invoke(prompt);
            const text = result.content.toString();
            const cleaned = text.replace(/```(?:json|javascript)?/g, "").replace(/```/g, "").trim();

            const jsonStart = cleaned.indexOf('{');
            const jsonEnd = cleaned.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
            }
            return JSON.parse(cleaned);
        } catch (error) {
            console.error("[CourseService] JSON Parse Error. Prompt:", prompt);
            throw error;
        }
    }

    /** Phase A: Generate Domain Map (Legacy Impl) */
    static async generateDomainMap(topic: string, goal: string, sourceText?: string) {
        const prompt = `
        You are an expert curriculum designer.
        User wants to learn: "${topic}"
        Goal: "${goal}"
        ${sourceText ? `Primary Resource Content: ${sourceText.substring(0, 4000)}` : ''}
        
        Task:
        1. Create a high-level "Domain Map" for this subject.
        2. Break it down into 4-7 core "Topic Groups".
        3. For each group, provide a 1-2 line "hook" explaining why it matters.
        4. Focus on "Schematic Seeding" - help the user build a mental model here.
        5. List 5-10 "Key Concepts" (jargon/terms) that a user might or might not know, to check their level.
        ${sourceText ? "IMPORTANT: Prioritize concepts found in the provided resource." : ""}

        Output Format: JSON matching the DomainMapSchema.
        `;
        return await this.safeParseJSON<any>(prompt, domainMapGenerator);
    }

    /** Phase B: Generate Diagnostic (Legacy Impl) */
    static async generateDiagnosticQuiz(topic: string, goal: string, level: string, concepts: string[], sourceText?: string) {
        const prompt = `
        You are an expert tutor. Create a diagnostic quiz for "${topic}".
        Level: ${level}. Known concepts: ${concepts.join(', ')}.
        
        Task:
        Generate a diagnostic quiz (Multiple Choice) to verify knowledge.
        - Include 3-5 high-value questions.
        - Focus on misconceptions.
        ${sourceText ? "- Use the provided resource as the primary source of truth." : ""}
        
        Output Format: JSON matching AssessmentOutputSchema.
        `;
        return await this.safeParseJSON<any>(prompt, assessmentGenerator);
    }

    /** Phase B: Blueprint (Legacy Impl) */
    static async generateCourseBlueprint(userId: string, topic: string, goal: string, level: string, sourceText?: string, assessmentData?: any) {
        const prompt = `
        You are an expert curriculum architect.
        Topic: "${topic}", Goal: "${goal}", Level: "${level}".
        
        Task:
        Generate a complete hierarchical course structure (Domain Map, SubTopics, Dependency Path).
        
        Output Format: JSON matching CourseStructureSchema.
        `;
        const structure = await this.safeParseJSON<any>(prompt, courseStructureGenerator);

        // Persist
        const course = await prisma.course.create({
            data: {
                userId,
                title: structure.domainMap.subject,
                subject: topic,
                goal: goal,
                level: level,
                description: structure.domainMap.welcomeMessage,
                assessmentData: assessmentData ?? undefined,
                sourceData: sourceText ? { text: sourceText } : undefined,
                modules: {
                    create: structure.domainMap.groups.map((group: any) => ({
                        title: group.title,
                        description: group.description,
                        order: group.order,
                        chapters: {
                            create: structure.subTopics
                                .filter((sub: any) => sub.parentGroupId === group.id)
                                .map((sub: any) => ({
                                    title: sub.title,
                                    order: sub.order,
                                    estimatedTime: sub.estimatedTime,
                                    concepts: {
                                        create: sub.microConcepts.map((concept: any, index: number) => ({
                                            title: concept.title,
                                            type: concept.type,
                                            order: index,
                                            isReady: false,
                                            content: {}
                                        }))
                                    }
                                }))
                        }
                    }))
                }
            },
            include: { modules: { include: { chapters: { include: { concepts: true } } } } }
        });
        return course;
    }

    /**
     * Phase C: Generate Content for a Specific Chapter (Multi-Agent Director Mode)
     */
    static async generateChapterContent(chapterId: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { concepts: true, module: { include: { course: true } } }
        });

        if (!chapter) throw new Error("Chapter not found");

        const conceptsToGenerate = chapter.concepts.filter(c => !c.isReady);
        console.log(`[CourseService] Director Agent active. Generating content for ${conceptsToGenerate.length} concepts.`);

        if (conceptsToGenerate.length === 0) return [];

        const startTime = Date.now();

        await Promise.all(conceptsToGenerate.map(async (concept) => {
            console.log(`[Director] Planning content for: ${concept.title}`);

            try {
                // 1. Director Plans
                const plan = await this.director.planContentBytes({
                    course: chapter.module.course.subject,
                    module: chapter.module.title,
                    concept: concept.title,
                    conceptType: concept.type
                });

                console.log(`[Director] Plan for ${concept.title}: ${plan.length} blocks.`);

                // 2. Specialists Execute
                const blocks = await Promise.all(plan.map(async (task) => {
                    switch (task.role) {
                        case 'text':
                            return {
                                type: 'text',
                                variant: task.variant,
                                content: await this.professor.generateText({
                                    concept: concept.title,
                                    course: chapter.module.course.subject,
                                    variant: task.variant,
                                    instruction: task.instruction
                                })
                            };
                        case 'visual':
                            const visualData = await this.visualizer.generateVisual({
                                concept: concept.title,
                                tool: task.tool,
                                instruction: task.instruction
                            });
                            return {
                                type: 'visual',
                                tool: task.tool,
                                code: visualData.code,
                                caption: visualData.caption
                            };
                        case 'recall_question':
                            return {
                                type: 'quiz',
                                ...await this.inquisitor.generateQuestion({
                                    concept: concept.title,
                                    instruction: task.instruction
                                })
                            };
                        default:
                            return null;
                    }
                }));

                const validBlocks = blocks.filter(b => b !== null);

                // 3. Save
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: { content: validBlocks, isReady: true }
                });

                console.log(`[Director] Finished concept: ${concept.title}`);

            } catch (error) {
                console.error(`[Director] Failed concept ${concept.id}:`, error);
            }
        }));

        console.log(`[CourseService] Completed in ${(Date.now() - startTime) / 1000}s`);
        return [];
    }
}
