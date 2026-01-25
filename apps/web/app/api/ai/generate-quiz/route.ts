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

        // IMPORTANT: In a real app, you might want to hide 'correctOptionId' from the client
        // or store it in a DB and only send it back during grading.
        // For MVP, we send it but will trust the backend grader for the final score.

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("Quiz generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz" },
            { status: 500 }
        );
    }
}
