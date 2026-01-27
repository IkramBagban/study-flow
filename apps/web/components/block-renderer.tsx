import { Visualizer } from "@/components/visualizers/visualizer";
import { CheckCircle, Info, Lightbulb, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import MermaidDiagram from "@/components/visualizers/mermaid";
import { cn } from "@/lib/utils";

export function BlockRenderer({ block }: { block: any }) {
    if (block.type === 'text') {
        return (
            <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    components={{
                        h1: ({ className, ...props }) => (
                            <h1 className={cn("text-2xl font-bold mt-8 mb-4 text-foreground", className)} {...props} />
                        ),
                        h2: ({ className, ...props }) => (
                            <h2 className={cn("text-xl font-bold mt-6 mb-3 text-foreground/90", className)} {...props} />
                        ),
                        h3: ({ className, ...props }) => (
                            <h3 className={cn("text-lg font-bold mt-4 mb-2 text-foreground/80", className)} {...props} />
                        ),
                        p: ({ className, ...props }) => (
                            <p className={cn("mb-4 text-foreground/90 leading-relaxed", className)} {...props} />
                        ),
                        ul: ({ className, ...props }) => (
                            <ul className={cn("list-disc pl-6 mb-4 space-y-2 text-foreground/90", className)} {...props} />
                        ),
                        ol: ({ className, ...props }) => (
                            <ol className={cn("list-decimal pl-6 mb-4 space-y-2 text-foreground/90", className)} {...props} />
                        ),
                        li: ({ className, ...props }) => (
                            <li className={cn("text-foreground/90", className)} {...props} />
                        ),
                        blockquote: ({ className, ...props }) => {
                            const isHook = block.variant === 'hook' || block.variant === 'analogy';
                            return (
                                <blockquote className={cn(
                                    "border-l-4 pl-4 py-3 my-6 italic rounded-r-lg shadow-sm transition-colors",
                                    isHook
                                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-950 dark:text-yellow-100"
                                        : "border-primary bg-primary/5 text-foreground/80 dark:text-zinc-300",
                                    className
                                )} {...props} />
                            );
                        },
                        code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            const language = match?.[1];

                            if (language === 'mermaid') {
                                return (
                                    <div className="my-8 flex flex-col items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-md overflow-x-auto w-full">
                                        <MermaidDiagram code={String(children).replace(/\n$/, '')} />
                                    </div>
                                );
                            }

                            return isInline ? (
                                <code className={cn("bg-secondary/50 px-1.5 py-0.5 rounded text-sm font-mono text-primary font-semibold", className)} {...props}>
                                    {children}
                                </code>
                            ) : (
                                <div className="relative group my-8">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition duration-1000" />
                                    <pre className="relative overflow-hidden rounded-xl bg-zinc-950 dark:bg-black p-0 border border-border/50 shadow-xl">
                                        <code className={cn("block p-5 text-sm font-mono text-zinc-300 leading-relaxed", className)} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                </div>
                            );
                        },
                        table: ({ className, ...props }) => (
                            <div className="overflow-x-auto my-8 rounded-xl border border-border shadow-sm">
                                <table className={cn("w-full text-sm text-left text-foreground/90", className)} {...props} />
                            </div>
                        ),
                        th: ({ className, ...props }) => (
                            <th className={cn("px-4 py-3 bg-secondary/30 font-bold text-foreground border-b border-border", className)} {...props} />
                        ),
                        td: ({ className, ...props }) => (
                            <td className={cn("px-4 py-3 border-t border-border", className)} {...props} />
                        ),
                    }}
                >
                    {block.content}
                </ReactMarkdown>
            </div>
        );
    }

    if (block.type === 'visual') {
        return (
            <div className="my-6 animate-in fade-in zoom-in duration-500">
                <Visualizer
                    type={block.tool || 'none'}
                    code={block.code}
                    caption={block.caption}
                />
            </div>
        );
    }

    if (block.type === 'quiz') {
        return (
            <div className="mt-8 pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <CheckCircle className="size-5 text-primary" />
                        Active Recall
                    </h4>
                    <p className="font-medium text-lg mb-4">{block.question}</p>
                    <div className="relative group cursor-pointer">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary p-4 rounded-lg border border-border mt-2 text-sm text-center font-mono text-muted-foreground">
                            {block.answer}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:opacity-0 transition-opacity">
                            Hover to Reveal Answer
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
