import Link from "next/link";
import { GalleryVerticalEnd, BookOpen, Clock, BarChart3 } from "lucide-react";
import { CreateCourseFlow } from "@/components/create-course-flow";
import { CreateCourseCard } from "@/components/create-course-card";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@study-flow/db";
import { CourseCard } from "@/components/course-card";
import { ReviewReminder } from "@/components/review-reminder";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return redirect("/login");
    }

    // Fetch courses with flashcard due counts
    const courses = await prisma.course.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            _count: {
                select: {
                    flashcards: {
                        where: {
                            due: {
                                lte: new Date()
                            }
                        }
                    }
                }
            }
        }
    });

    // Convert to a map for easy lookup
    const dueCounts: Record<string, number> = {};
    courses.forEach(course => {
        dueCounts[course.id] = course._count.flashcards;
    });

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 gap-8">
                <div className="flex items-center gap-2 font-medium opacity-80">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                        <GalleryVerticalEnd size={14} />
                    </div>
                    <span className="tracking-tight text-sm">StudyFlow</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary text-foreground text-sm font-medium transition-colors">
                        <BookOpen size={18} className="opacity-70" />
                        My Courses
                    </Link>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-sm font-medium transition-colors text-left">
                        <Clock size={18} className="opacity-70" />
                        Recent Activity
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-sm font-medium transition-colors text-left">
                        <BarChart3 size={18} className="opacity-70" />
                        Learning Stats
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-5xl mx-auto w-full">
                {/* Review Reminder Banner */}
                <ReviewReminder />

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                        <p className="text-muted-foreground text-sm">Organize and track your learning progress.</p>
                    </div>

                    <CreateCourseFlow />
                </header>

                {/* Courses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CreateCourseCard />

                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            dueCount={dueCounts[course.id] || 0}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}
