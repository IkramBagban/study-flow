
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export function ChapterContentLoader({ chapterId }: { chapterId: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<"starting" | "generating" | "finishing">("starting");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const generate = async () => {
            try {
                // Wait a tiny bit to show the starting state
                await new Promise(r => setTimeout(r, 800));
                if (!mounted) return;
                setStatus("generating");

                const res = await fetch("/api/ai/course/generate-chapter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chapterId }),
                });

                if (!res.ok) throw new Error("Generation failed");

                if (!mounted) return;
                setStatus("finishing");

                // Refresh to show the new content
                router.refresh();
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to generate content. Please try refreshing.");
            }
        };

        generate();

        return () => { mounted = false; };
    }, [chapterId, router]);

    if (error) {
        return (
            <div className="p-12 border border-dashed border-red-200 rounded-2xl flex flex-col items-center justify-center text-red-400 gap-2">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs underline hover:text-red-300"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-card border border-border p-4 rounded-full shadow-2xl">
                    <Loader2 className="size-8 text-primary animate-spin" />
                </div>
            </div>

            <div className="text-center space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {status === "starting" && "Analyzing Concepts..."}
                    {status === "generating" && "Crafting Neuro-Adaptive Lesson..."}
                    {status === "finishing" && "Finalizing Visuals..."}
                </h3>
                <p className="text-muted-foreground text-sm">
                    Our AI is generating personalized explanations and diagrams for this chapter.
                </p>
            </div>

            <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
            </div>
        </div>
    );
}
