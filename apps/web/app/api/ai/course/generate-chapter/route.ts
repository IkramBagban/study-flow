
import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/lib/ai/course-service";

export const maxDuration = 60; // Allow 60 seconds for AI generation

export async function POST(req: NextRequest) {
    try {
        const { chapterId } = await req.json();

        if (!chapterId) {
            return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
        }

        console.log(`[API] Generating content for chapter: ${chapterId}`);
        const result = await CourseService.generateChapterContent(chapterId);

        return NextResponse.json({ success: true, count: result.length });
    } catch (error) {
        console.error("[API] Chapter generation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
