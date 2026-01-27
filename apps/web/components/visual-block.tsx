"use client";

import { useState } from "react";
import { Visualizer } from "@/components/visualizers/visualizer";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualBlockProps {
    block: any;
    conceptId?: string;
    blockIndex?: number;
}

export function VisualBlock({ block: initialBlock, conceptId, blockIndex }: VisualBlockProps) {
    const [block, setBlock] = useState(initialBlock);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!conceptId || blockIndex === undefined || isRegenerating) return;

        setIsRegenerating(true);
        try {
            const res = await fetch(`/api/course/concept/${conceptId}/visual/${blockIndex}/regenerate`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.success && data.block) {
                setBlock(data.block);
            }
        } catch (error) {
            console.error("Failed to regenerate visual:", error);
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="relative group/visual my-6 animate-in fade-in zoom-in duration-500">
            {conceptId && blockIndex !== undefined && (
                <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                        "absolute right-4 top-4 z-20 p-2 rounded-full bg-background/80 backdrop-blur border border-border opacity-0 group-hover/visual:opacity-100 transition-all hover:bg-secondary shadow-sm",
                        isRegenerating && "opacity-100 bg-secondary"
                    )}
                    title="Regenerate this visual"
                >
                    <RefreshCcw className={cn("size-4 text-muted-foreground", isRegenerating && "animate-spin text-primary")} />
                </button>
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
