import { InquisitorAgent } from "../agents/inquisitor-agent";
import { DirectorAgent } from "../agents/director-agent";
import { ProfessorAgent } from "../agents/professor-agent";
import { VisualizerAgent } from "../agents/visualizer-agent";
import { ReviewerAgent } from "../agents/reviewer-agent";
import { prisma } from "@study-flow/db";

/**
 * ChapterGenerationService
 * Handles real-time chapter content generation with streaming support
 */
export class ChapterGenerationService {
    private static director = new DirectorAgent();
    private static professor = new ProfessorAgent();
    private static visualizer = new VisualizerAgent();
    private static inquisitor = new InquisitorAgent();
    private static reviewer = new ReviewerAgent();

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

        for (const [index, concept] of conceptsToGenerate.entries()) {
            try {
                console.log(`\n--- [Concept ${index + 1}/${conceptsToGenerate.length}] "${concept.title}" ---`);

                // 1. Plan content structure
                const plan = await this.director.planContentBytes({
                    course: chapter.module.course.subject,
                    module: chapter.module.title,
                    concept: concept.title,
                    conceptType: concept.type
                });

                console.log(`[Director]  Plan: ${plan.length} blocks (${plan.map(p => p.role).join(' > ')})`);

                // 2. Generate blocks
                const blocks = await this.generateBlocks(concept, chapter, plan);

                // 3. Save
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: blocks,
                        isReady: blocks.length > 0
                    }
                });

                const failedCount = plan.length - blocks.length;
                if (failedCount > 0) {
                    console.log(`[Director]  PARTIALLY SAVED (${blocks.length}/${plan.length} succeeded)`);
                } else {
                    console.log(`[Director]  COMPLETED`);
                }

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

                // 1. Plan
                const plan = await this.director.planContentBytes({
                    course: chapter.module.course.subject,
                    module: chapter.module.title,
                    concept: concept.title,
                    conceptType: concept.type
                });

                callbacks.onProgress(`Planned ${plan.length} blocks for "${concept.title}"`);

                // 2. Generate blocks with streaming (Sequential for validation)
                let runningContext = "";
                const blocks: any[] = [];

                for (const [taskIndex, task] of plan.entries()) {
                    try {
                        const block = await this.generateSingleBlock(task, concept, chapter, runningContext);

                        if (block) {
                            blocks.push(block);
                            callbacks.onBlockComplete(concept.title, taskIndex, block);

                            // Accumulate context
                            if (block.type === 'text') {
                                runningContext += `\n\n[Section: ${task.variant}]\n${block.content}`;
                            } else if (block.type === 'visual') {
                                runningContext += `\n\n[Visual: ${block.caption}]`;
                            }
                        }
                    } catch (error) {
                        console.error(`Error generating block ${taskIndex}:`, error);
                    }
                }

                // 3. Save
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: {
                        content: blocks,
                        isReady: blocks.length > 0
                    }
                });

                callbacks.onConceptComplete(concept.title, blocks.length);

                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                callbacks.onError(
                    error instanceof Error ? error.message : 'Unknown error',
                    concept.title
                );
            }
        }

        callbacks.onProgress(`Completed in ${(Date.now() - startTime) / 1000}s`);
    }

    /**
     * Generate blocks for a concept (non-streaming)
     */
    /**
     * Generate blocks sequentially to allow context accumulation and cross-validation
     */
    private static async generateBlocks(concept: any, chapter: any, plan: any[]) {
        const blocks = [];
        let runningContext = ""; // Accumulates text content for validation context

        for (const [taskIndex, task] of plan.entries()) {
            console.log(`  > [Block ${taskIndex + 1}] ${task.role} (${task.variant || task.tool || 'quiz'})`);

            try {
                // Generate block with access to previous context
                const block = await this.generateSingleBlock(task, concept, chapter, runningContext);

                if (block && block.type !== 'error') {
                    blocks.push(block);

                    // Accumulate context for future validation
                    if (block.type === 'text') {
                        runningContext += `\n\n[Section: ${task.variant}]\n${block.content}`;
                    } else if (block.type === 'visual') {
                        runningContext += `\n\n[Visual: ${block.caption}]`;
                    }
                }
            } catch (error) {
                console.error(`  ✗ [Block ${taskIndex + 1}] Failed:`, error instanceof Error ? error.message : error);
            }
        }

        return blocks;
    }

    /**
     * Generate blocks with streaming callbacks
     * thie is for parrallal generation of blocks. (but curently i moved to sequential, so they have context of each other and write related content)
     */
    private static async generateBlocksStreaming(
        concept: any,
        chapter: any,
        plan: any[],
        onBlockComplete: (blockIndex: number, block: any) => void
    ) {
        const blocksPromises = plan.map(async (task, taskIndex) => {
            try {
                const block = await this.generateSingleBlock(task, concept, chapter);
                if (block) {
                    onBlockComplete(taskIndex, block);
                }
                return block;
            } catch (error) {
                return { type: 'error', message: `Failed to generate ${task.role}` };
            }
        });

        const blocksResults = await Promise.allSettled(blocksPromises);
        return blocksResults
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value)
            .filter(b => b !== null && b.type !== 'error');
    }

    /**
     * Generate a single content block
     */
    /**
     * Generate a single content block with Validation Loop
     */
    private static async generateSingleBlock(task: any, concept: any, chapter: any, previousContext: string = "") {
        let attempts = 0;
        const MAX_RETRIES = 2; // 1 initial + 1 retry

        while (attempts < MAX_RETRIES) {
            attempts++;

            // --- GENERATION PHASE ---
            let blockData = null;

            if (task.role === 'text') {
                const textContent = await this.professor.generateText({
                    concept: concept.title,
                    course: chapter.module.course.subject,
                    variant: task.variant,
                    instruction: task.instruction
                });
                blockData = { type: 'text', variant: task.variant, content: textContent };

            } else if (task.role === 'visual') {
                const visualData = await this.visualizer.generateVisual({
                    concept: concept.title,
                    tool: task.tool,
                    instruction: task.instruction
                });
                blockData = { type: 'visual', tool: task.tool, code: visualData.code, caption: visualData.caption };
                // Visuals handled by their own internal loop in regenerateVisualBlock, 
                // but initial generation here is still single-pass. 
                // We'll leave visual validation to the dedicated regenerate flow for now to save tokens,
                // OR we could call reviewVisual here. Let's stick to text/quiz validation as requested.

            } else if (task.role === 'recall_question') {
                const quizData = await this.inquisitor.generateQuestion({
                    concept: concept.title,
                    instruction: task.instruction,
                    variant: task.variant || 'flashcard'
                });
                blockData = { type: 'quiz', variant: task.variant || 'flashcard', ...quizData };
            }

            if (!blockData) return null;

            // --- VALIDATION PHASE ---
            // Only validate Text and Quiz
            if (blockData.type === 'text' || blockData.type === 'quiz') {
                console.log(`  [Validator] Checking ${blockData.type}...`);
                const review = await this.reviewer.validateContent({
                    type: blockData.type as 'text' | 'quiz',
                    content: blockData.type === 'text' ? blockData.content : blockData,
                    knowledgeContext: previousContext
                });

                if (review.isApproved) {
                    // console.log(`   [Validator] Approved.`);
                    return blockData;
                } else {
                    console.warn(`   [Validator] Rejected: ${review.feedback}`);
                    // Add feedback to instruction for retry
                    if (task.instruction) {
                        task.instruction += ` IMPORTANT: Previous version rejected. Fix: ${review.feedback}`;
                    } else {
                        task.instruction = `Fix: ${review.feedback}`;
                    }
                    // Loop continues...
                }
            } else {
                return blockData; // Visuals pass through (reviewed elsewhere/later)
            }
        }

        console.warn(`  [Validator] Max retries reached for ${task.role}.`);
        return null; // Or return the last attempt? usually null indicates failure to the caller.
    }
    /**
     * Regenerate a single visual block
     */
    static async regenerateVisualBlock(conceptId: string, blockIndex: number, userFeedback?: string) {
        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            include: { chapter: { include: { module: { include: { course: true } } } } }
        });

        if (!concept || !Array.isArray(concept.content)) throw new Error("Concept or content not found");

        const content = [...concept.content] as any[];
        const block = content[blockIndex];

        if (!block || block.type !== 'visual') throw new Error("Block is not a visual");

        const chapter = concept.chapter;

        // Create full context string from the entire lesson content
        const contextString = content.map((b, i) => {
            const isTarget = i === blockIndex;
            const prefix = isTarget ? ">>> TARGET VISUAL TO REGENERATE <<<" : `[${b.type}]`;
            const contentStr = b.content || b.question || b.caption || '';
            return `${prefix}\n${contentStr}`;
        }).join('\n\n');

        // Initial Regeneration Attempt
        console.log(`[VisualGen]  Attempting regeneration for concept "${concept.title}"...`);

        let instruction = "REGENERATE this visual. The previous version had issues. Create a definitive, perfect version now.";

        if (userFeedback) {
            console.log(`[VisualGen] User Feedback received: "${userFeedback}"`);
            console.log(`[VisualGen] Translating feedback via Reviewer...`);
            const technicalInstruction = await this.reviewer.translateUserFeedback({
                concept: concept.title,
                userFeedback,
                currentCode: typeof block.code === 'string' ? block.code : JSON.stringify(block.code)
            });
            console.log(`[VisualGen]  Technical Instruction: "${technicalInstruction}"`);
            instruction = `USER FEEDBACK APPLIED: ${technicalInstruction}. fix the previous code based on this.`;
        }

        let visualData = await this.visualizer.generateVisual({
            concept: concept.title,
            tool: block.tool,
            instruction,
            surroundingContext: contextString,
            previousCode: typeof block.code === 'string' ? block.code : JSON.stringify(block.code)
        });

        // Review Cycle (Loop with Max Retries)
        let attempts = 0;
        const MAX_ATTEMPTS = 3;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            console.log(`[VisualGen] Reviewing candidate visual (Attempt ${attempts}/${MAX_ATTEMPTS})...`);

            const review = await this.reviewer.reviewVisual({
                concept: concept.title,
                tool: block.tool,
                code: visualData.code,
                instruction: instruction
            });

            if (review.isApproved) {
                console.log(`[VisualGen]  Review Approved.`);
                break;
            }

            console.log(`[VisualGen]  Review Rejected: ${review.feedback}`);

            if (attempts >= MAX_ATTEMPTS) {
                console.warn(`[VisualGen]  Max retries reached. Saving last attempt despite errors.`);
                break;
            }

            console.log(`[VisualGen]  Applying Fixes...`);

            // Fix Attempt
            visualData = await this.visualizer.generateVisual({
                concept: concept.title,
                tool: block.tool,
                instruction: `FIX CRITICAL ISSUES found by QA: ${review.feedback}. Previous code IS PROVIDED. Fix these specific errors.`,
                surroundingContext: contextString,
                previousCode: visualData.code // Pass the candidate that failed review
            });
        }

        content[blockIndex] = {
            ...block,
            code: visualData.code,
            caption: visualData.caption
        };

        await prisma.concept.update({
            where: { id: conceptId },
            data: { content }
        });

        return content[blockIndex];
    }
}
