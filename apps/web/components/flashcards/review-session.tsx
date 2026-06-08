
"use client";

import { useState } from "react";
import { Flashcard } from "@/components/flashcard";
import { ChevronLeft, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { FlashcardData } from "@/types/flashcard";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-client-errors";

export function ReviewSession({ cards, deckName, onExit }: { cards: FlashcardData[], deckName: string, onExit: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [direction, setDirection] = useState(0);

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <div className="size-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="size-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-sm">
                    No cards due in <span className="font-semibold text-foreground">{deckName}</span> right now.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onExit}
                        className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
                    >
                        Back to Decks
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    // Animation Variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        })
    };

    const handleNext = () => {
        setDirection(1);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handlePrev = () => {
        setDirection(-1);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const jumpTo = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    const handleRate = async (rating: number) => {
        try {
            const res = await fetch(`/api/flashcard/${currentCard.id}/progress`, {
                method: 'POST',
                body: JSON.stringify({ rating })
            });
            if (!res.ok) throw new Error(await apiErrorMessage(res, "Failed to save review progress."));
            setCompleted(prev => [...prev, currentCard.id]);
        } catch (err) {
            console.error("Failed to save progress", err);
            toast.error(err instanceof Error ? err.message : "Failed to save review progress.");
            return;
        }
        handleNext();
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
                <div className="size-24 bg-yellow-400/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="size-12" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
                <p className="text-muted-foreground mb-2 text-lg">You've reviewed {cards.length} cards in</p>
                <p className="text-primary font-bold text-xl mb-8">{deckName}</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setIsFinished(false);
                            setCurrentIndex(0);
                            setCompleted([]);
                        }}
                        className="px-6 py-2 rounded-xl text-primary font-medium hover:bg-primary/10 transition-colors"
                    >
                        Review Again
                    </button>
                    <button
                        onClick={onExit}
                        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
                    >
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between">
                <button onClick={onExit} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                    <ChevronLeft className="size-4" /> Exit
                </button>
                <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {deckName}
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                    {currentIndex + 1} / {cards.length}
                </div>
            </div>

            {/* Card Area */}
            <div className="relative w-full min-h-[450px] flex items-center justify-center">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="absolute left-[-60px] p-3 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 hidden md:flex"
                >
                    <ChevronLeft className="size-8" />
                </button>

                <div className="w-full relative h-[450px]">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 w-full"
                        >
                            <Flashcard
                                key={currentCard.id}
                                front={currentCard.front}
                                back={currentCard.back}
                                explanation={currentCard.explanation}
                                variant={currentCard.type as any}
                                onRate={handleRate}
                                className="h-full my-0"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="absolute right-[-60px] p-3 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 hidden md:flex"
                >
                    <ChevronRight className="size-8" />
                </button>
            </div>

            {/* Pagination */}
            <div className="w-full max-w-2xl overflow-x-auto pb-4 flex justify-center no-scrollbar">
                <div className="flex gap-2 p-1">
                    {cards.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => jumpTo(idx)}
                            className={cn(
                                "size-3 rounded-full transition-all duration-300 shrink-0",
                                idx === currentIndex
                                    ? "bg-primary w-8 hover:bg-primary/90"
                                    : "bg-muted hover:bg-muted-foreground/50",
                                completed.includes(cards[idx].id) && idx !== currentIndex && "bg-emerald-500/50"
                            )}
                            title={`Go to Card ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile Nav */}
            <div className="flex md:hidden gap-8 w-full justify-between px-4">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-full bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <div className="text-sm font-medium text-muted-foreground self-center">
                    {currentIndex + 1} / {cards.length}
                </div>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="p-3 rounded-full bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                >
                    <ChevronRight className="size-6" />
                </button>
            </div>
        </div>
    );
}
