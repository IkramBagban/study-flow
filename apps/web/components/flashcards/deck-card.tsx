
"use client";

import { BookOpen, Layers, PlayCircle, Crown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { DeckInfo } from "@/types/flashcard";
export function DeckCard({ deck, onClick, onViewList }: { deck: DeckInfo; onClick: () => void; onViewList: (e: React.MouseEvent) => void }) {
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
            <div className="relative p-6 text-white h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {deck.isMaster ? (
                            <Layers className="size-6" />
                        ) : (
                            <BookOpen className="size-6" />
                        )}
                    </div>
                    {deck.isMaster && (
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Crown className="size-3" />
                            ALL
                        </div>
                    )}
                </div>

                {/* Deck Info */}
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{deck.name}</h3>
                <p className="text-white/70 text-sm mb-4">{deck.totalCount} cards</p>

                {/* Stats Row */}
                <div className="flex gap-4 text-sm mt-auto">
                    {deck.dueCount > 0 ? (
                        <div className="bg-white/20 px-3 py-1 rounded-full animate-pulse">
                            <span className="font-bold">{deck.dueCount}</span> due
                        </div>
                    ) : (
                        <div className="bg-white/10 px-3 py-1 rounded-full text-white/80">
                            All caught up
                        </div>
                    )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button
                        className="bg-white text-gray-900 px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <PlayCircle className="size-5" />
                        Study
                    </button>
                    <button
                        onClick={onViewList}
                        className="bg-white/20 text-white hover:bg-white/30 px-3 py-2 rounded-xl transition-colors"
                        title="View List"
                    >
                        <List className="size-5" />
                    </button>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-8 -right-8 size-32 bg-white/10 rounded-full" />
            <div className="absolute -top-4 -left-4 size-20 bg-white/5 rounded-full" />
        </motion.div>
    );
}