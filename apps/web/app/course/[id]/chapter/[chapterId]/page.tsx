
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import { CourseService } from "@/lib/ai/course-service";
import { ChevronRight, PlayCircle, BookOpen, CheckCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ChapterPage(props: { params: Promise<{ id: string; chapterId: string }> }) {
    const params = await props.params;

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

    // Check if content generation is needed
    // In a real app, this should be an async job or client-side poller.
    // For now, we'll try to generate on-the-fly if missing (might be slow).
    const missingContent = chapter.concepts.some(c => !c.isReady);

    if (missingContent) {
        try {
            // Trigger generation (this waits, so page load will be slow first time)
            // Ideally show a "Generating..." skeleton using Suspense or client component.
            await CourseService.generateChapterContent(chapter.id);
        } catch (error) {
            console.error("Failed to generate chapter content:", error);
            // We suppress the error so the page still loads partially
        }

        // Re-fetch to get updated content
        // (In a real app, use revalidatePath)
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
                <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-secondary/50 to-transparent border border-border/50">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Phase 0: Map the Terrain</h3>
                    <p className="text-lg text-foreground/90 leading-relaxed">
                        Before diving deep, remember: this chapter connects
                        <span className="font-medium text-primary"> {chapter.module.title}</span> to your larger goal of
                        <span className="font-medium text-primary"> {chapter.module.course.goal}</span>.
                        We will build up from simple mental models to complex application.
                    </p>
                </div>
            </div>

            <div className="space-y-12">
                {concepts.map((concept, i) => (
                    <section key={concept.id} className="relative">
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

                            {/* Content Card */}
                            {concept.isReady && typeof concept.content === 'object' && concept.content ? (
                                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
                                    {/* Hook / Metaphor */}
                                    {(concept.content as any).hook && (
                                        <div className="p-4 rounded-xl bg-secondary/30 italic text-muted-foreground border-l-4 border-yellow-500/50">
                                            "{(concept.content as any).hook}"
                                        </div>
                                    )}

                                    {/* Clear Explanation */}
                                    <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                                        {(concept.content as any).explanation}
                                    </div>

                                    {/* Example */}
                                    {(concept.content as any).example && (
                                        <div className="mt-4 bg-zinc-950 rounded-lg p-4 font-mono text-sm text-blue-200 overflow-x-auto border border-white/5">
                                            {(concept.content as any).example}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <PlayCircle className="size-8 animate-pulse text-primary" />
                                    <p>Generating neuro-adaptive content...</p>
                                </div>
                            )}

                            {/* Active Recall Check (if exists) */}
                            {/* Assuming we might store recall question in another field or inside content, 
                                but schema has it as separate or optional. 
                                For now, simplified view. 
                            */}
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
