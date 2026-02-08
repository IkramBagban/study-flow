
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { CourseGenerationLoader } from "@/components/course-generation-loader";

export default async function CoursePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const course = await prisma.course.findUnique({
        where: { id: params.id },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        orderBy: { order: 'asc' },
                        take: 1
                    }
                }
            }
        }
    });

    if (!course) {
        notFound();
    }

    if (course.status === "GENERATING") {
        return <CourseGenerationLoader courseId={course.id} />;
    }

    const firstChapterLink = course.modules[0]?.chapters[0]
        ? `/course/${course.id}/chapter/${course.modules[0].chapters[0].id}`
        : "#";

    return (
        <div className="max-w-4xl mx-auto py-16 px-6 space-y-16 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium mx-auto border border-primary/10">
                    <Layers className="h-3 w-3" />
                    Course Overview
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                    {course.title || course.subject}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {course.description || `A structured learning path for mastering ${course.subject}.`}
                </p>
                <div className="pt-4">
                    <Link href={firstChapterLink}>
                        <button className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                            Start Learning
                        </button>
                    </Link>
                </div>
            </div>

            {/* Clean List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Curriculum</h2>
                    <span className="text-sm text-muted-foreground">{course.modules.length} Modules</span>
                </div>

                <div className="grid gap-3">
                    {course.modules.map((module, i) => {
                        const firstChapterId = module.chapters[0]?.id;
                        const href = firstChapterId ? `/course/${course.id}/chapter/${firstChapterId}` : "#";

                        return (
                            <Link href={href} key={module.id} className="group block">
                                <div className="flex items-center gap-6 p-6 rounded-xl border border-border/40 bg-card/30 hover:bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                                    <div className="h-10 w-10 flex items-center justify-center text-lg font-bold text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                            {module.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                            {module.description}
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground/50 group-hover:border-primary/30 group-hover:text-primary transition-all group-hover:translate-x-1">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
