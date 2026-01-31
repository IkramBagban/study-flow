import { prisma } from "@study-flow/db";
import { NextRequest, NextResponse } from "next/server";
import { FSRS, Rating, State, type FSRSCard } from "@/lib/fsrs";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ cardId: string }> }
) {
    try {
        const { cardId } = await params;
        const { rating } = await req.json(); // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

        // Validate rating
        if (!rating || rating < 1 || rating > 4) {
            return NextResponse.json({ error: "Invalid rating. Must be 1-4" }, { status: 400 });
        }

        // Fetch current card state
        const card = await prisma.flashcard.findUnique({
            where: { id: cardId }
        });

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Convert Prisma card to FSRS card format
        const fsrsCard: FSRSCard = {
            due: card.due,
            stability: card.stability,
            difficulty: card.difficulty,
            elapsedDays: card.elapsedDays,
            scheduledDays: card.scheduledDays,
            reps: card.reps,
            lapses: card.lapses,
            state: card.state as State,
            lastReview: card.lastReview
        };

        // Run FSRS algorithm
        const fsrs = new FSRS();
        const now = new Date();
        const result = fsrs.next(fsrsCard, now, rating as Rating);
        const newCard = result.card;

        // Update database with new FSRS state
        const updatedCard = await prisma.flashcard.update({
            where: { id: cardId },
            data: {
                due: newCard.due,
                stability: newCard.stability,
                difficulty: newCard.difficulty,
                elapsedDays: newCard.elapsedDays,
                scheduledDays: newCard.scheduledDays,
                reps: newCard.reps,
                lapses: newCard.lapses,
                state: newCard.state,
                lastReview: newCard.lastReview
            }
        });

        // Return updated card with scheduling info
        return NextResponse.json({
            card: updatedCard,
            nextReviewIn: newCard.scheduledDays > 0
                ? `${newCard.scheduledDays} day${newCard.scheduledDays !== 1 ? 's' : ''}`
                : 'soon',
            state: State[newCard.state]
        });
    } catch (error) {
        console.error("Failed to update flashcard progress", error);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}
