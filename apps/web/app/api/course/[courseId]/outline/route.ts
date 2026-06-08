import { prisma } from "@study-flow/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUserId, userOwnsCourse } from "@/lib/course-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!await userOwnsCourse(userId, courseId)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch modules to show progress
    const modules = await prisma.module.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true }
    });

    return NextResponse.json({ modules });
}
