
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/block-renderer";
import { RegenerateButton } from "@/components/regenerate-button";
import { ChapterContentLoader } from "@/components/chapter-content-loader";
import { ChevronRight, BookOpen, CheckCircle, PlayCircle, Sparkles } from "lucide-react";

export default async function ChapterPage(props: { params: Promise<{ id: string; chapterId: string }> }) {
    const params = await props.params;

    const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        include: {
            concepts: { orderBy: { order: 'asc' } },
            module: { include: { course: true } }
        }
    });

    if (!chapter) notFound();

    const missingContent = chapter.concepts.some(c => !c.isReady);

    // Subtle background glow
    const backgroundGlow = (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full mix-blend-screen" />
        </div>
    );

    if (missingContent) {
        return (
            <div className="relative min-h-screen bg-background">
                {backgroundGlow}
                <div className="relative z-10 max-w-3xl mx-auto py-16 px-8">
                    <ChapterContentLoader chapterId={chapter.id} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            {backgroundGlow}

            <div className="relative z-10 max-w-5xl mx-auto py-16 px-8 md:px-12">
                {/* Header */}
                <header className="mb-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground/60 mb-8">
                        <span className="truncate">{chapter.module.course.title}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                        <span className="truncate">{chapter.module.title}</span>
                    </nav>

                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                            {chapter.title}
                        </h1>

                        <div className="flex items-center gap-4">
                            <RegenerateButton chapterId={chapter.id} />
                            <div className="h-8 px-3 flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 text-xs font-medium text-muted-foreground">
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{chapter.concepts.length} Concepts</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Concepts Stream */}
                <div className="space-y-16">
                    {chapter.concepts.map((concept, i) => (
                        <section key={concept.id} id={`concept-${concept.id}`} className="group relative pl-0 lg:pl-8 scroll-mt-32">
                            {/* Timeline (Desktop Only) */}
                            <div className="absolute left-[-1rem] top-0 bottom-0 w-px bg-border/40 hidden lg:block group-last:bottom-auto group-last:h-full">
                                <div className="absolute left-1/2 -translate-x-1/2 top-4 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground z-10 group-hover:border-primary group-hover:text-primary transition-colors">
                                    {i + 1}
                                </div>
                            </div>

                            {/* Mobile Number */}
                            <div className="lg:hidden mb-4 flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                                    {i + 1}
                                </span>
                                <h2 className="text-xl font-bold tracking-tight">{concept.title}</h2>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground hidden lg:block group-hover:text-primary transition-colors duration-300">
                                    {concept.title}
                                </h2>

                                {/* Content Card */}
                                <div className="prose prose-slate dark:prose-invert max-w-none 
                                         bg-card/30 backdrop-blur-sm border border-border/40 rounded-2xl p-6 md:p-8
                                         shadow-sm hover:shadow-md transition-all duration-300
                                         prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl">
                                    {concept.content && Array.isArray(concept.content) ? (
                                        (concept.content as any[]).map((block, idx) => (
                                            <div key={idx} className="mb-6 last:mb-0">
                                                <BlockRenderer
                                                    block={block}
                                                    conceptId={concept.id}
                                                    blockIndex={idx}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                            <PlayCircle className="size-8 animate-pulse text-primary/40" />
                                            <p className="text-sm">Loading content...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer Goal */}
                <div className="mt-32 pb-20 flex justify-center border-t border-border/40 pt-12">
                    <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2">
                        Complete Chapter <CheckCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
