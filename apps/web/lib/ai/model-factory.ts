
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Define supported providers
export type AIProvider = "google" | "openai" | "anthropic";

export interface AIConfig {
    provider: AIProvider;
    model?: string;
    temperature?: number;
}

// Factory to create model instances
export class AIModelFactory {
    static createModel(config: AIConfig): BaseChatModel {
        // console.log(`[AIModelFactory] Initializing ${config.provider} model: ${config.model}`);

        switch (config.provider) {
            case "google":
                return new ChatGoogleGenerativeAI({
                    model: config.model || "gemini-2.0-flash",
                    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
                    temperature: config.temperature ?? 0.7,
                    maxRetries: 3,
                });

            case "openai":
                return new ChatOpenAI({
                    modelName: config.model || "gpt-4o",
                    apiKey: process.env.OPENAI_API_KEY!,
                    temperature: config.temperature ?? 0.7,
                });

            case "anthropic":
                return new ChatAnthropic({
                    modelName: config.model || "claude-3-5-sonnet-20241022",
                    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
                    temperature: config.temperature ?? 0.7,
                });

            default:
                throw new Error(`Unsupported AI Provider: ${config.provider}`);
        }
    }
}

// Default Configuration (used by legacy code)
export const currentAIConfig: AIConfig = {
    provider: "google",
    model: "gemini-2.0-flash"
}
