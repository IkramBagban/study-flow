import { AIModelFactory, currentAIConfig } from "./model-factory";
import { DomainMapSchema, CourseStructureSchema, MicroConceptSchema } from "./schemas";
import { prisma } from "@study-flow/db";

const model = AIModelFactory.createModel(currentAIConfig);
const domainMapGenerator = model.withStructuredOutput(DomainMapSchema);
const courseStructureGenerator = model.withStructuredOutput(CourseStructureSchema);
const microConceptGenerator = model.withStructuredOutput(MicroConceptSchema);

export class CourseService {
    /**
     * Phase A: Generate the high-level Domain Map
     */
    static async generateDomainMap(topic: string, goal: string) {
        const prompt = `
        You are an expert curriculum designer.
        
        User wants to learn: "${topic}"
        Goal: "${goal}"
        
        Task:
        1. Create a high-level "Domain Map" for this subject.
        2. Break it down into 4-7 core "Topic Groups".
        3. For each group, provide a 1-2 line "hook" explaining why it matters.
        4. Focus on "Schematic Seeding" - help the user build a mental model here.
        
        Output Format: JSON matching the DomainMapSchema.
        `;

        return await domainMapGenerator.invoke(prompt);
    }

    /**
     * Phase B: Generate Blueprint & Persist to DB
     * Creates the skeleton (Course -> Modules -> Chapters) but NOT the full content yet.
     */
    static async generateCourseBlueprint(userId: string, topic: string, goal: string, level: string) {
        const prompt = `
        You are an expert curriculum architect.

        User Context:
        - Topic: "${topic}"
        - Goal: "${goal}"
        - Knowledge Level: "${level}"

        Task:
        Generate a complete hierarchical course structure.
        
        IMPORTANT:
        - Generate the STRUCTURE (Domain Map, SubTopics, Dependency Path).
        - For "MicroConcepts", just provide titles/types as placeholders. Content will be generated later.
        
        Principles:
        1. Hierarchical Learning (Domain -> Group -> Subtopic)
        2. 0-Idea State Handling (Start with Priming)

        Output Format: JSON matching CourseStructureSchema.
        
        CRITICAL: Return ONLY valid JSON. Do NOT wrap the output in markdown code blocks (e.g. \`\`\`json ... \`\`\`). Just the raw JSON object.
        `;

        const structure = await courseStructureGenerator.invoke(prompt);

        // Persist to DB
        const course = await prisma.course.create({
            data: {
                userId,
                title: structure.domainMap.subject,
                subject: topic,
                goal: goal,
                level: level,
                description: structure.domainMap.welcomeMessage,
                modules: {
                    create: structure.domainMap.groups.map(group => ({
                        title: group.title,
                        description: group.description,
                        order: group.order,
                        chapters: {
                            create: structure.subTopics
                                .filter(sub => sub.parentGroupId === group.id)
                                .map(sub => ({
                                    title: sub.title,
                                    order: sub.order,
                                    estimatedTime: sub.estimatedTime,
                                    concepts: {
                                        create: sub.microConcepts.map((concept, index) => ({
                                            title: concept.title,
                                            type: concept.type,
                                            order: index,
                                            isReady: false, // Content not ready yet
                                            content: {} // Empty initially
                                        }))
                                    }
                                }))
                        }
                    }))
                }
            },
            include: {
                modules: {
                    include: {
                        chapters: {
                            include: { concepts: true }
                        }
                    }
                }
            }
        });

        // We can trigger background content generation here if needed,
        // or let the client request it when they open a chapter.
        return course;
    }

    /**
     * Phase C: Generate Content for a Specific Chapter (Incremental)
     */
    static async generateChapterContent(chapterId: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { concepts: true, module: { include: { course: true } } }
        });

        if (!chapter) throw new Error("Chapter not found");

        const filledConcepts = [];

        for (const concept of chapter.concepts) {
            if (concept.isReady) continue;

            const prompt = `
            You are an expert tutor using Neuroscience-based learning principles.

            Context:
            - Course: ${chapter.module.course.subject}
            - Module: ${chapter.module.title}
            - Chapter: ${chapter.title}
            - Concept: ${concept.title} (${concept.type})

            Task:
            Generate the specific learning content for this Micro-Concept.
            
            Type Specifics:
            - "priming": Focus on Hook, Analogy, and "Why this exists". NO deep explanation.
            - "core": Focus on minimal explanation + active recall question.
            - "application": Focus on a real-world scenario or code example.

            Output Format: JSON matching MicroConceptSchema.
            
            CRITICAL: Return ONLY valid JSON. 
            - Do NOT wrap content in HTML tags.
            - Do NOT wrap the output in markdown code blocks (e.g. \`\`\`json ... \`\`\`).
            - Just return the raw JSON object.
            `;

            console.log("prompt", prompt)

            try {
                const generated = await microConceptGenerator.invoke(prompt);

                // Update DB
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: generated.content as any, // Cast to JSON
                        isReady: true
                    }
                });
                filledConcepts.push(generated);
            } catch (error) {
                console.error(`Failed to generate content for concept ${concept.id}:`, error);
                // Continue to next concept without crashing
            }
        }

        return filledConcepts;
    }
}
