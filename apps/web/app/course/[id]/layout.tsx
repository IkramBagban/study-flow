
import { prisma } from "@study-flow/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function CourseLayout({
    children,
    params: paramsPromise
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const params = await paramsPromise;
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
            }
        }
    });

    if (!course) notFound();

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar Navigation (Modules) */}
            <aside className="w-80 border-r border-border h-screen sticky top-0 overflow-y-auto bg-card/50 hidden lg:block">
                <div className="p-6 border-b border-border">
                    <Link href={`/course/${course.id}`} className="block">
                        <h1 className="font-bold text-xl leading-tight hover:text-primary transition-colors">{course.title}</h1>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                </div>
                <div className="p-4 space-y-6">
                    {course.modules.map((module, i) => (
                        <div key={module.id} className="space-y-2">
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Module {i + 1}: {module.title}
                            </div>
                            <div className="space-y-1">
                                {module.chapters.map((chapter) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/course/${course.id}/chapter/${chapter.id}`}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 text-sm flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-[10px] text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                            {chapter.order + 1}
                                        </div>
                                        <span className="line-clamp-1">{chapter.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 max-w-5xl mx-auto p-8 lg:p-12 w-full">
                {children}
            </main>
        </div>
    );
}
