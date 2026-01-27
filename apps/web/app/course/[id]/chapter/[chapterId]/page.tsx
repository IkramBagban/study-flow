
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import { CourseService } from "@/lib/ai/course-service";
import { ChevronRight, PlayCircle, BookOpen, CheckCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Visualizer } from "@/components/visualizers/visualizer";

import { ChapterContentLoader } from "@/components/chapter-content-loader";
// ... imports

export default async function ChapterPage(props: { params: Promise<{ id: string; chapterId: string }> }) {
    console.log("[ChapterPage] Rendering...");
    const params = await props.params;
    console.log("[ChapterPage] Params:", params);

    // Fetch chapter with concepts
    const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        include: {
            concepts: {
                orderBy: { order: 'asc' }
            },
            module: {
                include: {
                    course: true
                }
            }
        }
    });

    if (!chapter) notFound();

    const missingContent = chapter.concepts.some(c => !c.isReady);

    if (missingContent) {
        // If content is missing, we render the layout with a Client Component loader
        // This makes the navigation instant, and the content loads progressively.
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="border-b border-border pb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span>{chapter.module.course.title}</span>
                        <ChevronRight className="size-4" />
                        <span>{chapter.module.title}</span>
                        <ChevronRight className="size-4" />
                        <span className="text-foreground font-medium">{chapter.title}</span>
                    </div>
                    <h1 className="text-4xl font-bold">{chapter.title}</h1>
                </div>

                <ChapterContentLoader chapterId={chapter.id} />
            </div>
        );
    }

    // optimizing re-fetch or relying on the first fetch if we assume CourseService doesn't error clearly.
    // For simplicity, let's re-fetch concepts to render them.
    const concepts = await prisma.concept.findMany({
        where: { chapterId: chapter.id },
        orderBy: { order: 'asc' }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-border pb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>{chapter.module.course.title}</span>
                    <ChevronRight className="size-4" />
                    <span>{chapter.module.title}</span>
                    <ChevronRight className="size-4" />
                    <span className="text-foreground font-medium">{chapter.title}</span>
                </div>
                <h1 className="text-4xl font-bold">{chapter.title}</h1>
                <div className="flex items-center gap-4 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                        <BookOpen className="size-4" />
                        {concepts.length} Key Concepts
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                        <BrainCircuit className="size-4" />
                        Neuro-Adaptive
                    </span>
                </div>

                {/* Priming / Phase 0: Context Setting */}
                {/* <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-secondary/50 to-transparent border border-border/50">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Phase 0: Map the Terrain</h3>
                    <p className="text-lg text-foreground/90 leading-relaxed">
                        Before diving deep, remember: this chapter connects
                        <span className="font-medium text-primary"> {chapter.module.title}</span> to your larger goal of
                        <span className="font-medium text-primary"> {chapter.module.course.goal}</span>.
                        We will build up from simple mental models to complex application.
                    </p>
                </div> */}
            </div>

            <div className="space-y-12">
                {concepts.map((concept, i) => (
                    <section key={concept.id} className="relative group">
                        <div className="absolute -left-12 top-0 hidden lg:flex flex-col items-center h-full">
                            <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold text-muted-foreground z-10">
                                {i + 1}
                            </div>
                            {i !== concepts.length - 1 && (
                                <div className="w-px h-full bg-border -my-2" />
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                                    concept.type === "priming" ? "bg-yellow-500/20 text-yellow-500" :
                                        concept.type === "core" ? "bg-blue-500/20 text-blue-500" :
                                            "bg-purple-500/20 text-purple-500"
                                )}>
                                    {concept.type}
                                </span>
                                <h2 className="text-2xl font-semibold">{concept.title}</h2>
                            </div>

                            {/* Dynamic Block Renderer */}
                            {concept.isReady && Array.isArray(concept.content) ? (
                                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-8">
                                    {(concept.content as any[]).map((block, idx) => {
                                        if (block.type === 'text') {
                                            if (block.variant === 'hook') {
                                                return (
                                                    <div key={idx} className="p-4 rounded-xl bg-secondary/30 italic text-muted-foreground border-l-4 border-yellow-500/50">
                                                        "{block.content}"
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={idx} className="prose prose-invert max-w-none text-dark leading-relaxed">
                                                    {block.content}
                                                </div>
                                            );
                                        }

                                        if (block.type === 'visual') {
                                            return (
                                                <div key={idx} className="my-6">
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
                                                <div key={idx} className="mt-8 pt-8 border-t border-border">
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
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <PlayCircle className="size-8 animate-pulse text-primary" />
                                    <p>Director Agent is composing content blocks...</p>
                                </div>
                            )}
                        </div>
                    </section>
                ))}
            </div>

            <div className="pt-12 border-t border-border mt-12 flex justify-end">
                <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    Complete Chapter <CheckCircle className="size-5" />
                </button>
            </div>
        </div>
    );
}
