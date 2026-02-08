"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, BrainCircuit, PlayCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from 'canvas-confetti';
import { submitQuizAttempt } from "@/app/actions/quiz";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface QuizViewProps {
    quiz: any;
    userId: string;
}

export function QuizView({ quiz, userId }: QuizViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const mode = searchParams.get('mode');
        const attemptId = searchParams.get('attemptId');

        if (mode === 'attempt') {
            setStarted(true);
            setSubmitted(false);
            setResult(null);
            setAnswers({});
            setCurrentQuestionIndex(0);
        } else if (attemptId) {
            const attempt = quiz.attempts.find((a: any) => a.id === attemptId);
            if (attempt) {
                loadAttempt(attempt);
            }
        } else {
            setStarted(false);
            setSubmitted(false);
            setResult(null);
        }
    }, [searchParams, quiz.attempts]);

    const loadAttempt = (attempt: any) => {
        const restoredResult = {
            ...attempt,
            percentage: attempt.score,
            performanceLevel: attempt.metadata?.performanceLevel || (attempt.score >= 80 ? "Excellent" : attempt.score >= 60 ? "Good" : "Needs Improvement"),
            growthAreas: attempt.metadata?.growthAreas || [],
            areasToReview: attempt.metadata?.areasToReview || [],
            correctCount: attempt.answers ? attempt.answers.filter((a: any) => a.isCorrect).length : Math.round((attempt.score / 100) * quiz.questions.length),
        };

        const restoredAnswers: Record<string, string> = {};
        if (attempt.answers && Array.isArray(attempt.answers)) {
            attempt.answers.forEach((ans: any) => {
                restoredAnswers[ans.questionId] = ans.optionId;
            });
        }

        setResult(restoredResult);
        setAnswers(restoredAnswers);
        setSubmitted(true);
        setStarted(true);
    };

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <p className="text-muted-foreground">No questions available for this chapter.</p>
                <Link href={`/course/${quiz.courseId}`}>
                    <Button variant="outline">Back to Course</Button>
                </Link>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;

    const handleStart = () => {
        router.push(`${pathname}?mode=attempt`);
    };

    const handleViewAttempt = (attempt: any) => {
        router.push(`${pathname}?attemptId=${attempt.id}`);
    };

    const handleSelectOption = (optionId: string) => {
        if (submitted) return;
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
                questionId: qId,
                optionId: oId
            }));

            const response = await submitQuizAttempt(quiz.id, formattedAnswers);
            router.replace(`${pathname}?attemptId=${response.id}`);

            setResult(response);
            setSubmitted(true);
            setStarted(true);

            if (response.score > 70) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (error) {
            console.error("Failed to submit quiz", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const BackgroundGlow = () => (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[8s]" />
            <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full mix-blend-screen" />
        </div>
    );

    if (!started && !submitted) {
        return (
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <BackgroundGlow />

                <div className="relative z-10 w-full max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            {quiz.title}
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                            Ready to challenge yourself? You have {quiz.questions.length} questions waiting.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <Button size="lg" onClick={handleStart} className="rounded-full px-10 py-6 text-lg shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all font-semibold group">
                            Start Assessment
                            <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {quiz.attempts && quiz.attempts.length > 0 && (
                        <div className="pt-8 border-t border-border/50 w-full max-w-md mx-auto">
                            <div className="text-sm font-medium text-muted-foreground mb-4">Recent Activity</div>
                            <div className="space-y-3">
                                {quiz.attempts.slice(0, 3).map((attempt: any) => (
                                    <div key={attempt.id} className="flex items-center justify-between text-sm p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-colors text-left">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{new Date(attempt.createdAt).toLocaleDateString()}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <span className={cn(
                                            "font-bold text-lg",
                                            attempt.score >= 70 ? "text-green-500" : "text-orange-500"
                                        )}>{Math.round(attempt.score)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (submitted && result) {
        return (
            <div className="relative min-h-[80vh] py-12 px-6">
                <BackgroundGlow />
                <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
                    <div className="text-center space-y-8 py-8">
                        <div className={cn(
                            "inline-flex items-center justify-center px-6 py-2 rounded-full text-base font-semibold shadow-sm backdrop-blur-md bg-background/50",
                            result.performanceLevel === "Excellent" ? "bg-green-500/10 text-green-700 ring-1 ring-green-500/20" :
                                result.performanceLevel === "Good" ? "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20" :
                                    "bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/20"
                        )}>
                            {result.performanceLevel || "Quiz Complete"}
                        </div>

                        <div className="space-y-4">
                            <div className="relative inline-flex flex-col items-center justify-center">
                                <span className="text-8xl font-black text-foreground tracking-tighter drop-shadow-sm">
                                    {Math.round(result.percentage || result.score)}<span className="text-4xl text-muted-foreground align-top ml-1">%</span>
                                </span>
                            </div>

                            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-foreground">{result.correctCount ?? Math.round((result.percentage / 100) * quiz.questions.length)}</span>
                                    <span>Correct</span>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-foreground">{quiz.questions.length}</span>
                                    <span>Questions</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2 p-8 rounded-[2rem] bg-card/60 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent" />
                            <div className="relative z-10 space-y-4">
                                <h3 className="font-semibold text-xl flex items-center gap-3">

                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                        AI Tutor Insight
                                    </span>
                                </h3>
                                <p className="text-muted-foreground leading-relaxed text-lg font-medium italic">
                                    "{result.feedback}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-10">
                        <Link href={`/course/${quiz.courseId}`}>
                            <Button size="lg" variant="outline" className="rounded-full px-10 h-14 border-primary/20 hover:bg-primary/5 text-lg">Return to Course</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Question View
    return (
        <div className="relative min-h-[80vh] flex flex-col justify-center py-6 px-4 md:px-8">
            <BackgroundGlow />

            <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8 animate-in slide-in-from-right-8 duration-500">
                {/* Progress Header */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-700 ease-out" style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground drop-shadow-sm">
                        {currentQuestion.question}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option: any, idx: number) => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            const letter = String.fromCharCode(65 + idx); // A, B, C...

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectOption(option.id)}
                                    className={cn(
                                        "group relative overflow-hidden w-full text-left p-4 rounded-xl border transition-all duration-200",
                                        isSelected
                                            ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                            : "bg-card/40 border-border/50 hover:bg-card/80 hover:border-primary/30 backdrop-blur-md"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-200",
                                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                        )}>
                                            {letter}
                                        </span>
                                        <span className={cn(
                                            "text-base font-medium transition-colors leading-snug",
                                            isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {option.text}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end pt-6 border-t border-white/5">
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id] || isSubmitting}
                        size="default"
                        className={cn(
                            "rounded-full px-8 h-12 text-base shadow-lg transition-all duration-300",
                            answers[currentQuestion.id] ? "hover:scale-105 hover:shadow-primary/30" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {currentQuestionIndex === totalQuestions - 1 ?
                            (isSubmitting ? "Submitting..." : "Finish") :
                            "Next"
                        }
                        {!isSubmitting && <ArrowRight className="ml-2 size-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
