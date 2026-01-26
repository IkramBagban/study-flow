import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz-service";
import { AssessmentInputSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = AssessmentInputSchema.parse(body);

        const quiz = await generateQuiz(
            validated.topic,
            validated.knowledgeLevel,
            validated.timeCommitment,
            validated.sourceText
        );

        // for v2
        // TODO: Hide 'correctOptionId' from the client
        // TODO: Store it in a DB and only send it back during grading.

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("Quiz generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz" },
            { status: 500 }
        );
    }
}
