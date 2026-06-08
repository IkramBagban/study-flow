
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { GalleryVerticalEnd, Loader2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { FlashcardData, DeckInfo } from "@/types/flashcard";
import { DeckCard } from "@/components/flashcards/deck-card";
import { DeckListView } from "@/components/flashcards/deck-list-view";
import { ReviewSession } from "@/components/flashcards/review-session";
import { apiErrorMessage } from "@/lib/api-client-errors";

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
            } else {
                toast.error(await apiErrorMessage(res, "Failed to load flashcards."));
                if (res.status === 401) router.push("/login");
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

    // Apply chapter filter - DIRECT TO REVIEW
    useEffect(() => {
        if (chapterIdFilter && decks.length > 0) {
            const deck = decks.find(d => d.id === chapterIdFilter);
            if (deck) {
                setSelectedDeck(deck);
                setView('review'); // Skip 'list' view, go straight to review
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

            if (!res.ok) {
                toast.error(await apiErrorMessage(res, "Failed to generate flashcards."));
                return;
            }
            await fetchCards();
            toast.success("Successfully generated 7 new flashcards!");
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeckClick = (deck: DeckInfo) => {
        setSelectedDeck(deck);

        // Update URL for deep linking
        if (deck.id !== 'master') {
            window.history.pushState(null, '', `?chapterId=${deck.id}`);
        }

        // If there are due cards, go to review. Otherwise show list.
        if (deck.dueCount > 0) {
            setView('review');
        } else {
            setView('list');
        }
    };

    const handleViewList = (e: React.MouseEvent, deck: DeckInfo) => {
        e.stopPropagation();
        setSelectedDeck(deck);

        // Update URL for deep linking
        if (deck.id !== 'master') {
            window.history.pushState(null, '', `?chapterId=${deck.id}`);
        }

        setView('list');
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
        <div className="max-w-5xl mx-auto py-12 px-6 lg:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            {view === 'decks' && (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/40">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                            <GalleryVerticalEnd className="size-3" />
                            <span>Spaced Repetition System</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Flashcard Decks</h1>
                            <p className="text-muted-foreground text-lg">
                                Master your course concepts through active recall.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[100px] px-4 py-3 bg-secondary/20 rounded-2xl border border-border/50 backdrop-blur-sm">
                            <div className="text-2xl font-bold text-foreground">{flashcards.length}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total</div>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[100px] px-4 py-3 bg-primary/5 rounded-2xl border border-primary/20 backdrop-blur-sm">
                            <div className="text-2xl font-bold text-primary">
                                {flashcards.filter(c => new Date(c.due) <= new Date()).length}
                            </div>
                            <div className="text-[10px] text-primary/80 uppercase font-bold tracking-widest">Due Now</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decks Grid View */}
            {view === 'decks' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck) => (
                            <DeckCard
                                key={deck.id}
                                deck={deck}
                                onClick={() => handleDeckClick(deck)}
                                onViewList={(e) => handleViewList(e, deck)}
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
                    onExit={handleBackToDecks}
                />
            )}
        </div>
    );
}


