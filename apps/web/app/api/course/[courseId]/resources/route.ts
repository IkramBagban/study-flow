
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const { courseId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resources = await prisma.resource.findMany({
            where: { courseId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                type: true,
                url: true,
                createdAt: true,
                metadata: true
            }
        });

        return NextResponse.json(resources);
    } catch (error) {
        console.error("Failed to fetch resources", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
