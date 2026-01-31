
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import { CourseService } from "@/lib/ai/course-service";
import { ChevronRight, PlayCircle, BookOpen, CheckCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Visualizer } from "@/components/visualizers/visualizer";

import { ChapterContentLoader } from "@/components/chapter-content-loader";
import { BlockRenderer } from "@/components/block-renderer";
import { RegenerateButton } from "@/components/regenerate-button";

import Link from "next/link";
import { Brain, FileQuestion, ScrollText } from "lucide-react";

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

    // Client Component Loader State
    if (missingContent) {
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
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-4xl font-bold">{chapter.title}</h1>
                        <RegenerateButton chapterId={chapter.id} />
                    </div>
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
        <div className="flex flex-col lg:flex-row gap-8 relative animate-in fade-in duration-500">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-8">
                <div className="border-b border-border pb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span>{chapter.module.course.title}</span>
                        <ChevronRight className="size-4" />
                        <span>{chapter.module.title}</span>
                        <ChevronRight className="size-4" />
                        <span className="text-foreground font-medium">{chapter.title}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-4xl font-bold">{chapter.title}</h1>
                        <RegenerateButton chapterId={chapter.id} />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                            <BookOpen className="size-4" />
                            {concepts.length} Key Concepts
                        </span>
                    </div>
                </div>

                <div className="space-y-12">
                    {concepts.map((concept, i) => (
                        <section key={concept.id} className="relative group">
                            <div className="absolute -left-12 top-0 hidden lg:flex flex-col items-center h-full">
                                <div className="size-8 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-[11px] font-bold text-muted-foreground/40 z-10 transition-colors group-hover:text-primary/70 group-hover:border-primary/30">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                {i !== concepts.length - 1 && (
                                    <div className="w-px h-full bg-border -my-2" />
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-semibold">{concept.title}</h2>
                                </div>

                                {/* Dynamic Block Renderer */}
                                {concept.isReady && Array.isArray(concept.content) ? (
                                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-8">
                                        {(concept.content as any[]).map((block, idx) => (
                                            <BlockRenderer
                                                key={idx}
                                                block={block}
                                                conceptId={concept.id}
                                                blockIndex={idx}
                                            />
                                        ))}
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

            {/* Right Side Toolbar (Sticky) */}
            <aside className="hidden lg:flex flex-col gap-4 w-16 shrink-0 z-10">
                <div className="sticky top-8 flex flex-col gap-4">
                    {/* Flashcards (Active) */}
                    <Link
                        href={`/course/${chapter.module.course.id}/flashcards?chapterId=${chapter.id}`}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-background border border-border/50 shadow-sm hover:scale-110 hover:shadow-md hover:border-primary/50 transition-all duration-300"
                        title="Practice Flashcards"
                    >
                        <Brain className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
                            Flashcards
                        </span>
                    </Link>

                    {/* Quiz (Coming Soon) */}
                    <div className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/50 border border-transparent opacity-60 cursor-not-allowed">
                        <ScrollText className="size-5 text-muted-foreground" />
                        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Quiz (Coming Soon)
                        </span>
                    </div>

                    {/* Test (Coming Soon) */}
                    <div className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/50 border border-transparent opacity-60 cursor-not-allowed">
                        <FileQuestion className="size-5 text-muted-foreground" />
                        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Test (Coming Soon)
                        </span>
                    </div>
                </div>
            </aside>
        </div>
    );
}
