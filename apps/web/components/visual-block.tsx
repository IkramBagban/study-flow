"use client";

import { useState, useEffect } from "react";
import { Visualizer } from "@/components/visualizers/visualizer";
import { RefreshCcw, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualBlockProps {
    block: any;
    conceptId?: string;
    blockIndex?: number;
}

export function VisualBlock({ block: initialBlock, conceptId, blockIndex }: VisualBlockProps) {
    const [block, setBlock] = useState(initialBlock);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRegenerate = async (e: React.MouseEvent, customFeedback?: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!conceptId || blockIndex === undefined || isRegenerating) return;

        setIsRegenerating(true);
        setShowFeedback(false); // Close UI

        try {
            const res = await fetch(`/api/course/concept/${conceptId}/visual/${blockIndex}/regenerate`, {
                method: "POST",
                body: JSON.stringify({ feedback: customFeedback })
            });
            const data = await res.json();
            if (data.success && data.block) {
                setBlock(data.block);
            }
        } catch (error) {
            console.error("Failed to regenerate visual:", error);
        } finally {
            setIsRegenerating(false);
            setFeedback("");
        }
    };

    return (
        <div className="relative group/visual my-6 animate-in fade-in zoom-in duration-500">
            {mounted && conceptId && blockIndex !== undefined && (
                <div className="absolute right-4 top-4 z-20 flex gap-2 opacity-0 group-hover/visual:opacity-100 transition-all">
                    {/* Feedback Toggle */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowFeedback(!showFeedback);
                        }}
                        disabled={isRegenerating}
                        className={cn(
                            "p-2 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-secondary shadow-sm transition-all",
                            showFeedback && "bg-secondary text-primary"
                        )}
                        title="Refine with instructions"
                    >
                        <MessageSquare className="size-4 text-muted-foreground" />
                    </button>

                    {/* Quick Regenerate */}
                    <button
                        onClick={(e) => handleRegenerate(e)}
                        disabled={isRegenerating}
                        className={cn(
                            "p-2 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-secondary shadow-sm transition-all",
                            isRegenerating && "opacity-100 bg-secondary"
                        )}
                        title="Regenerate this visual"
                    >
                        <RefreshCcw className={cn("size-4 text-muted-foreground", isRegenerating && "animate-spin text-primary")} />
                    </button>

                    {/* Feedback Input Popover */}
                    {showFeedback && (
                        <div
                            className="absolute top-12 right-0 w-64 p-3 rounded-xl bg-background border border-border shadow-xl backdrop-blur-md animate-in slide-in-from-top-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="How should this be improved? (e.g. 'Fix the clipping', 'Make it blue', 'Use degree mode')"
                                className="w-full text-xs bg-muted/50 border border-border rounded-md p-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary mb-2 resize-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowFeedback(false);
                                    }}
                                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => handleRegenerate(e, feedback)}
                                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 font-medium"
                                >
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={cn("transition-all duration-500", isRegenerating && "opacity-40 blur-[2px] grayscale")}>
                <Visualizer
                    type={block.tool || 'none'}
                    code={block.code}
                    caption={block.caption}
                />
            </div>

            {isRegenerating && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="px-6 py-3 rounded-2xl bg-background/50 border border-primary/20 backdrop-blur-md shadow-xl flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <div className="text-xs font-bold text-primary tracking-widest uppercase">Regenerating...</div>
                    </div>
                </div>
            )}
        </div>
    );
}
