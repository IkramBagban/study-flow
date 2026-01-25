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

        // Filter for concepts that need generation
        const conceptsToGenerate = chapter.concepts.filter(c => !c.isReady);
        console.log(`[CourseService] Generating content for ${conceptsToGenerate.length} concepts in Chapter: ${chapter.title}`);

        if (conceptsToGenerate.length === 0) {
            console.log(`[CourseService] All concepts ready. Skipping generation.`);
            return [];
        }

        const startTime = Date.now();

        // Generate in parallel (limit concurrency if needed, but 5-10 is fine for this scale)
        const generatePromises = conceptsToGenerate.map(async (concept, index) => {
            console.log(`[CourseService] Starting concept ${index + 1}: ${concept.title}`);
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
            {
                "id": "...",
                "title": "...",
                "type": "...",
                "content": {
                    "hook": "...",
                    "explanation": "...",
                    "example": "...",
                    "visual": {
                        "type": "mermaid", // or "none"
                        "code": "graph TD; A-->B;",
                        "caption": "Flowchart of the process"
                    }
                },
                "recallQuestion": { ... }
            }
            
            VISUALIZATION RULES:
            - Diagrams should NOT be separate widgets. They should visually EXPLAIN the text content.
            - If you explain a process (e.g., Event Loop, Photosynthesis) -> CREATE A DIAGRAM.
            - YOU are the designer. Decide the best layout (TD, LR), node shapes, and COLORS.
            - Use Mermaid 'classDef' to style nodes meaningfully (e.g., 'classDef error fill: #f87171, color: white; ').
            - Apply colors to highlight key parts of the system (don't make it monochrome).
            - 'caption' should connect the diagram back to the text.
            - If no visual is needed, set "visual": { "type": "none", "code": "", "caption": "" }.

            CRITICAL: Return ONLY valid JSON.
            `;

            try {
                // Use raw model invoke to avoid StructuredOutput parsing issues
                const result = await model.invoke(prompt);
                const text = result.content.toString();

                // Manually clean the output
                const cleaned = text.replace(/```(?:json|javascript)?/g, "").replace(/```/g, "").trim();
                const json = JSON.parse(cleaned);

                // Update DB
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: json.content,
                        isReady: true
                    }
                });
                console.log(`[CourseService] Finished concept: ${concept.title}`);
                return json;
            } catch (error) {
                console.error(`[CourseService] Failed to generate content for concept ${concept.id}:`, error);
                return null;
            }
        });

        await Promise.all(generatePromises);
        console.log(`[CourseService] Chapter generation completed in ${(Date.now() - startTime) / 1000}s`);

        // Return mostly for structure, though the page re-fetches from DB
        return [];
    }
}
