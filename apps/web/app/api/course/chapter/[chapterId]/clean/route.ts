import { prisma } from "@study-flow/db";
import { NextRequest, NextResponse } from "next/server";

// Helper to clean up JSON-wrapped content
function cleanContent(content: string): string {
    if (!content) return content;

    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.includes('"content"')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.content && typeof parsed.content === 'string') {
                return parsed.content;
            }
        } catch {
            // Not valid JSON, return original
        }
    }
    return content;
}

export async function POST(request: NextRequest) {
    try {
        const { chapterId } = await request.json();

        if (!chapterId) {
            return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
        }

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { concepts: true }
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        let cleanedCount = 0;

        for (const concept of chapter.concepts) {
            if (!concept.content) continue;

            const blocks = concept.content as any[];
            let needsUpdate = false;

            const cleanedBlocks = blocks.map((block: any) => {
                if (block.type === 'text' && block.content) {
                    const cleaned = cleanContent(block.content);
                    if (cleaned !== block.content) {
                        needsUpdate = true;
                        return { ...block, content: cleaned };
                    }
                }
                return block;
            });

            if (needsUpdate) {
                await prisma.concept.update({
                    where: { id: concept.id },
                    data: { content: cleanedBlocks }
                });
                cleanedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleaned ${cleanedCount} concepts`,
            chapterId
        });
    } catch (error) {
        console.error("[API] Error cleaning chapter:", error);
        return NextResponse.json(
            { error: "Failed to clean chapter content" },
            { status: 500 }
        );
    }
}
