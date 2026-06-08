"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Terminal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockRenderer } from "@/components/block-renderer";
import { apiErrorMessage } from "@/lib/api-client-errors";

type LogEvent = {
    id: string;
    message: string;
    type: "info" | "success" | "error" | "block";
    timestamp: number;
};

export function ChapterContentLoader({ chapterId }: { chapterId: string }) {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [blocks, setBlocks] = useState<any[]>([]); // Store generated blocks
    const [currentConcept, setCurrentConcept] = useState<string>("");
    const [progress, setProgress] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const addLog = (message: string, type: LogEvent["type"] = "info") => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36),
            message,
            type,
            timestamp: Date.now()
        }].slice(-5));
    };

    // Auto-scroll to bottom as content generates
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [blocks]);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const startStream = async () => {
            try {
                addLog("Connecting to Neural Engine...", "info");

                const response = await fetch("/api/ai/course/generate-chapter-stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chapterId }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const message = await apiErrorMessage(response, "Chapter generation failed.");
                    if (response.status === 401) router.push("/login");
                    throw new Error(message);
                }
                if (!response.body) throw new Error("No response body");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n\n");

                    for (const line of lines) {
                        if (!line.startsWith("event: ")) continue;

                        const eventMatch = line.match(/^event: (.+)$/m);
                        const dataMatch = line.match(/^data: (.+)$/m);

                        if (!eventMatch || !dataMatch) continue;

                        const event = eventMatch[1];
                        const data = JSON.parse(dataMatch[1]);

                        if (!mounted) return;

                        switch (event) {
                            case "concept-start":
                                setCurrentConcept(data.conceptTitle || "Unknown Concept");
                                setProgress(Math.round(((data.index - 1) / data.total) * 100));
                                addLog(`Analyzing: ${data.conceptTitle}`, "info");
                                break;

                            case "block-complete":
                                // Add the actual block content to state
                                setBlocks(prev => [...prev, data.block]);
                                addLog(`Generated ${data.block.type}`, "block");
                                break;

                            case "concept-complete":
                                addLog(`Completed ${data.conceptTitle}`, "success");
                                break;

                            case "complete":
                                addLog("Finalizing...", "success");
                                router.refresh();
                                return;

                            case "error":
                                addLog(`Error: ${data.error}`, "error");
                                break;
                        }
                    }
                }

            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error(err);
                if (mounted) addLog(err.message || "Connection lost. Retrying...", "error");
            }
        };

        const timeout = setTimeout(startStream, 500);

        return () => {
            mounted = false;
            controller.abort();
            clearTimeout(timeout);
        };
    }, [chapterId, router]);

    return (
        <div className="max-w-4xl mx-auto py-12 space-y-8">

            {/* Header / Status */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-3xl font-bold">
                    {currentConcept ? `Teaching: ${currentConcept}` : "Preparing Lesson..."}
                </h1>

                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* LIVE CONTENT RENDERER */}
            <div className="space-y-8 min-h-[400px]">
                {blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                ))}

                {/* Typing Indicator at bottom */}
                <div ref={bottomRef} className="flex items-center gap-2 text-muted-foreground pt-4 opacity-50">
                    <Sparkles className="size-4 animate-spin" />
                    <span className="text-sm font-mono">AI is composing next block...</span>
                </div>
            </div>

            {/* System Activity Indicator */}
            <div className="mt-16 pt-8 border-t border-border/40 flex flex-col items-center gap-4">
                <div className="flex items-center gap-6">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] transition-all duration-700 animate-in fade-in slide-in-from-bottom-1",
                                log.type === 'error' ? "text-destructive" :
                                    log.type === 'success' ? "text-emerald-500" :
                                        log.type === 'block' ? "text-primary/70" :
                                            "text-muted-foreground/40"
                            )}
                        >
                            <span className={cn(
                                "size-1 rounded-full",
                                log.type === 'error' ? "bg-destructive animate-pulse" :
                                    log.type === 'success' ? "bg-emerald-500" :
                                        log.type === 'block' ? "bg-primary/40" :
                                            "bg-muted-foreground/20"
                            )} />
                            {log.message}
                        </div>
                    )).slice(-3)}
                </div>

                {blocks.length === 0 && (
                    <div className="text-[11px] text-muted-foreground/30 font-mono tracking-tight animate-pulse">
                        Neural Synapse: Initializing Pathing...
                    </div>
                )}
            </div>
        </div>
    );
}
