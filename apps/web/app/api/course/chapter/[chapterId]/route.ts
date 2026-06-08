import { prisma } from "@study-flow/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, userOwnsChapter } from "@/lib/course-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    try {
        const { chapterId } = await params;
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsChapter(userId, chapterId)) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        if (!chapterId) {
            return NextResponse.json(
                { error: "Chapter ID is required" },
                { status: 400 }
            );
        }

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                concepts: {
                    orderBy: { order: 'asc' }
                },
                module: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                subject: true
                            }
                        }
                    }
                }
            }
        });

        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Format the response
        const response = {
            id: chapter.id,
            title: chapter.title,
            order: chapter.order,
            module: {
                id: chapter.module.id,
                title: chapter.module.title
            },
            course: chapter.module.course,
            concepts: chapter.concepts.map(concept => ({
                id: concept.id,
                title: concept.title,
                type: concept.type,
                order: concept.order,
                isReady: concept.isReady,
                content: concept.content
            })),
            stats: {
                totalConcepts: chapter.concepts.length,
                readyConcepts: chapter.concepts.filter(c => c.isReady).length,
                totalBlocks: chapter.concepts.reduce((acc, c) => {
                    const content = c.content as any[] || [];
                    return acc + content.length;
                }, 0)
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[API] Error fetching chapter:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapter content" },
            { status: 500 }
        );
    }
}
