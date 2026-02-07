import { prisma } from "@study-flow/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;

    // Simple status check
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { status: true }
    });

    if (!course) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ status: course.status });
}
