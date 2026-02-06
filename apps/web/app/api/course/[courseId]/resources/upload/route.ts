
import { NextRequest, NextResponse } from "next/server";
import { ingestResource } from "@/lib/rag/vector-store";
import { prisma } from "@study-flow/db";

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const { courseId } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Upload] Received file: ${file.name} (${file.type})`);

        // 1. Upload to Storage (Cloudinary)
        // We do this for BOTH text and PDFs so we have a permanent record
        const { StorageService } = await import("@/lib/storage/storage-service");
        const uploadResult = await StorageService.upload(file, `courses/${courseId}`);
        console.log(`[Upload] Stored at: ${uploadResult.url}`);

        // 2. Extract Text Content
        let content = "";
        let metadata = { size: file.size, pageCount: 0 };

        if (file.type === "application/pdf") {
            const pdfParse = (await import("pdf-parse")).default;
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const pdfData = await pdfParse(buffer);
            content = pdfData.text;
            metadata.pageCount = pdfData.numpages;

            // Basic cleaning: remove excessive newlines/spaces
            content = content.replace(/\n\s*\n/g, "\n").trim();
            console.log(`[Upload] Parsed PDF: ${metadata.pageCount} pages, ${content.length} chars`);
        } else {
            // Assume text-based
            content = await file.text();
        }

        if (!content || content.length < 50) {
            // Rollback storage if parsing fails/empty
            await StorageService.delete(uploadResult.key);
            return NextResponse.json({ error: "File content empty or too short to index." }, { status: 400 });
        }

        // 3. Ingest into RAG System (Vector DB)
        await ingestResource(
            courseId,
            content,
            file.type === "application/pdf" ? "pdf" : "text",
            file.name,
            {
                url: uploadResult.url,
                key: uploadResult.key,
                metadata: metadata
            }
        );

        return NextResponse.json({
            success: true,
            fileName: file.name,
            url: uploadResult.url
        });

    } catch (error) {
        console.error("Upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
