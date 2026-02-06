
import { NextRequest, NextResponse } from "next/server";

// Next.js App Router config
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("file") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        console.log(`[Parser] Processing ${files.length} files...`);

        // Use unpdf for server-side PDF parsing (no DOM dependencies)
        const { extractText } = await import("unpdf");

        let combinedContent = "";

        for (const file of files) {
            let fileContent = "";
            let storageUrl = "";
            let storageKey = "";

            try {
                // 1. Upload to Storage (Temp/Draft folder)
                const { StorageService } = await import("@/lib/storage/storage-service");
                const uploadResult = await StorageService.upload(file, `temp/${Date.now()}`);
                storageUrl = uploadResult.url;
                storageKey = uploadResult.key;

                // 2. Parse Content
                if (file.type === "application/pdf") {
                    const arrayBuffer = await file.arrayBuffer();
                    const { text } = await extractText(arrayBuffer, { mergePages: true });
                    fileContent = `--- FILE: ${file.name} ---\n${text}`;
                } else {
                    // Assume text
                    const text = await file.text();
                    fileContent = `--- FILE: ${file.name} ---\n${text}`;
                }

                // Cleanup
                fileContent = fileContent.replace(/\n\s*\n/g, "\n").trim();
                combinedContent += (combinedContent ? "\n\n" : "") + fileContent;

            } catch (err) {
                console.error(`Failed to parse file ${file.name}`, err);
                combinedContent += `\n\n--- ERROR PARSING ${file.name} ---`;
            }
        }

        return NextResponse.json({
            text: combinedContent,
            count: files.length,
            // Note: In a real multi-file scenario, we'd return an array of metadata. 
            // For now, keeping it simple as the frontend focuses on text.
            // Future improvement: Return `files: [{name, url, key, text}]`
        });
    } catch (error) {
        console.error("Parse error", error);
        return NextResponse.json({ error: "Failed to parse files" }, { status: 500 });
    }
}
