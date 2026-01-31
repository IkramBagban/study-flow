"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FileText, Code, CheckCircle2, RotateCw, Lightbulb, ChevronRight, Calculator } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FlashcardProps {
    front: string;
    back: string;
    explanation?: string;
    variant?: 'text' | 'code' | 'math' | 'concept';
    difficulty?: 'easy' | 'medium' | 'hard';
    className?: string;
    onRate?: (rating: number) => void;
}

export function Flashcard({
    front,
    back,
    explanation,
    variant = 'text',
    difficulty = 'medium',
    className,
    onRate
}: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [userRating, setUserRating] = useState<number | null>(null);

    // Variants determine the accent color and icon
    const variants = {
        text: {
            color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
            icon: FileText,
            label: "Recall"
        },
        code: {
            color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            icon: Code,
            label: "Syntax"
        },
        math: {
            color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
            icon: Calculator,
            label: "Solve"
        },
        concept: {
            color: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
            icon: Lightbulb,
            label: "Concept"
        }
    };

    const currentVariant = variants[variant] || variants.text;
    const Icon = currentVariant.icon;

    return (
        <div className={cn("perspective-1000 w-full max-w-2xl mx-auto my-8 h-[360px]", className)}>
            <div
                className="relative w-full h-full cursor-pointer group"
                onClick={() => !userRating && setIsFlipped(!isFlipped)}
                style={{ transformStyle: "preserve-3d" }}
            >
                <motion.div
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 ease-spring",
                    )}
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* FRONT OF CARD */}
                    <div
                        className="absolute inset-0 backface-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
                            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider", currentVariant.color)}>
                                <Icon className="size-3.5" />
                                {currentVariant.label}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Click to flip</div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            {variant === 'code' ? (
                                <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg text-sm font-mono text-left w-full overflow-x-auto shadow-inner border border-zinc-800">
                                    <code>{front}</code>
                                </pre>
                            ) : (
                                <h3 className="text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
                                    <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                                        {front}
                                    </ReactMarkdown>
                                </h3>
                            )}

                            {variant === 'code' && (
                                <p className="mt-4 text-sm text-muted-foreground">What is the output or purpose?</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 flex justify-center pb-6 opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="bg-primary/10 text-primary rounded-full p-2">
                                <RotateCw className="size-5" />
                            </div>
                        </div>
                    </div>

                    {/* BACK OF CARD */}
                    <div
                        className="absolute inset-0 backface-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/10 shadow-lg overflow-hidden flex flex-col"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/60">
                            <span className="text-sm font-medium text-muted-foreground">Answer</span>
                            {!userRating && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                >
                                    Flip back
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{back}</ReactMarkdown>
                            </div>

                            {explanation && (
                                <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm text-muted-foreground text-left w-full">
                                    <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-medium text-xs uppercase tracking-wider">
                                        <Lightbulb className="size-3.5" />
                                        Explanation
                                    </div>
                                    <ReactMarkdown>{explanation}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Rating Actions */}
                        <div className="p-4 border-t border-border/50 bg-muted/20 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                            {userRating === null ? (
                                <div className="flex gap-2 justify-center">
                                    <RatingButton
                                        label="Again"
                                        color="text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200"
                                        onClick={() => { setUserRating(1); onRate?.(1); }}
                                    />
                                    <RatingButton
                                        label="Hard"
                                        color="text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-200"
                                        onClick={() => { setUserRating(2); onRate?.(2); }}
                                    />
                                    <RatingButton
                                        label="Good"
                                        color="text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200"
                                        onClick={() => { setUserRating(3); onRate?.(3); }}
                                    />
                                    <RatingButton
                                        label="Easy"
                                        color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-200"
                                        onClick={() => { setUserRating(4); onRate?.(4); }}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-2">
                                    <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in slide-in-from-bottom-2">
                                        <CheckCircle2 className="size-5" />
                                        <span>Response Recorded</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function RatingButton({ label, color, onClick }: { label: string, color: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex-1 max-w-[80px]",
                color
            )}
        >
            {label}
        </button>
    );
}
