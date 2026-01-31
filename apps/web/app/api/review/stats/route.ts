
import { prisma } from "@study-flow/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Get all flashcards for user's courses that are due
        const dueFlashcards = await prisma.flashcard.findMany({
            where: {
                course: {
                    userId: session.user.id
                },
                due: {
                    lte: now
                }
            },
            select: {
                id: true,
                courseId: true,
                state: true,
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        // Group by course
        const byCourse: Record<string, { id: string; title: string; dueCount: number; newCount: number }> = {};

        dueFlashcards.forEach(card => {
            if (!byCourse[card.courseId]) {
                byCourse[card.courseId] = {
                    id: card.course.id,
                    title: card.course.title,
                    dueCount: 0,
                    newCount: 0
                };
            }
            byCourse[card.courseId].dueCount++;
            if (card.state === 0) {
                byCourse[card.courseId].newCount++;
            }
        });

        // Get total stats
        const totalCards = await prisma.flashcard.count({
            where: {
                course: {
                    userId: session.user.id
                }
            }
        });

        const masteredCards = await prisma.flashcard.count({
            where: {
                course: {
                    userId: session.user.id
                },
                state: 2, // Review state = learned/mature
                stability: {
                    gte: 30 // High stability = well memorized
                }
            }
        });

        return NextResponse.json({
            totalDue: dueFlashcards.length,
            totalCards,
            masteredCards,
            newCards: dueFlashcards.filter(c => c.state === 0).length,
            courses: Object.values(byCourse).sort((a, b) => b.dueCount - a.dueCount)
        });
    } catch (error) {
        console.error("Failed to fetch review stats", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
