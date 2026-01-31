
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flashcard } from "@/components/flashcard";
import { GalleryVerticalEnd, BookOpen, ChevronLeft, ChevronRight, Layers, PlayCircle, Plus, Trophy, Sparkles, Loader2, Crown, LayoutGrid } from "lucide-react";
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
    due: string;
    stability: number;
    difficulty: number;
    state: number;
    reps: number;
    lapses: number;
    chapter?: { title: string; id: string };
    chapterId?: string;
    conceptId: string;
}

interface DeckInfo {
    id: string;
    name: string;
    cards: FlashcardData[];
    dueCount: number;
    newCount: number;
    totalCount: number;
    color: string;
    isMaster?: boolean;
}

const DECK_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600',
    'from-green-500 to-emerald-600',
    'from-red-500 to-pink-500',
];

export default function FlashcardsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = params.id as string;
    const chapterIdFilter = searchParams.get('chapterId');

    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [view, setView] = useState<'decks' | 'list' | 'review'>('decks');
    const [selectedDeck, setSelectedDeck] = useState<DeckInfo | null>(null);

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

    // Build decks from flashcards
    const decks = useMemo(() => {
        const now = new Date();
        const chapterMap = new Map<string, DeckInfo>();

        flashcards.forEach((card, index) => {
            const chapterId = card.chapter?.id || 'uncategorized';
            const chapterName = card.chapter?.title || 'Uncategorized';

            if (!chapterMap.has(chapterId)) {
                chapterMap.set(chapterId, {
                    id: chapterId,
                    name: chapterName,
                    cards: [],
                    dueCount: 0,
                    newCount: 0,
                    totalCount: 0,
                    color: DECK_COLORS[chapterMap.size % DECK_COLORS.length]
                });
            }

            const deck = chapterMap.get(chapterId)!;
            deck.cards.push(card);
            deck.totalCount++;

            if (new Date(card.due) <= now) {
                deck.dueCount++;
            }
            if (card.state === 0) {
                deck.newCount++;
            }
        });

        // Create Master Deck
        const masterDeck: DeckInfo = {
            id: 'master',
            name: 'Master Deck',
            cards: flashcards,
            dueCount: flashcards.filter(c => new Date(c.due) <= now).length,
            newCount: flashcards.filter(c => c.state === 0).length,
            totalCount: flashcards.length,
            color: 'from-yellow-500 via-amber-500 to-orange-500',
            isMaster: true
        };

        return [masterDeck, ...Array.from(chapterMap.values())];
    }, [flashcards]);

    // Apply chapter filter if present
    useEffect(() => {
        if (chapterIdFilter) {
            const deck = decks.find(d => d.id === chapterIdFilter);
            if (deck) {
                setSelectedDeck(deck);
                setView('list');
            }
        }
    }, [chapterIdFilter, decks]);

    const handleGenerateMore = async (chapterId: string) => {
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/course/${courseId}/flashcards/generate`, {
                method: 'POST',
                body: JSON.stringify({ chapterId, count: 7 })
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

    const handleDeckClick = (deck: DeckInfo) => {
        setSelectedDeck(deck);
        setView('list');
    };

    const handleStartReview = (deck: DeckInfo) => {
        setSelectedDeck(deck);
        setView('review');
    };

    const handleBackToDecks = () => {
        setSelectedDeck(null);
        setView('decks');
        // Clear URL filter
        if (chapterIdFilter) {
            router.push(`/course/${courseId}/flashcards`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <GalleryVerticalEnd className="size-8 text-primary" />
                        Flashcard Decks
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {view === 'decks' && 'Select a deck to start reviewing'}
                        {view === 'list' && selectedDeck && `Viewing: ${selectedDeck.name}`}
                        {view === 'review' && selectedDeck && `Reviewing: ${selectedDeck.name}`}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-foreground">{flashcards.length}</div>
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-2xl font-bold text-primary">
                            {flashcards.filter(c => new Date(c.due) <= new Date()).length}
                        </div>
                        <div className="text-xs text-primary/80 uppercase font-bold tracking-wider">Due</div>
                    </div>
                </div>
            </header>

            {/* Decks Grid View */}
            {view === 'decks' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck) => (
                            <DeckCard
                                key={deck.id}
                                deck={deck}
                                onClick={() => handleDeckClick(deck)}
                                onStartReview={() => handleStartReview(deck)}
                            />
                        ))}
                    </div>

                    {decks.length === 1 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <LayoutGrid className="size-12 mx-auto mb-4 opacity-50" />
                            <p>No chapter-specific decks yet.</p>
                            <p className="text-sm">Generate flashcards from chapter pages to create decks.</p>
                        </div>
                    )}
                </div>
            )}

            {/* List View */}
            {view === 'list' && selectedDeck && (
                <DeckListView
                    deck={selectedDeck}
                    onBack={handleBackToDecks}
                    onStartReview={() => setView('review')}
                    onGenerate={() => selectedDeck.id !== 'master' && handleGenerateMore(selectedDeck.id)}
                    isGenerating={isGenerating}
                />
            )}

            {/* Review View */}
            {view === 'review' && selectedDeck && (
                <ReviewSession
                    cards={selectedDeck.cards.filter(c => new Date(c.due) <= new Date()).length > 0
                        ? selectedDeck.cards.filter(c => new Date(c.due) <= new Date())
                        : selectedDeck.cards
                    }
                    deckName={selectedDeck.name}
                    onExit={() => setView('list')}
                />
            )}
        </div>
    );
}

// Deck Card Component
function DeckCard({ deck, onClick, onStartReview }: { deck: DeckInfo; onClick: () => void; onStartReview: () => void }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative overflow-hidden rounded-2xl cursor-pointer group",
                "bg-gradient-to-br shadow-lg hover:shadow-xl transition-shadow",
                deck.color
            )}
            onClick={onClick}
        >
            {/* Deck Content */}
            <div className="relative p-6 text-white">
                {/* Master Badge */}
                {deck.isMaster && (
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Crown className="size-3" />
                        ALL
                    </div>
                )}

                {/* Deck Icon */}
                <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    {deck.isMaster ? (
                        <Layers className="size-6" />
                    ) : (
                        <BookOpen className="size-6" />
                    )}
                </div>

                {/* Deck Info */}
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{deck.name}</h3>
                <p className="text-white/70 text-sm mb-4">{deck.totalCount} cards</p>

                {/* Stats Row */}
                <div className="flex gap-4 text-sm">
                    {deck.dueCount > 0 && (
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                            <span className="font-bold">{deck.dueCount}</span> due
                        </div>
                    )}
                    {deck.newCount > 0 && (
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                            <span className="font-bold">{deck.newCount}</span> new
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {deck.dueCount > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartReview();
                        }}
                        className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/90"
                    >
                        <PlayCircle className="size-4" />
                        Study
                    </button>
                )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-8 -right-8 size-32 bg-white/10 rounded-full" />
            <div className="absolute -top-4 -left-4 size-20 bg-white/5 rounded-full" />
        </motion.div>
    );
}

// Deck List View Component
function DeckListView({ deck, onBack, onStartReview, onGenerate, isGenerating }: {
    deck: DeckInfo;
    onBack: () => void;
    onStartReview: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
}) {
    const dueCards = deck.cards.filter(c => new Date(c.due) <= new Date());

    return (
        <div className="space-y-6">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="size-5" />
                    Back to Decks
                </button>

                <div className="flex gap-3">
                    {!deck.isMaster && (
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            Generate Cards
                        </button>
                    )}
                    {dueCards.length > 0 && (
                        <button
                            onClick={onStartReview}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold transition-colors hover:bg-primary/90"
                        >
                            <PlayCircle className="size-4" />
                            Study ({dueCards.length} due)
                        </button>
                    )}
                </div>
            </div>

            {/* Deck Header */}
            <div className={cn(
                "p-6 rounded-2xl bg-gradient-to-br text-white",
                deck.color
            )}>
                <div className="flex items-center gap-4">
                    <div className="size-16 bg-white/20 rounded-xl flex items-center justify-center">
                        {deck.isMaster ? <Crown className="size-8" /> : <BookOpen className="size-8" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{deck.name}</h2>
                        <p className="text-white/70">
                            {deck.totalCount} cards • {dueCards.length} due • {deck.newCount} new
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-sm">Cards in Deck</h3>
                    <button className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-foreground font-medium disabled:opacity-50" disabled title="Coming soon">
                        <Plus className="size-3.5" />
                        Add Card
                    </button>
                </div>
                <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                    {deck.cards.map(card => (
                        <div key={card.id} className="p-4 hover:bg-muted/10 transition-colors flex items-start gap-4">
                            <div className={cn(
                                "shrink-0 size-2 rounded-full mt-2",
                                new Date(card.due) <= new Date() ? "bg-red-500" : "bg-emerald-500"
                            )} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground line-clamp-1 mb-1">{card.front.substring(0, 100)}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{card.back.substring(0, 100)}</p>
                                {card.chapter && !deck.isMaster && (
                                    <span className="inline-block mt-2 text-[10px] bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                                        {card.chapter.title}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                {card.state === 0 ? 'New' : card.state === 1 ? 'Learning' : card.state === 3 ? 'Relearn' : `${card.reps} reviews`}
                            </div>
                        </div>
                    ))}
                    {deck.cards.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            <p>No flashcards in this deck yet.</p>
                            {!deck.isMaster && (
                                <button
                                    onClick={onGenerate}
                                    disabled={isGenerating}
                                    className="mt-4 text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
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
    );
}

// Review Session Component
function ReviewSession({ cards, deckName, onExit }: { cards: FlashcardData[], deckName: string, onExit: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [direction, setDirection] = useState(0);

    if (cards.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">No cards to review.</p>
                <button onClick={onExit} className="mt-4 text-primary hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

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
