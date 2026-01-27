"use client";

import { useState } from "react";
import { CheckCircle, Info, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveRecallBlockProps {
    block: {
        type: string;
        variant: 'flashcard' | 'mcq';
        question: string;
        answer: string;
        options?: string[];
    };
}

export function ActiveRecallBlock({ block }: ActiveRecallBlockProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const isMCQ = block.variant === 'mcq';

    return (
        <div className="mt-8 pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <CheckCircle className="size-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-primary/70">
                        Active Recall
                    </h4>
                </div>

                <p className="font-semibold text-xl mb-6 leading-snug">{block.question}</p>

                {isMCQ ? (
                    <div className="space-y-3">
                        {block.options?.map((option, idx) => {
                            const isCorrect = option === block.answer;
                            const isSelected = selectedOption === idx;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedOption(idx)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group",
                                        selectedOption === null
                                            ? "border-border bg-background hover:border-primary/50 hover:bg-secondary/20"
                                            : isCorrect
                                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : isSelected
                                                    ? "border-destructive/50 bg-destructive/10 text-destructive-700 dark:text-destructive-400"
                                                    : "border-border bg-background/50 opacity-60"
                                    )}
                                >
                                    <span className="flex-1 font-medium">{option}</span>
                                    {selectedOption !== null && isCorrect && (
                                        <Check className="size-5 text-emerald-500 shrink-0" />
                                    )}
                                    {selectedOption !== null && !isCorrect && isSelected && (
                                        <X className="size-5 text-destructive shrink-0" />
                                    )}
                                </button>
                            );
                        })}

                        {selectedOption !== null && (
                            <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50 text-sm animate-in fade-in slide-in-from-top-2">
                                <span className="font-bold text-foreground">Core Insight:</span> {block.answer}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-border bg-background shadow-sm hover:border-primary/30 transition-all duration-300">
                        <div className="p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center justify-center min-h-[100px]">
                            <p className="text-lg text-foreground font-medium text-center">
                                {block.answer}
                            </p>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 group-hover:opacity-0 transition-opacity duration-300">
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-8 rounded-full bg-background border border-border flex items-center justify-center">
                                    <Info className="size-4 text-muted-foreground" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hover to Reveal</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
