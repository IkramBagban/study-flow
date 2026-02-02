"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, BrainCircuit, PlayCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from 'canvas-confetti';
import { submitQuizAttempt } from "@/app/actions/quiz";
import Link from "next/link";

interface QuizViewProps {
    quiz: any; // Type strictly if possible
    userId: string;
}

export function QuizView({ quiz, userId }: QuizViewProps) {
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If there are no questions, show empty state
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
    // Progress bar calculation (questions answered / total)
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / totalQuestions) * 100;

    const handleStart = () => setStarted(true);

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
            setResult(response);
            setSubmitted(true);

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

    if (!started) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-5">
                <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/20">
                    <BrainCircuit size={48} />
                </div>
                <div className="space-y-4 max-w-lg">
                    <h1 className="text-4xl font-bold tracking-tight">{quiz.title}</h1>
                    <p className="text-lg text-muted-foreground">
                        Ready to check your understanding? We've prepared {quiz.questions.length} questions based on this chapter's content.
                    </p>
                </div>
                <Button size="lg" onClick={handleStart} className="rounded-full px-12 py-6 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    Start Quiz <PlayCircle className="ml-2 size-5" />
                </Button>
            </div>
        )
    }

    if (submitted && result) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
                <div className="text-center space-y-6 py-8">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                        {result.score >= 80 ? "Excellent Mastery!" : result.score >= 50 ? "Good Effort!" : "Review Needed"}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-7xl font-bold text-primary tracking-tighter">{Math.round(result.score)}%</span>
                        <span className="text-muted-foreground font-medium uppercase tracking-widest text-sm mt-2">Accuracy Score</span>
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <h3 className="font-semibold text-xl flex items-center gap-2">
                        <Target className="size-6 text-primary" />
                        Performance Insight
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                        {result.feedback}
                    </p>
                </div>

                <div className="space-y-6 pt-8">
                    <h3 className="font-semibold text-2xl px-2">Detailed Review</h3>
                    {quiz.questions.map((q: any, idx: number) => {
                        const userAnswer = answers[q.id];
                        const selectedOption = q.options.find((o: any) => o.id === userAnswer);
                        const correctOption = q.options.find((o: any) => o.isCorrect);

                        const isCorrect = selectedOption?.id === correctOption?.id;

                        return (
                            <div key={q.id} className="p-6 rounded-2xl bg-background border border-border/60 shadow-sm space-y-4">
                                <div className="flex gap-4">
                                    <span className={cn(
                                        "flex-shrink-0 size-8 rounded-full flex items-center justify-center text-sm font-bold border",
                                        isCorrect ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-red-500/10 border-red-500/20 text-red-600"
                                    )}>
                                        {idx + 1}
                                    </span>
                                    <div className="space-y-4 flex-1">
                                        <p className="font-medium text-lg leading-snug">{q.question}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt: any) => (
                                                <div
                                                    key={opt.id}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-sm flex items-center justify-between transition-colors",
                                                        opt.id === correctOption?.id ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300 font-medium" :
                                                            opt.id === userAnswer && opt.id !== correctOption?.id ? "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300" :
                                                                "bg-transparent border-border/50 text-muted-foreground"
                                                    )}
                                                >
                                                    <span>{opt.text}</span>
                                                    {opt.id === correctOption?.id && <CheckCircle2 className="size-4 text-green-500" />}
                                                    {opt.id === userAnswer && opt.id !== correctOption?.id && <XCircle className="size-4 text-red-500" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-sm p-4 bg-secondary/50 rounded-xl border border-secondary">
                                            <span className="font-semibold text-foreground block mb-1">Explanation</span>
                                            <span className="text-muted-foreground">{q.explanation}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-center pt-10">
                    <Link href={`/course/${quiz.courseId}`}>
                        <Button variant="outline" className="rounded-full px-8">Back to Course</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 min-h-[70vh] flex flex-col justify-center">
            {/* Progress Bar */}
            <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
                </div>
            </div>

            {/* Question Card */}
            <div className="p-8 md:p-10 rounded-[2rem] bg-card border border-border shadow-sm space-y-8 relative overflow-visible">
                {/* Decorative Background Element */}
                <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <h2 className="text-2xl md:text-3xl font-bold leading-tight relative z-10">
                    {currentQuestion.question}
                </h2>

                <div className="space-y-3 relative z-10">
                    {currentQuestion.options.map((option: any) => (
                        <button
                            key={option.id}
                            onClick={() => handleSelectOption(option.id)}
                            className={cn(
                                "w-full text-left p-5 rounded-xl border-2 transition-all duration-200 text-lg",
                                answers[currentQuestion.id] === option.id
                                    ? "bg-primary/5 border-primary text-primary shadow-sm"
                                    : "bg-background border-transparent hover:bg-secondary hover:border-secondary-foreground/10 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {option.text}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end pt-6">
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id] || isSubmitting}
                        size="lg"
                        className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {currentQuestionIndex === totalQuestions - 1 ?
                            (isSubmitting ? "Submitting..." : "Finish Quiz") :
                            "Next Question"
                        }
                        {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
