
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Flashcard } from "@/components/flashcard";
import { GalleryVerticalEnd, CheckCircle2, ChevronLeft, ChevronRight, Layers, PlayCircle, Plus, RefreshCw, Trophy, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface FlashcardData {
    id: string;
    front: string;
    back: string;
    explanation?: string;
    type: 'basic' | 'code' | 'math' | 'concept';
    box: number;
    nextReview: string;
    chapter?: { title: string; id: string };
    conceptId: string;
}


export default function FlashcardsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const courseId = params.id as string;
    const chapterIdFilter = searchParams.get('chapterId');

    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [view, setView] = useState<'list' | 'review'>('list');

    // Fetch Flashcards
    async function fetchCards() {
        try {
            const res = await fetch(`/api/course/${courseId}/flashcards`);
            if (res.ok) {
                const data = await res.json();
                setFlashcards(data);
            }
        } catch (err) {
            console.error("Failed to load flashcards", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCards();
    }, [courseId]);

    const handleGenerateMore = async () => {
        if (!chapterIdFilter) return;

        setIsGenerating(true);
        try {
            const res = await fetch(`/api/course/${courseId}/flashcards/generate`, {
                method: 'POST',
                body: JSON.stringify({ chapterId: chapterIdFilter, count: 7 })
            });

            if (res.ok) {
                await fetchCards();
                toast.success("Successfully generated 7 new flashcards!");
            } else {
                toast.error("Failed to generate flashcards.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter Logic
    const filteredFlashcards = chapterIdFilter
        ? flashcards.filter(c => c.chapter?.id === chapterIdFilter)
        : flashcards;

    // Computed: Due Cards
    const dueCards = filteredFlashcards.filter(card => new Date(card.nextReview) <= new Date());
    const upcomingCards = filteredFlashcards.filter(card => new Date(card.nextReview) > new Date());

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <GalleryVerticalEnd className="size-8 text-primary" />
                        Flashcards
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        <br />
                        <span className="text-sm font-normal text-muted-foreground/80">
                            {chapterIdFilter ? 'Reviewing specific chapter concepts.' : 'Master concepts with spaced repetition.'}
                        </span>
                    </p>
                </div>

                {/* Stats / Action */}
                <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-foreground">{filteredFlashcards.length}</div>
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{dueCards.length}</div>
                        <div className="text-xs text-primary/80 uppercase font-bold tracking-wider">Due Now</div>
                    </div>
                </div>
            </header>

            {/* View Switcher/Content */}
            {view === 'list' && (
                <div className="space-y-8">
                    {/* Call to Action */}
                    {dueCards.length > 0 ? (
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                                    <Layers className="size-5" />
                                    Review Session Ready
                                </h2>
                                <p className="text-muted-foreground">
                                    You have <span className="font-bold text-foreground">{dueCards.length} cards</span> due for review today.
                                </p>
                            </div>
                            <button
                                onClick={() => setView('review')}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <PlayCircle className="size-5" />
                                Start Review
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 rounded-2xl bg-muted/10 border border-border/50 text-center">
                            <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">All Caught Up!</h2>
                            <p className="text-muted-foreground">You have reviewed all your pending cards. Great job!</p>

                            {/* Generation Button (Only if filtered by chapter and empty/caught up) */}
                            {chapterIdFilter && (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={handleGenerateMore}
                                        disabled={isGenerating}
                                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-primary-foreground transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="size-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="size-5" />
                                                Generate 7 New Cards
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {upcomingCards.length > 0 && !chapterIdFilter && (
                                <button
                                    onClick={() => setView('review')}
                                    className="mt-4 text-primary hover:underline"
                                >
                                    Review upcoming cards anyway ({upcomingCards.length})
                                </button>
                            )}
                        </div>
                    )}

                    {/* All Cards List */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
                            <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-sm">All Cards</h3>
                            {/* Placeholder for Add Card */}
                            <button className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-foreground font-medium disabled:opacity-50" disabled title="Coming soon">
                                <Plus className="size-3.5" />
                                Add Card
                            </button>
                        </div>
                        <div className="divide-y divide-border">
                            {filteredFlashcards.map(card => (
                                <div key={card.id} className="p-4 hover:bg-muted/10 transition-colors group flex items-start gap-4">
                                    <div className={cn(
                                        "shrink-0 size-2 rounded-full mt-2",
                                        new Date(card.nextReview) <= new Date() ? "bg-red-500" : "bg-emerald-500"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground line-clamp-1 mb-1">{card.front.substring(0, 100)}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{card.back.substring(0, 100)}</p>
                                        {card.chapter && (
                                            <span className="inline-block mt-2 text-[10px] bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                                                {card.chapter.title}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                        Box: {card.box}
                                    </div>
                                </div>
                            ))}
                            {filteredFlashcards.length === 0 && (
                                <div className="p-12 text-center text-muted-foreground space-y-4">
                                    <p>No flashcards found for this selection.</p>
                                    {chapterIdFilter && (
                                        <button
                                            onClick={handleGenerateMore}
                                            disabled={isGenerating}
                                            className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
                                        >
                                            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                            Generate AI Flashcards
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review View */}
            {view === 'review' && (
                <ReviewSession
                    cards={dueCards.length > 0 ? dueCards : upcomingCards}
                    onExit={() => setView('list')}
                />
            )}
        </div>
    );
}

function ReviewSession({ cards, onExit }: { cards: FlashcardData[], onExit: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState<string[]>([]); // Card IDs
    const [isFinished, setIsFinished] = useState(false);
    const [direction, setDirection] = useState(0);

    if (cards.length === 0) return null;

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
            await fetch(`/api/flashcard/${currentCard.id}/progress`, {
                method: 'POST',
                body: JSON.stringify({ rating })
            });
            setCompleted(prev => [...prev, currentCard.id]);
        } catch (err) {
            console.error("Failed to save progress", err);
        }
        handleNext(); // Auto-advance on rate
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
                <div className="size-24 bg-yellow-400/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="size-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Session Complete!</h2>
                <p className="text-muted-foreground mb-8 text-lg">You've reviewed {cards.length} cards.</p>
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
                        Back to Dashboard
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
                <div className="text-sm font-mono text-muted-foreground">
                    {currentIndex + 1} / {cards.length}
                </div>
            </div>

            {/* Card Area with Arrows */}
            <div className="relative w-full min-h-[450px] flex items-center justify-center">

                {/* Desktop Left Arrow */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="absolute left-[-60px] p-3 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 hidden md:flex"
                >
                    <ChevronLeft className="size-8" />
                </button>

                {/* Card Container */}
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
                                // Reset internal state by ID key
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

                {/* Desktop Right Arrow */}
                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="absolute right-[-60px] p-3 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 hidden md:flex"
                >
                    <ChevronRight className="size-8" />
                </button>
            </div>

            {/* Pagination Strip */}
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

            {/* Mobile Navigation */}
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
