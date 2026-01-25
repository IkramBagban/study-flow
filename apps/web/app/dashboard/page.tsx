import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd, BookOpen, Clock, ChevronRight } from "lucide-react";
import { CreateCourseFlow } from "../../components/create-course-flow";
import { CreateCourseCard } from "@/components/create-course-card";

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar - Minimalist */}
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
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-5xl mx-auto w-full">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                        <p className="text-muted-foreground text-sm">Organize and track your learning progress.</p>
                    </div>

                    <CreateCourseFlow />
                </header>

                {/* Empty State / Courses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CreateCourseCard />

                    {/* Sample Course Card */}
                    <div className="border border-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-sm transition-all bg-card">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <BookOpen size={20} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">Basics</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-lg">Quantum Mechanics</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">Understanding the fundamental nature of reality at the smallest scales.</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-primary w-1/3 h-full" />
                                </div>
                                <span className="text-[10px] text-muted-foreground">32% Complete</span>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                Continue <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
