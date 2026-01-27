import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await props.params;

    try {
        // Reset all concepts in the chapter
        await prisma.concept.updateMany({
            where: { chapterId },
            data: {
                content: [],
                isReady: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Regenerate] Failed:", error);
        return NextResponse.json({ error: "Failed to reset chapter content" }, { status: 500 });
    }
}
