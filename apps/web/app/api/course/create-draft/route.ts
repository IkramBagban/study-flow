import { NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { auth } from "@/lib/auth";

export async function POST() {
    try {
        // Get current user session
        const session = await auth.api.getSession({
            headers: await import("next/headers").then(m => m.headers())
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Create a draft course with minimal data
        // This will be promoted to a full course later after user confirms
        const course = await prisma.course.create({
            data: {
                userId: session.user.id,
                title: "Draft Course",
                description: "Course being prepared...",
                subject: "Pending Analysis",
                goal: "To be determined",
                level: "Intermediate",
                status: "DRAFT"
            }
        });

        return NextResponse.json({
            success: true,
            courseId: course.id
        });
    } catch (error) {
        console.error("Failed to create draft course:", error);
        return NextResponse.json(
            { error: "Failed to create draft course" },
            { status: 500 }
        );
    }
}
