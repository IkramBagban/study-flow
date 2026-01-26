import { NextRequest } from "next/server";
import { CourseService } from "@/lib/ai/course-service";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { chapterId } = await req.json();

    // Create a readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                console.log('[SSE] Starting chapter generation stream for:', chapterId);

                // Helper to send SSE events
                const sendEvent = (event: string, data: any) => {
                    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                };

                // Create callbacks for the CourseService
                const callbacks = {
                    onConceptStart: (conceptTitle: string, index: number, total: number) => {
                        sendEvent('concept-start', { conceptTitle, index, total });
                    },
                    onBlockComplete: (conceptTitle: string, blockIndex: number, block: any) => {
                        sendEvent('block-complete', { conceptTitle, blockIndex, block });
                    },
                    onConceptComplete: (conceptTitle: string, blocksCount: number) => {
                        sendEvent('concept-complete', { conceptTitle, blocksCount });
                    },
                    onError: (error: string, conceptTitle?: string) => {
                        sendEvent('error', { error, conceptTitle });
                    },
                    onProgress: (message: string) => {
                        sendEvent('progress', { message });
                    }
                };

                // Generate chapter with streaming callbacks
                await CourseService.generateChapterContentStream(chapterId, callbacks);

                // Send final completion event
                sendEvent('complete', { chapterId });

                controller.close();
            } catch (error) {
                console.error('[SSE] Stream error:', error);
                const errorMessage = `event: error\ndata: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`;
                controller.enqueue(encoder.encode(errorMessage));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
