
import { prisma } from "@study-flow/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ cardId: string }> }
) {
    try {
        const { cardId } = await params;
        const { rating } = await req.json(); // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

        // Fetch current state
        const card = await prisma.flashcard.findUnique({
            where: { id: cardId }
        });

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // SuperMemo-2 (SM-2) Adaptation
        // Rating 1 = Fail, 2 = Hard, 3 = Good, 4 = Easy
        // We map 1->1, 2->3, 3->4, 4->5 for standard SM-2 quality (0-5)
        const quality = rating === 1 ? 0 : rating === 2 ? 3 : rating === 3 ? 4 : 5;

        let { box, interval, easeFactor } = card;

        if (quality < 3) {
            // Failed (Again)
            box = 0;
            interval = 1;
        } else {
            // Passed
            if (box === 0) {
                interval = 1;
            } else if (box === 1) {
                interval = 6;
            } else {
                interval = Math.ceil(interval * easeFactor);
            }
            box += 1;

            // Update Ease Factor
            // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (easeFactor < 1.3) easeFactor = 1.3;
        }

        // Calculate Next Review Date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        // Update DB
        const updatedCard = await prisma.flashcard.update({
            where: { id: cardId },
            data: {
                box,
                interval,
                easeFactor,
                nextReview
            }
        });

        return NextResponse.json(updatedCard);
    } catch (error) {
        console.error("Failed to update flashcard progress", error);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}
