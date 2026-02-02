
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

        let content = "";

        if (file.type === "application/pdf") {
            // TODO: Implement PDF parsing using pdf-parse or similar
            // For now, return error or mock
            return NextResponse.json({ error: "PDF support coming soon" }, { status: 400 });
        } else {
            // Assume text-based
            content = await file.text();
        }

        if (!content || content.length < 10) {
            return NextResponse.json({ error: "File content empty or too short" }, { status: 400 });
        }

        await ingestResource(courseId, content, 'text', file.name);

        return NextResponse.json({ success: true, fileName: file.name });
    } catch (error) {
        console.error("Upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
