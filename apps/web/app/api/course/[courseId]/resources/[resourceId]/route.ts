
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StorageService } from "@/lib/storage/storage-service";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
    try {
        const { courseId, resourceId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { userId: true }
        });

        if (!course || course.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get resource to find fileKey
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId }
        });

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        // Delete from Storage if it has a key
        if (resource.fileKey) {
            try {
                await StorageService.delete(resource.fileKey);
            } catch (e) {
                console.error("Failed to delete file from storage", e);
                // Continue deleting from DB even if storage fails (orphan file is better than broken app state)
            }
        }

        // Delete from DB (Cascade deletes embeddings)
        await prisma.resource.delete({
            where: { id: resourceId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete resource", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
