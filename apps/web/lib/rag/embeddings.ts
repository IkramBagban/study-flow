
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function getEmbeddings(text: string): Promise<number[]> {
    const model = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
    });

    const vector = await model.embedQuery(text);
    return vector;
}

export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const model = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
    });

    const vectors = await model.embedDocuments(texts);
    return vectors;
}
