
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { StorageService } from "@/lib/storage/storage-service";
import { getSessionUserId, userOwnsResource } from "@/lib/course-auth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
    try {
        const { courseId, resourceId } = await params;
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!await userOwnsResource(userId, courseId, resourceId)) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        // Get resource to find fileKey
        const resource = await prisma.resource.findFirst({
            where: { id: resourceId, courseId }
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
