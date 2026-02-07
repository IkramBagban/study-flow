
import { prisma } from "@study-flow/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RegenerateButton } from "@/components/regenerate-button";
import { ScrollText, PlayCircle } from "lucide-react";
import { CourseGenerationLoader } from "@/components/course-generation-loader";

export default async function CoursePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const course = await prisma.course.findUnique({
        where: { id: params.id },
        include: {
            modules: {
                include: {
                    chapters: {
                        include: {
                            concepts: true
                        }
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

    return (
        <>
            <div className="mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Learning Path Generated
                </div>
                <h2 className="text-4xl font-bold tracking-tight">Your Learning Map</h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    We've broken down <span className="text-foreground font-semibold">{course.subject}</span> into {course.modules.length} key modules.
                    Start your journey below.
                </p>
            </div>

            <div className="grid gap-8">
                {course.modules.map((module, i) => (
                    <div key={module.id} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                        <div className="relative border border-border bg-card rounded-xl overflow-hidden">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-border/50">
                                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-2xl font-bold text-muted-foreground/50 shrink-0">
                                    0{i + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-2xl font-semibold">{module.title}</h3>
                                    <p className="text-muted-foreground">{module.description}</p>
                                </div>
                            </div>
                            <div className="bg-secondary/20 p-6 grid md:grid-cols-2 gap-4">
                                {module.chapters.map((chapter) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/course/${course.id}/chapter/${chapter.id}`}
                                        className="flex items-start justify-between gap-4 p-4 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-all group/chapter"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                            <div className="space-y-1">
                                                <div className="font-medium text-sm transition-colors group-hover/chapter:text-primary">{chapter.title}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{chapter.estimatedTime}</span>
                                                    <span>•</span>
                                                    <span>{chapter.concepts.length} concepts</span>
                                                </div>
                                            </div>
                                        </div>
                                        <RegenerateButton chapterId={chapter.id} variant="icon" className="opacity-0 group-hover/chapter:opacity-100" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Final Exam Section */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/20 text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Course Final Exam</h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Verify your mastery of {course.subject} with a comprehensive assessment covering all modules.
                    </p>
                </div>
                <Link href={`/course/${course.id}/quiz`}>
                    <button className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto">
                        Start Final Exam
                    </button>
                </Link>
            </div>
        </>
    );
}
