
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/course-auth";

// Next.js App Router config
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        if (!await getSessionUserId()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll("file") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        console.log(`[Parser] Processing ${files.length} files...`);

        // Use unpdf for server-side PDF parsing

        // Response container
        const results = [];

        for (const file of files) {
            try {
                // 1. Upload to Storage (Temp/Draft)
                const { StorageService } = await import("@/lib/storage/storage-service");
                const uploadResult = await StorageService.upload(file, `temp/${Date.now()}`);

                let fileText = "";
                let pageCount = 0;
                let isTruncated = false;

                // 2. Parse Content (Smart Scan)
                if (file.type === "application/pdf") {
                    const arrayBuffer = await file.arrayBuffer();

                    const { extractText } = await import("unpdf");
                    // extractText returns { text, totalPages }
                    const result = await extractText(arrayBuffer, { mergePages: true });

                    fileText = result.text;
                    pageCount = result.totalPages;

                    // Log for debugging
                    console.log(`[Parser] ${file.name}: Processed ${pageCount} pages.`);

                } else {
                    fileText = await file.text();
                }

                // Cleanup text
                fileText = fileText.replace(/\n\s*\n/g, "\n").trim();

                results.push({
                    name: file.name,
                    size: file.size,
                    pageCount,
                    url: uploadResult.url,
                    key: uploadResult.key,
                    preview: fileText.slice(0, 1000), // Peek
                    text: fileText, // Full text for now (until we implement background ingestion)
                    isTruncated: false // marking false since we read all for now
                });

            } catch (err) {
                console.error(`Failed to parse file ${file.name}`, err);
                results.push({ name: file.name, error: "Failed to parse" });
            }
        }

        return NextResponse.json({
            files: results,
            count: results.length
        });
    } catch (error) {
        console.error("Parse error", error);
        return NextResponse.json({ error: "Failed to parse files" }, { status: 500 });
    }
}
