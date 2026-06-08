
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@study-flow/db";
import { getSessionUserId, userOwnsCourse } from "@/lib/course-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const { courseId } = await params;
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!await userOwnsCourse(userId, courseId)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Upload] Received file: ${file.name} (${file.type})`);

        // 1. Upload to Storage (Cloudinary)
        // NOTE: For PDFs, ensure "PDF and ZIP files delivery" is enabled in Cloudinary Settings > Security
        const { StorageService } = await import("@/lib/storage/storage-service");
        const uploadResult = await StorageService.upload(file, `courses/${courseId}`);
        console.log(`[Upload] Stored at: ${uploadResult.url}`);

        // 2. Create Resource Record (Status: QUEUED)
        const resource = await prisma.resource.create({
            data: {
                courseId,
                content: "", // Content will be populated by the worker
                type: file.type === "application/pdf" ? "pdf" : "text",
                fileName: file.name,
                url: uploadResult.url,
                fileKey: uploadResult.key,
                status: "QUEUED",
                metadata: {
                    size: file.size,
                    originalName: file.name,
                    mimeType: file.type
                }
            }
        });

        // 3. Dispatch Job to Queue
        const { ingestionQueue } = await import("@/lib/queue/client");
        await ingestionQueue.add("ingest-resource", {
            resourceId: resource.id,
            fileUrl: uploadResult.url,
            fileType: file.type
        });

        return NextResponse.json({
            success: true,
            fileName: file.name,
            url: uploadResult.url,
            resourceId: resource.id,
            status: "QUEUED"
        });

    } catch (error) {
        console.error("Upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
