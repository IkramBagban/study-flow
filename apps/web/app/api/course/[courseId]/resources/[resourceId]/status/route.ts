import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { getSessionUserId, userOwnsResource } from "@/lib/course-auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
    try {
        const { courseId, resourceId } = await params;
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsResource(userId, courseId, resourceId)) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        const resource = await prisma.resource.findUnique({
            where: {
                id: resourceId,
                courseId: courseId
            },
            select: {
                id: true,
                status: true,
                fileName: true,
                metadata: true,
                content: true
            }
        });

        if (!resource) {
            return NextResponse.json(
                { error: "Resource not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(resource);
    } catch (error) {
        console.error("Failed to get resource status:", error);
        return NextResponse.json(
            { error: "Failed to get resource status" },
            { status: 500 }
        );
    }
}
