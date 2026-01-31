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

                // Extract source text from course if available
                const sourceData = chapter.module.course.sourceData as any;
                const sourceText = sourceData?.sourceText || sourceData?.text || '';

                // INVOKE THE GRAPH
                const result = await chapterGeneratorGraph.invoke({
                    courseContext: chapter.module.course.subject,
                    chapterTitle: chapter.title,
                    conceptTitle: concept.title,
                    conceptType: concept.type,
                    sourceText: sourceText,
                    // Initial State
                    plan: [],
                    currentTaskIndex: 0,
                    blocks: [],
                    runningContext: "",
                    errors: [],
                    detectedDomain: "",
                    requiredArtifacts: "",
                    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
                }, { recursionLimit: 100 });

                const blocks = result.blocks || [];
                const tokens = result.tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
                console.log(`[Graph] Completed with ${blocks.length} blocks | Tokens: ${tokens.totalTokens} (in: ${tokens.inputTokens}, out: ${tokens.outputTokens})`);

                // Save
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: blocks,
                        isReady: blocks.length > 0
                    }
                });

                // Extract and Save Flashcards
                await this.saveFlashcardsForConcept(blocks, chapter.module.course.id, chapter.id, concept.id);

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

        // Chapter-level token tracking
        let chapterTokens = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

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

                // Extract source text from course if available
                const sourceData = chapter.module.course.sourceData as any;
                const sourceText = sourceData?.sourceText || sourceData?.text || '';

                // Create the stream with "values" mode to get full state accumulation
                const stream = await chapterGeneratorGraph.stream({
                    courseContext: chapter.module.course.subject,
                    chapterTitle: chapter.title,
                    conceptTitle: concept.title,
                    conceptType: concept.type,
                    sourceText: sourceText,
                    plan: [],
                    currentTaskIndex: 0,
                    blocks: [],
                    runningContext: "",
                    // Reviewer State
                    currentDraft: null,
                    feedback: null,
                    retryCount: 0,
                    errors: [],
                    detectedDomain: "",
                    requiredArtifacts: "",
                    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
                }, { streamMode: "values", recursionLimit: 100 });

                let finalBlocks: any[] = [];
                let finalTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

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

                    // Track token usage from state
                    if (currentState.tokenUsage) {
                        finalTokenUsage = currentState.tokenUsage;
                    }
                }

                console.log(`[Concept] "${concept.title}" complete: ${finalBlocks.length} blocks | Tokens: ${finalTokenUsage.totalTokens} (in: ${finalTokenUsage.inputTokens}, out: ${finalTokenUsage.outputTokens})`);

                // Accumulate chapter-level tokens
                chapterTokens.inputTokens += finalTokenUsage.inputTokens;
                chapterTokens.outputTokens += finalTokenUsage.outputTokens;
                chapterTokens.totalTokens += finalTokenUsage.totalTokens;

                // Final Save - finalBlocks is already populated from the loop
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: finalBlocks,
                        isReady: finalBlocks.length > 0
                    }
                });

                // Extract and Save Flashcards
                await this.saveFlashcardsForConcept(finalBlocks, chapter.module.course.id, chapter.id, concept.id);

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

        const duration = (Date.now() - startTime) / 1000;
        callbacks.onProgress(`Completed in ${duration}s`);
        console.log(`[ChapterGen] Chapter "${chapter.title}" complete!`);
        console.log(`[ChapterGen] Total: ${conceptsToGenerate.length} concepts | ${chapterTokens.totalTokens} tokens (in: ${chapterTokens.inputTokens}, out: ${chapterTokens.outputTokens}) | ${duration}s`);
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

    /**
     * Regenerate a specific visual block based on user feedback
     */
    static async regenerateVisualBlock(
        conceptId: string,
        blockIndex: number,
        feedback: string
    ) {
        // 1. Fetch Concept
        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            include: { chapter: { include: { module: { include: { course: true } } } } }
        });
        if (!concept) throw new Error("Concept not found");

        const blocks = concept.content as any[];
        const currentBlock = blocks[blockIndex];

        if (!currentBlock || currentBlock.type !== 'visual') {
            throw new Error("Invalid block for visual regeneration");
        }

        console.log(`[RegenerateVisual] Updating ${currentBlock.tool} block with feedback: "${feedback}"`);

        // 2. Setup AI
        const { AIModelFactory } = await import("../model-factory");
        const { z } = await import("zod");

        const visualizerModel = AIModelFactory.createModel({
            provider: "google",
            model: "gemini-2.0-flash",
            temperature: 0.4
        });

        // 3. Define Schemas (Mirroring generator.ts)
        const VisualOutput = z.object({
            code: z.string().describe("The updated visualization code/JSON. Raw string/JSON only."),
            caption: z.string().describe("Brief caption explaining the diagram")
        });

        // 4. Construct Prompt
        const systemPrompt = `You are a specialized Visualization Engineer. 
        Your task is to FIX or IMPROVE a specific diagram based on user feedback.
        
        CONTEXT: ${concept.chapter.module.course.subject} - ${concept.title}
        TOOL: ${currentBlock.tool} (You MUST output code compatible with this tool)
        
        RULES:
        - MAFS: Output strictly valid JSON structure: { type: 'plot', items: [...], domain: {...} }. NO JSX.
        - MERMAID: Use 'graph TD' or 'sequenceDiagram'. Quote all labels: A["Label"].
        - SVG: Return raw <svg> markup. No markdown fences.
        - general: NO explanation text, just the JSON/Code object.
        
        PREVIOUS CODE:
        ${currentBlock.code}
        
        USER FEEDBACK:
        "${feedback}"
        
        Generate the corrected code/data.`;

        // 5. Invoke AI
        const chain = visualizerModel.withStructuredOutput(VisualOutput);
        const result = await chain.invoke(systemPrompt);

        // 6. Update Block & DB
        blocks[blockIndex] = {
            ...currentBlock,
            code: result.code,
            caption: result.caption
        };

        await prisma.concept.update({
            where: { id: conceptId },
            data: { content: blocks }
        });

        console.log(`[RegenerateVisual] Success. New code length: ${result.code.length}`);
        return blocks[blockIndex];
    }


    /**
     * Helper: Save generated quiz blocks as Flashcards
     */
    private static async saveFlashcardsForConcept(blocks: any[], courseId: string, chapterId: string, conceptId: string) {
        const flashcardBlocks = blocks.filter(b => b.type === 'quiz' || b.type === 'recall_question');

        if (flashcardBlocks.length > 0) {
            try {
                // Clear existing cards for this concept to avoid duplicates on regeneration
                await prisma.flashcard.deleteMany({ where: { conceptId } });

                console.log(`[Flashcards] Saving ${flashcardBlocks.length} cards for concept: ${conceptId}`);
                await prisma.flashcard.createMany({
                    data: flashcardBlocks.map(block => ({
                        courseId,
                        chapterId,
                        conceptId,
                        front: block.question,
                        back: block.answer,
                        explanation: block.explanation,
                        type: block.variant === 'code' ? 'code' : 'basic',
                    }))
                });
            } catch (e) {
                console.error("[Flashcards] Failed to save flashcards:", e);
            }
        }
    }
}
