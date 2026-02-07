import { prisma } from "@study-flow/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;

    // Fetch modules to show progress
    const modules = await prisma.module.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true }
    });

    return NextResponse.json({ modules });
}
