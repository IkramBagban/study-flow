
import { prisma } from "@study-flow/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    BrainCircuit,
    Files,
    GraduationCap,
    BookOpen
} from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/course-auth";

export default async function CourseLayout({
    children,
    params: paramsPromise
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const params = await paramsPromise;
    const now = new Date();
    const userId = await getSessionUserId();
    if (!userId) redirect("/login");

    const course = await prisma.course.findFirst({
        where: { id: params.id, userId },
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

    const totalDue = course.flashcards.length;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-80 border-r border-border bg-card/10 flex-col h-screen sticky top-0 hidden lg:flex">
                {/* Header */}
                <div className="p-6 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                    <Link href={`/course/${course.id}`} className="group block space-y-1.5">
                        <h1 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {course.title || course.subject}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
                            <LayoutGrid className="h-3 w-3" />
                            <span>Overview</span>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-border">
                    {/* Tools Section */}
                    <div className="space-y-2">
                        <h3 className="px-3 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">Study Tools</h3>
                        <div className="space-y-0.5">
                            <SidebarLink href={`/course/${course.id}/flashcards`} icon={BrainCircuit} label="Flashcards" badge={totalDue} />
                            <SidebarLink href={`/course/${course.id}/resources`} icon={Files} label="Resources" />
                            <SidebarLink href={`/course/${course.id}/quiz`} icon={GraduationCap} label="Final Exam" />
                        </div>
                    </div>

                    {/* Modules Section */}
                    <div className="space-y-6">
                        <h3 className="px-3 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">Curriculum</h3>
                        <div className="space-y-6">
                            {course.modules.map((module, i) => (
                                <div key={module.id} className="space-y-2">
                                    {/* Module Header */}
                                    <div className="px-3 flex gap-3 text-sm font-medium text-foreground/90">
                                        <span className="text-muted-foreground/30 font-mono text-xs pt-1">{(i + 1).toString().padStart(2, '0')}</span>
                                        <span className="leading-snug">{module.title}</span>
                                    </div>

                                    {/* Chapters List */}
                                    <div className="space-y-0.5 ml-8 border-l border-border/30 pl-2">
                                        {module.chapters.map(chapter => (
                                            <Link
                                                key={chapter.id}
                                                href={`/course/${course.id}/chapter/${chapter.id}`}
                                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-all relative group"
                                            >
                                                <span className="line-clamp-1">{chapter.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0 bg-background">
                {children}
            </main>
        </div>
    );
}

function SidebarLink({ href, icon: Icon, label, badge }: any) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-all group"
        >
            <Icon className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    );
}
