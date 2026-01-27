import { NextRequest, NextResponse } from "next/server";
import { ChapterGenerationService } from "@/lib/ai/services/chapter-generation-service";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ conceptId: string; blockIndex: string }> }
) {
    const { conceptId, blockIndex } = await props.params;

    try {
        const updatedBlock = await ChapterGenerationService.regenerateVisualBlock(
            conceptId,
            parseInt(blockIndex)
        );

        return NextResponse.json({ success: true, block: updatedBlock });
    } catch (error) {
        console.error("[Regenerate Visual] Failed:", error);
        return NextResponse.json({ error: "Failed to regenerate visual" }, { status: 500 });
    }
}
