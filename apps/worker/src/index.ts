import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { prisma } from '@study-flow/db';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { extractText } from 'unpdf';
import { appendFile } from 'node:fs/promises';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

console.log("---------------------------------------------------------");
console.log("🚀 WORKER STARTED - VERSION: V4 (CLEAN & ROBUST)");
console.log("---------------------------------------------------------");

// Embeddings Model
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
});

const worker = new Worker('ingestion-queue', async (job: Job) => {
    let resourceId = job.data.resourceId;

    try {
        console.log(`[Job ${job.id}] STARTED processing resource: ${resourceId}`);
        const { fileUrl, originalName } = job.data;
        const fileType = job.data.fileType || "application/pdf";

        // 1. Update Status => PROCESSING
        await prisma.resource.update({
            where: { id: resourceId },
            data: { status: "PROCESSING" }
        });

        // 2. Download File
        console.log(`[Job ${job.id}] Downloading file from: ${fileUrl}`);
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}. Ensure PDF delivery is enabled in Cloudinary.`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log(`[Job ${job.id}] Downloaded ${arrayBuffer.byteLength} bytes`);

        let content = "";

        // 3. Parse Content
        if (fileType === "application/pdf" || fileType === "pdf") {
            try {
                console.log(`[Job ${job.id}] Parsing PDF...`);

                // Convert Buffer to Uint8Array by creating a CLEAN copy
                const buffer = Buffer.from(arrayBuffer);
                const uint8Array = new Uint8Array(buffer);
                const cleanData = Uint8Array.from(uint8Array);

                const pdfData = await extractText(cleanData);

                console.log(`[Job ${job.id}] PDF Parsed. Pages: ${pdfData.totalPages}`);

                // Handle text array or string
                content = Array.isArray(pdfData.text) ? pdfData.text.join("\n") : pdfData.text;

                // Update metadata with page count
                const pageCount = pdfData.totalPages;
                await prisma.resource.update({
                    where: { id: resourceId },
                    data: { metadata: { pageCount, originalUrl: fileUrl } }
                });
            } catch (parseError: any) {
                console.error(`[Job ${job.id}] PDF PARSE ERROR: ${parseError.message}`);
                throw new Error(`PDF Parsing Failed: ${parseError.message}`);
            }
        } else {
            console.log(`[Job ${job.id}] Parsing Text...`);
            content = Buffer.from(arrayBuffer).toString('utf-8');
        }

        // Clean content
        content = content.replace(/\n\s*\n/g, "\n").trim();

        if (!content || content.length < 50) {
            throw new Error("Content too short or empty after parsing");
        }

        console.log(`[Job ${job.id}] Content length: ${content.length}`);

        // --- PROGRESSIVE STEP: Generate Preview Outline ---
        console.log(`[Job ${job.id}] Generating Preview Outline...`);
        const previewContext = content.substring(0, 15000); // 15k chars context

        // Dynamic import for graph
        const { courseArchitectGraph } = await import('../../web/lib/ai/engine/architect/graph');

        const graphInput = {
            topic: "Analyzed Resource Content",
            goal: "Create a course structure based on this material",
            level: "Intermediate",
            sourceText: previewContext,
            useOnlyResources: true,
            error: null
        };

        const result = await courseArchitectGraph.invoke(graphInput);

        // Merge metadata carefully
        const currentResource = await prisma.resource.findUnique({ where: { id: resourceId } });
        const currentMeta = (currentResource?.metadata as any) || {};

        await prisma.resource.update({
            where: { id: resourceId },
            data: {
                content: content,
                metadata: {
                    ...currentMeta,
                    previewDomainMap: result.domainMap,
                    previewStructure: result.structure
                }
            }
        });
        console.log(`[Job ${job.id}] Preview Outline Saved!`);

        // 4. Chunking
        console.log(`[Job ${job.id}] Chunking content...`);
        const chunks = splitText(content, 1000, 200);
        console.log(`[Job ${job.id}] Split into ${chunks.length} chunks`);

        // 5. Embedding & Storage (Batching)
        console.log(`[Job ${job.id}] Generating embeddings...`);
        const batchSize = 10;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchTexts = chunks.slice(i, i + batchSize);
            const vectors = await embeddings.embedDocuments(batchTexts);

            // Store
            for (let j = 0; j < batchTexts.length; j++) {
                const text = batchTexts[j];
                const vector = vectors[j];

                if (!vector || vector.length === 0) {
                    console.warn(`[Job ${job.id}] Warning: Empty vector for chunk ${j}. Skipping.`);
                    continue;
                }
                const vectorString = `[${vector.join(",")}]`;

                try {
                    await prisma.$executeRaw`
                        INSERT INTO "embedding" ("id", "resourceId", "content", "vector")
                        VALUES (gen_random_uuid(), ${resourceId}, ${text}, ${vectorString}::vector)
                    `;
                } catch (vectorError) {
                    console.error(`[Job ${job.id}] Failed to insert vector for chunk ${j}:`, vectorError);
                    // Continue to next chunk
                }
            }
        }

        // 6. Update Status => READY
        await prisma.resource.update({
            where: { id: resourceId },
            data: { status: "READY" }
        });
        console.log(`[Job ${job.id}] Completed successfully!`);

    } catch (error: any) {
        console.error(`[Job ${job.id}] ❌ FAILED:`, error.message);
        console.error(error.stack);

        // Write to log file just in case
        try {
            await appendFile('worker-error.log', `[${new Date().toISOString()}] Job ${job.id} Error: ${error.message}\nStack: ${error.stack}\n\n`);
        } catch (e) { /* ignore */ }

        // Update DB with Error
        try {
            const currentResource = await prisma.resource.findUnique({ where: { id: resourceId } });
            const currentMeta = (currentResource?.metadata as object) || {};

            await prisma.resource.update({
                where: { id: resourceId },
                data: {
                    status: "ERROR",
                    metadata: {
                        ...currentMeta,
                        error: error.message,
                        failedAt: new Date().toISOString()
                    }
                }
            });
        } catch (dbError) {
            console.error("Failed to update resource status to ERROR in DB", dbError);
        }

        throw error;
    }
}, {
    connection,
    lockDuration: 30000 // 30s lock for long jobs
});

worker.on('completed', job => {
    console.log(`[Job ${job.id}] has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`[Job ${job?.id}] has failed with ${err.message}`);
});

// Helper Function
function splitText(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
    if (!text) return [];
    const chunks: string[] = [];
    let start = 0;
    // Simple splitting logic for demo/robustness
    if (text.length <= chunkSize) return [text];

    while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);
        if (end >= text.length) {
            chunks.push(text.slice(start));
            break;
        }
        const chunkSlice = text.slice(start, end);
        // Try to split at newlines or periods
        let splitIndex = chunkSlice.lastIndexOf('\n');
        if (splitIndex < chunkSize * 0.5) splitIndex = chunkSlice.lastIndexOf('. ');

        if (splitIndex !== -1 && splitIndex > chunkSize * 0.5) {
            end = start + splitIndex + 1;
        }

        chunks.push(text.slice(start, end));
        start = end - chunkOverlap;
        if (start < 0) start = 0;
    }
    return chunks;
}
