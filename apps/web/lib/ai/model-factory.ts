import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Define supported providers
export type AIProvider = "google" | "openai";

interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    modelName?: string;
}

// Factory to create model instances
export class AIModelFactory {
    static createModel(config: AIConfig): BaseChatModel {
        console.log(config)
        switch (config.provider) {
            case "google":
                return new ChatGoogleGenerativeAI({
                    model: config.modelName || "gemini-2.0-flash",
                    apiKey: config.apiKey,
                    temperature: 0.1,
                });

            // case "openai":
            // return new ChatOpenAI({
            //     modelName: config.modelName || "gpt-4o",
            //     apiKey: config.apiKey,
            //     temperature: 0.1,
            // });

            default:
                throw new Error(`Unsupported AI Provider: ${config.provider}`);
        }
    }
}

// Singleton Configuration (Change this one object to switch providers app-wide)
export const currentAIConfig: AIConfig = {
    provider: "google", // CHANGE THIS TO "openai" to switch
    apiKey: process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || "",
    modelName: "gemini-2.0-flash-exp" // Optional: override default model
}
