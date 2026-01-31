
"use client";

import { BookOpen, ChevronLeft, PlayCircle, Plus, Sparkles, Loader2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeckInfo } from "@/types/flashcard";

export function DeckListView({ deck, onBack, onStartReview, onGenerate, isGenerating }: {
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