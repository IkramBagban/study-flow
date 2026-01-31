"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Flame, ChevronRight, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface ReviewStats {
    totalDue: number;
    totalCards: number;
    masteredCards: number;
    newCards: number;
    courses: {
        id: string;
        title: string;
        dueCount: number;
        newCount: number;
    }[];
}

export function ReviewReminder() {
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/review/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch review stats", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 animate-pulse">
                <div className="flex items-center gap-3">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">Loading review stats...</span>
                </div>
            </div>
        );
    }

    if (!stats || stats.totalDue === 0 || isDismissed) {
        // Show "All caught up" state if no due cards
        if (stats && stats.totalCards > 0) {
            return (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Sparkles className="size-6 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">All Caught Up!</h3>
                            <p className="text-sm text-muted-foreground">
                                You've reviewed all your due cards. Great work!
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.masteredCards}/{stats.totalCards}
                            </div>
                            <div className="text-xs text-muted-foreground">mastered</div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-xl"
            >
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 size-32 bg-white/5 rounded-full blur-xl" />

                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Icon & Main Message */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                <Brain className="size-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Time to Review!</h3>
                                <p className="text-white/80 text-sm">
                                    You have <span className="font-bold text-white">{stats.totalDue} cards</span> ready for review
                                    {stats.newCards > 0 && (
                                        <span> ({stats.newCards} new)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 md:gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{stats.totalDue}</div>
                                <div className="text-xs text-white/70 uppercase tracking-wide">Due Now</div>
                            </div>
                            <div className="w-px bg-white/20" />
                            <div className="text-center">
                                <div className="text-3xl font-bold">{Math.round((stats.masteredCards / Math.max(stats.totalCards, 1)) * 100)}%</div>
                                <div className="text-xs text-white/70 uppercase tracking-wide">Mastered</div>
                            </div>
                        </div>
                    </div>

                    {/* Course Breakdown */}
                    {stats.courses.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/20">
                            <div className="flex flex-wrap gap-3">
                                {stats.courses.slice(0, 4).map(course => (
                                    <Link
                                        key={course.id}
                                        href={`/course/${course.id}/flashcards`}
                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium transition-colors"
                                    >
                                        <BookOpen className="size-4" />
                                        <span className="max-w-[150px] truncate">{course.title}</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {course.dueCount}
                                        </span>
                                    </Link>
                                ))}
                                {stats.courses.length > 4 && (
                                    <span className="text-white/60 text-sm self-center">
                                        +{stats.courses.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Link
                            href={stats.courses[0] ? `/course/${stats.courses[0].id}/flashcards` : '/dashboard'}
                            className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors shadow-lg"
                        >
                            <Flame className="size-5" />
                            Start Review Session
                            <ChevronRight className="size-5" />
                        </Link>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="text-white/70 hover:text-white text-sm transition-colors"
                        >
                            Remind me later
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
