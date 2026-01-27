
import { Visualizer } from "@/components/visualizers/visualizer";
import { CheckCircle } from "lucide-react";

export function BlockRenderer({ block }: { block: any }) {
    if (block.type === 'text') {
        if (block.variant === 'hook') {
            return (
                <div className="p-4 rounded-xl bg-secondary/30 italic text-muted-foreground border-l-4 border-yellow-500/50 animate-in fade-in slide-in-from-bottom-2">
                    "{block.content}"
                </div>
            );
        }
        return (
            <div className="prose prose-invert max-w-none text-dark leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                {block.content}
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
