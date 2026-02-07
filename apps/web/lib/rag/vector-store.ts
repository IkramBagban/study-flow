
import { prisma } from "@study-flow/db";
import { getBatchEmbeddings, getEmbeddings } from "./embeddings";
import { splitText } from "./text-splitter";

/**
 * Ingests a text resource into the RAG system.
 * 1. Creates a Resource record.
 * 2. Chunks the content.
 * 3. Generates embeddings.
 * 4. Stores vectors in the database.
 */
/**
 * Ingests a text resource into the RAG system.
 * Legacy Wrapper: Creates resource and keys it immediately.
 */
export async function ingestResource(
    courseId: string,
    content: string,
    type: string,
    fileName?: string,
    storage?: { url: string; key: string, metadata?: any }
) {
    // 1. Create Resource Record
    const resource = await prisma.resource.create({
        data: {
            courseId,
            content, // Extracted text
            type,
            fileName,
            url: storage?.url,
            fileKey: storage?.key,
            metadata: storage?.metadata ?? undefined,
            status: "READY" // Synchronous ingestion implies ready
        }
    });

    // 2. Generate Embeddings
    await generateEmbeddingsForResource(resource.id, content);

    return resource;
}

/**
 * Generates embeddings for an existing Resource record.
 * This is the heavy lifting function used by Background Workers.
 */
export async function generateEmbeddingsForResource(resourceId: string, content: string) {
    // 1. Split Text
    console.log(`[RAG] 🧠 Splitting content of length ${content.length} for Resource ${resourceId}`);
    const chunks = splitText(content);
    console.log(`[RAG]  Split into ${chunks.length} chunks`);

    if (chunks.length === 0) return;

    // 2. Generate Embeddings in Batches
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        try {
            const vectors = await getBatchEmbeddings(batchChunks);

            // 3. Store Embeddings
            for (let j = 0; j < batchChunks.length; j++) {
                const chunkText = batchChunks[j];
                const vector = vectors[j];

                // Use raw query to insert vector data
                if (vector) {
                    const vectorString = `[${vector.join(",")}]`;
                    await prisma.$executeRaw`
                      INSERT INTO "embedding" ("id", "resourceId", "content", "vector")
                      VALUES (gen_random_uuid(), ${resourceId}, ${chunkText}, ${vectorString}::vector)
                  `;
                }
            }
        } catch (error) {
            console.error("[RAG] Error generating/storing embeddings for batch", error);
            throw error; // Throw to let Inngest retry
        }
    }
}

/**
 * Searches for relevant context within a course's resources.
 */
export async function searchSimilar(courseId: string, query: string, limit = 5) {
    const vector = await getEmbeddings(query);

    // Prisma Raw Query for pgvector cosine similarity (<=> is distance, 1 - distance is similarity usually, or just order by distance ASC)
    // Order by distance ASC (closest first)
    const results = await prisma.$queryRaw`
        SELECT e.content, e."resourceId", (e.vector <=> ${vector}::vector) as distance
        FROM "embedding" e
        JOIN "resource" r ON e."resourceId" = r.id
        WHERE r."courseId" = ${courseId}
        ORDER BY distance ASC
        LIMIT ${limit}
    `;

    return results as { content: string, resourceId: string, distance: number }[];
}
