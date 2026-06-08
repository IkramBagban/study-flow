import { NextRequest, NextResponse } from "next/server";
import { ChapterGenerationService } from "@/lib/ai/services/chapter-generation-service";
import { getSessionUserId, userOwnsConcept } from "@/lib/course-auth";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ conceptId: string; blockIndex: string }> }
) {
    const { conceptId, blockIndex } = await props.params;

    try {
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsConcept(userId, conceptId)) {
            return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const { feedback } = body;

        const updatedBlock = await ChapterGenerationService.regenerateVisualBlock(
            conceptId,
            parseInt(blockIndex),
            feedback
        );

        return NextResponse.json({ success: true, block: updatedBlock });
    } catch (error) {
        console.error("[Regenerate Visual] Failed:", error);
        return NextResponse.json({ error: "Failed to regenerate visual" }, { status: 500 });
    }
}
