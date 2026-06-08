import { NextResponse } from "next/server";
import { gradeQuiz } from "@/lib/ai/quiz-service";
import { getSessionUserId } from "@/lib/course-auth";

export async function POST(req: Request) {
    try {
        if (!await getSessionUserId()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
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
