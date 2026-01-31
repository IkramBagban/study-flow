
import { prisma } from "@study-flow/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain, Bell, GalleryVerticalEnd } from "lucide-react";

export default async function CourseLayout({
    children,
    params: paramsPromise
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const params = await paramsPromise;
    const now = new Date();

    const course = await prisma.course.findUnique({
        where: { id: params.id },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        orderBy: { order: 'asc' }
                    }
                }
            },
            flashcards: {
                where: {
                    due: { lte: now }
                },
                select: {
                    id: true,
                    chapterId: true
                }
            }
        }
    });

    if (!course) notFound();

    // Count due flashcards per chapter
    const chapterDueCounts: Record<string, number> = {};
    course.flashcards.forEach(card => {
        if (card.chapterId) {
            chapterDueCounts[card.chapterId] = (chapterDueCounts[card.chapterId] || 0) + 1;
        }
    });

    const totalDue = course.flashcards.length;

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar */}
            <aside className="w-80 border-r border-border h-screen sticky top-0 overflow-y-auto bg-card/50 hidden lg:block">
                <div className="p-6 border-b border-border space-y-4">
                    <div>
                        <Link href={`/course/${course.id}`} className="block">
                            <h1 className="font-bold text-xl leading-tight hover:text-primary transition-colors">{course.title}</h1>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                    </div>

                    {/* Course Tools Row */}
                    <div className="flex items-center gap-2 pt-2">
                        {/* Flashcards */}
                        <Link
                            href={`/course/${course.id}/flashcards`}
                            className={cn(
                                "relative flex items-center justify-center p-2.5 rounded-lg border transition-all hover:-translate-y-0.5 group",
                                totalDue > 0
                                    ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                    : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                            title="Flashcards"
                        >
                            <GalleryVerticalEnd className="size-5" />
                            {totalDue > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-0.5 border-2 border-background shadow-sm">
                                    {totalDue}
                                </span>
                            )}
                        </Link>

                        {/* Quiz Checkpoint (Placeholder) */}
                        <button
                            className="relative flex items-center justify-center p-2.5 rounded-lg border bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all hover:-translate-y-0.5 group"
                            title="Quick Quiz"
                        >
                            <Brain className="size-5" />
                        </button>

                        {/* Unit Test (Placeholder) */}
                        <button
                            className="relative flex items-center justify-center p-2.5 rounded-lg border bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all hover:-translate-y-0.5 group"
                            title="Unit Test"
                        >
                            <Bell className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Chapters */}
                <div className="p-4 space-y-6">
                    {course.modules.map((module, i) => (
                        <div key={module.id} className="space-y-2">
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Module {i + 1}: {module.title}
                            </div>
                            <div className="space-y-1">
                                {module.chapters.map((chapter) => {
                                    const chapterDue = chapterDueCounts[chapter.id] || 0;
                                    return (
                                        <Link
                                            key={chapter.id}
                                            href={`/course/${course.id}/chapter/${chapter.id}`}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 text-sm flex items-center gap-3 transition-colors group"
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-colors",
                                                chapterDue > 0
                                                    ? "border-red-500 text-red-500 bg-red-500/10"
                                                    : "border-border text-muted-foreground group-hover:border-primary group-hover:text-primary"
                                            )}>
                                                {chapterDue > 0 ? chapterDue : chapter.order + 1}
                                            </div>
                                            <span className="line-clamp-1 flex-1">{chapter.title}</span>
                                            {chapterDue > 0 && (
                                                <span className="text-[10px] text-red-500 font-medium">due</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto p-8 lg:p-12 w-full">
                {children}
            </main>
        </div>
    );
}
