
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";
import { Course } from "@study-flow/db";

interface CourseCardProps {
    course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
    return (
        <Link href={`/course/${course.id}`} className="block h-full">
            <div className="border border-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-sm transition-all bg-card h-full">
                <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpen size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {course.level}
                    </span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description || course.goal}
                    </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        {/* Mock Progress - In a real app we'd calculate this */}
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="bg-primary w-0 h-full" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">0% Complete</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        Continue <ChevronRight size={14} />
                    </Button>
                </div>
            </div>
        </Link>
    );
}
