import { prisma } from "@study-flow/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/course-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
        select: { status: true }
    });

    if (!course) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ status: course.status });
}
