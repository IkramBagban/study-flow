
import { prisma } from "@study-flow/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, userOwnsChapterInCourse, userOwnsCourse } from "@/lib/course-auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsCourse(userId, courseId)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const flashcards = await prisma.flashcard.findMany({
            where: { courseId },
            orderBy: { createdAt: 'desc' },
            include: {
                chapter: {
                    select: { id: true, title: true }
                }
            }
        });

        return NextResponse.json(flashcards);
    } catch (error) {
        console.error("Failed to fetch flashcards", error);
        return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const body = await req.json();
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsCourse(userId, courseId)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (body.chapterId && !await userOwnsChapterInCourse(userId, courseId, body.chapterId)) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Validated by Zod in frontend/service ideally, but basic check here
        if (!body.front || !body.back) {
            return NextResponse.json({ error: "Missing front or back" }, { status: 400 });
        }

        const flashcard = await prisma.flashcard.create({
            data: {
                courseId,
                front: body.front,
                back: body.back,
                explanation: body.explanation,
                type: body.type || "basic",
                chapterId: body.chapterId
            }
        });

        return NextResponse.json(flashcard);
    } catch (error) {
        console.error("Failed to create flashcard", error);
        return NextResponse.json({ error: "Failed to create flashcard" }, { status: 500 });
    }
}
