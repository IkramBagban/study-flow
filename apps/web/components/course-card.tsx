
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Bell } from "lucide-react";
import { Course } from "@study-flow/db";
import { cn } from "@/lib/utils";

interface CourseCardProps {
    course: Course;
    dueCount?: number;
}

export function CourseCard({ course, dueCount = 0 }: CourseCardProps) {
    return (
        <Link href={`/course/${course.id}`} className="block h-full group">
            <div className="border border-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all bg-card h-full relative overflow-hidden">
                {/* Due Badge */}
                {dueCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-red-500 text-white px-2.5 py-1 rounded-bl-lg rounded-tr-xl text-xs font-bold shadow-lg">
                        <Bell className="size-3" />
                        {dueCount} due
                    </div>
                )}

                <div className="flex justify-between items-start">
                    <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                        dueCount > 0
                            ? "bg-red-500/10 text-red-500"
                            : "bg-primary/10 text-primary"
                    )}>
                        <BookOpen size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {course.level}
                    </span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description || course.goal}
                    </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="bg-primary w-0 h-full" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">0% Complete</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {dueCount > 0 ? 'Review' : 'Continue'} <ChevronRight size={14} />
                    </Button>
                </div>
            </div>
        </Link>
    );
}
