import { prisma } from "@study-flow/db";

/**
 * ChapterGenerationService
 * Handles real-time chapter content generation using LangGraph Engine
 */
export class ChapterGenerationService {
    // Legacy agents removed in favor of Graph Nodes


    /**
     * Generate content for a chapter (non-streaming)
     */
    static async generateChapterContent(chapterId: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { concepts: true, module: { include: { course: true } } }
        });

        if (!chapter) throw new Error("Chapter not found");

        const conceptsToGenerate = chapter.concepts.filter(c => !c.isReady);
        console.log(`\n[ChapterGen] Starting: "${chapter.title}" (${conceptsToGenerate.length} concepts)`);

        if (conceptsToGenerate.length === 0) return [];

        const startTime = Date.now();

        // Import the graph dynamically to ensure env vars are loaded
        const { chapterGeneratorGraph } = await import("../engine/graph");

        for (const [index, concept] of conceptsToGenerate.entries()) {
            try {
                console.log(`\n--- [Concept ${index + 1}/${conceptsToGenerate.length}] "${concept.title}" ---`);

                // INVOKE THE GRAPH
                const result = await chapterGeneratorGraph.invoke({
                    courseContext: chapter.module.course.subject,
                    chapterTitle: chapter.title,
                    conceptTitle: concept.title,
                    conceptType: concept.type,
                    // Initial State
                    plan: [],
                    currentTaskIndex: 0,
                    blocks: [],
                    runningContext: "",
                    errors: []
                }, { recursionLimit: 100 });

                const blocks = result.blocks || [];
                console.log(`[Graph] Completed with ${blocks.length} blocks.`);

                // Save
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: blocks,
                        isReady: blocks.length > 0
                    }
                });

                await new Promise(r => setTimeout(r, 1000)); // Rate limit

            } catch (error) {
                console.error(`[Director]  Failed concept "${concept.title}":`, error);
            }
        }

        console.log(`\n[ChapterGen]  Completed in ${(Date.now() - startTime) / 1000}s`);
        return [];
    }

    /**
     * Generate content for a chapter with streaming callbacks
     */
    static async generateChapterContentStream(
        chapterId: string,
        callbacks: {
            onConceptStart: (conceptTitle: string, index: number, total: number) => void;
            onBlockComplete: (conceptTitle: string, blockIndex: number, block: any) => void;
            onConceptComplete: (conceptTitle: string, blocksCount: number) => void;
            onError: (error: string, conceptTitle?: string) => void;
            onProgress: (message: string) => void;
        }
    ) {
        const startTime = Date.now();
        const { chapterGeneratorGraph } = await import("../engine/graph");

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { concepts: true, module: { include: { course: true } } }
        });

        if (!chapter) throw new Error("Chapter not found");

        const conceptsToGenerate = chapter.concepts.filter(c => !c.isReady);

        callbacks.onProgress(`Starting ${conceptsToGenerate.length} concepts`);

        if (conceptsToGenerate.length === 0) {
            callbacks.onProgress('No concepts to generate');
            return;
        }

        for (const [index, concept] of conceptsToGenerate.entries()) {
            try {
                callbacks.onConceptStart(concept.title, index + 1, conceptsToGenerate.length);

                // Initialize State Tracking
                let previousBlocksCount = 0;

                // Create the stream
                // Create the stream with "values" mode to get full state accumulation
                const stream = await chapterGeneratorGraph.stream({
                    courseContext: chapter.module.course.subject,
                    chapterTitle: chapter.title,
                    conceptTitle: concept.title,
                    conceptType: concept.type,
                    plan: [],
                    currentTaskIndex: 0,
                    blocks: [],
                    runningContext: "",
                    // Reviewer State
                    currentDraft: null,
                    feedback: null,
                    retryCount: 0,
                    errors: []
                }, { streamMode: "values", recursionLimit: 100 });

                let finalBlocks: any[] = [];

                // Process Stream Updates (Values Mode)
                for await (const chunk of stream) {
                    // In 'values' mode, chunk IS the state
                    const currentState = chunk as any;

                    if (currentState.blocks) {
                        const currentBlocks = currentState.blocks;
                        if (currentBlocks.length > previousBlocksCount) {
                            // Identify newly added blocks
                            const newBlocks = currentBlocks.slice(previousBlocksCount);
                            for (const block of newBlocks) {
                                callbacks.onBlockComplete(concept.title, previousBlocksCount, block);
                                previousBlocksCount++; // Increment localized counter
                            }
                        }
                        finalBlocks = currentBlocks;
                    }
                }

                // Final Save - finalBlocks is already populated from the loop
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: finalBlocks,
                        isReady: finalBlocks.length > 0
                    }
                });

                callbacks.onConceptComplete(concept.title, finalBlocks.length);
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.error("Stream Error:", error);
                callbacks.onError(
                    error instanceof Error ? error.message : 'Unknown error',
                    concept.title
                );
            }
        }

        callbacks.onProgress(`Completed in ${(Date.now() - startTime) / 1000}s`);
        console.log(`[ChapterGen] ✅ Chapter "${chapter.title}" fully generated!`);
    }
    /**
     * Regenerate a single block logic (Inline modern implementation)
     */
    static async regenerateBlock(
        conceptId: string,
        blockIndex: number,
        userFeedback: string,
        currentBlock: any
    ) {
        // Fetch context
        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            include: { chapter: { include: { module: { include: { course: true } } } } }
        });
        if (!concept) throw new Error("Concept not found");

        const { AIModelFactory } = await import("../model-factory");
        const { z } = await import("zod");

        // Use standard model
        const model = AIModelFactory.createModel({ provider: "google", model: "gemini-2.0-flash" });

        if (currentBlock.type === 'text') {
            const TextOutputSchema = z.object({ content: z.string() });
            const chain = model.withStructuredOutput(TextOutputSchema);

            const prompt = `Rewrite this section based on feedback.
             Context: ${concept.chapter.module.course.subject} - ${concept.title}
             Original: ${currentBlock.content}
             Feedback: ${userFeedback}`;

            const result = await chain.invoke(prompt);
            const newContent = [...(concept.content as any[])];
            newContent[blockIndex] = { ...currentBlock, content: result.content };

            await prisma.concept.update({
                where: { id: conceptId },
                data: { content: newContent }
            });

            return newContent[blockIndex];
        }

        // Placeholder for Visual/Quiz regeneration if needed
        return currentBlock;
    }
}
