import { getChapterQuiz } from "@/app/actions/quiz";
import { QuizView } from "@/components/quiz/quiz-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@study-flow/db";

export default async function QuizPage(props: {
    params: Promise<{ id: string; chapterId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect("/login");
    }

    let quiz;
    try {
        quiz = await getChapterQuiz(params.chapterId);
    } catch (e: any) {
        console.error("Failed to load/generate quiz", e);
        if (e.message === "Unauthorized") redirect("/login");
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive font-medium">Failed to load quiz.</p>
                <p className="text-muted-foreground text-sm max-w-md text-center">
                    {e.message === "Chapter not found" ? "This chapter does not exist." : "An error occurred while generating the quiz. Please try again."}
                </p>
                <Link href={`/course/${params.id}/chapter/${params.chapterId}`}>
                    <button className="px-4 py-2 bg-secondary rounded-md text-sm">Return to Chapter</button>
                </Link>
            </div>
        )
    }

    if (!quiz) return <div>Quiz not found</div>;

    // Fetch course title for navigation
    const course = await prisma.course.findUnique({
        where: { id: params.id },
        select: { title: true }
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/course/${params.id}/chapter/${params.chapterId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft size={18} />
                        <span className="font-medium text-sm">Back to Chapter</span>
                    </Link>
                    <div className="hidden md:block text-sm font-semibold opacity-80">{course?.title}</div>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10">
                <QuizView quiz={quiz} userId={session.user.id} searchParams={await props.searchParams} />
            </main>
        </div>
    );
}
