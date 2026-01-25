import { NextResponse } from "next/server";
import { gradeQuiz } from "@/lib/ai/quiz-service";

export async function POST(req: Request) {
    try {
        const { questions, userAnswers } = await req.json();

        const result = await gradeQuiz(questions, userAnswers);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Quiz grading error:", error);
        return NextResponse.json(
            { error: "Failed to grade quiz" },
            { status: 500 }
        );
    }
}
