import { InquisitorAgent } from "../agents/inquisitor-agent";
import { DirectorAgent } from "../agents/director-agent";
import { ProfessorAgent } from "../agents/professor-agent";
import { VisualizerAgent } from "../agents/visualizer-agent";
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

                console.log(`[Director] 📋 Plan: ${plan.length} blocks (${plan.map(p => p.role).join(' > ')})`);

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
                    console.log(`[Director] ⚠️  PARTIALLY SAVED (${blocks.length}/${plan.length} succeeded)`);
                } else {
                    console.log(`[Director] ✅ COMPLETED`);
                }

                await new Promise(r => setTimeout(r, 1000)); // Rate limit

            } catch (error) {
                console.error(`[Director] ❌ Failed concept "${concept.title}":`, error);
            }
        }

        console.log(`\n[ChapterGen] 🎉 Completed in ${(Date.now() - startTime) / 1000}s`);
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

                // 2. Generate blocks with streaming
                const blocks = await this.generateBlocksStreaming(
                    concept,
                    chapter,
                    plan,
                    (blockIndex, block) => callbacks.onBlockComplete(concept.title, blockIndex, block)
                );

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
    private static async generateBlocks(concept: any, chapter: any, plan: any[]) {
        const blocksPromises = plan.map(async (task, taskIndex) => {
            console.log(`  > [Block ${taskIndex + 1}] ${task.role} (${task.variant || task.tool || 'quiz'})`);

            try {
                return await this.generateSingleBlock(task, concept, chapter);
            } catch (error) {
                console.error(`  ✗ [Block ${taskIndex + 1}] Failed:`, error instanceof Error ? error.message : error);
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
     * Generate blocks with streaming callbacks
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
    private static async generateSingleBlock(task: any, concept: any, chapter: any) {
        switch (task.role) {
            case 'text':
                const textContent = await this.professor.generateText({
                    concept: concept.title,
                    course: chapter.module.course.subject,
                    variant: task.variant,
                    instruction: task.instruction
                });
                return {
                    type: 'text',
                    variant: task.variant,
                    content: textContent
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
                const quizData = await this.inquisitor.generateQuestion({
                    concept: concept.title,
                    instruction: task.instruction
                });
                return {
                    type: 'quiz',
                    ...quizData
                };

            default:
                return null;
        }
    }
}
