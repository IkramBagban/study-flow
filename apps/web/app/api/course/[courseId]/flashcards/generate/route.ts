
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { AIModelFactory } from "@/lib/ai/model-factory";
import { z } from "zod";

const FlashcardSchema = z.object({
    front: z.string().describe("The question or prompt on the front of the card"),
    back: z.string().describe("The answer on the back"),
    explanation: z.string().describe("A brief explanation or context"),
    type: z.enum(["basic", "code", "math", "concept"]).describe("The type of flashcard")
});

const FlashcardBatch = z.object({
    flashcards: z.array(FlashcardSchema)
});

const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const { chapterId, count = 7 } = await req.json();

        if (!chapterId) {
            return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
        }

        // 1. Fetch Chapter Content to use as context
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                concepts: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // 2. Prepare Context
        // Concatenate concept titles and some content (simplified)
        const contextText = chapter.concepts.map(c => {
            // Extract text from content blocks if possible, or just use titles
            const blocks = Array.isArray(c.content) ? c.content : [];
            const textContent = blocks.map((b: any) =>
                b.type === 'text' ? b.content :
                    b.type === 'quiz' ? `Q: ${b.question} A: ${b.answer}` : ''
            ).join('\n');
            return `Concept: ${c.title}\n${textContent}`;
        }).join('\n\n');

        // 3. Generate Flashcards
        const prompt = `
        You are an expert educator. Generate ${count} high-quality flashcards for the following material.
        Focus on key concepts, definitions, and application.
        
        Material:
        ${contextText.substring(0, 10000)} // Truncate if too long (max context)
    `;

        const result = await model.withStructuredOutput(FlashcardBatch, { includeRaw: true }).invoke(prompt);

        if (!result.parsed || result.parsed.flashcards.length === 0) {
            console.error("[GenerateFlashcards] Raw LLM Output:", JSON.stringify(result.raw, null, 2));
            throw new Error("Failed to generate flashcards - invalid format");
        }

        // 4. Save to DB
        // We link them to the first concept of the chapter for now, or just the chapter if we made the schema flexible.
        // Schema has conceptId? Yes.
        // We should probably distribute them or just link to the first concept?
        // Let's link to the first concept or create a "REVIEW" concept?
        // Actually, flashcards are linked to Chapter AND Concept.
        // Let's just pick the first ready concept or random ones.
        // For simplicity, link to the first concept.
        const targetConceptId = chapter.concepts[0]?.id;

        if (!targetConceptId) {
            return NextResponse.json({ error: "No concepts in chapter" }, { status: 400 });
        }

        // Create Many
        await prisma.flashcard.createMany({
            data: result.parsed.flashcards.map(card => ({
                courseId,
                chapterId,
                conceptId: targetConceptId, // Basic linking
                front: card.front,
                back: card.back,
                explanation: card.explanation,
                type: card.type
            }))
        });

        return NextResponse.json({ success: true, count: result.parsed.flashcards.length });

    } catch (error) {
        console.error("Flashcard generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
