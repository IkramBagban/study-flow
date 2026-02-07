import { inngest } from "./client";
import { prisma } from "@study-flow/db";
import { generateEmbeddingsForResource } from "@/lib/rag/vector-store";

export const ingestResourceJob = inngest.createFunction(
    { id: "ingest-resource" },
    { event: "resource/ingest" },
    async ({ event, step }) => {
        const { resourceId, content } = event.data;

        // Step 1: Mark as Processing (Idempotency check)
        await step.run("update-status-processing", async () => {
            await prisma.resource.update({
                where: { id: resourceId },
                data: { status: "PROCESSING" }
            });
        });

        // Step 2: Generate Embeddings (Heavy Lifting - up to 15 mins allowed)
        await step.run("generate-embeddings", async () => {
            if (!content) {
                // If text is not passed (e.g. from storage), we might fetch it here.
                // For now, we assume text is passed.
                console.warn("No content provided for ingestion");
                return;
            }
            await generateEmbeddingsForResource(resourceId, content);
        });

        // Step 3: Mark as Ready
        await step.run("update-status-ready", async () => {
            await prisma.resource.update({
                where: { id: resourceId },
                data: { status: "READY" }
            });
        });

        return { success: true, resourceId };
    }
);
