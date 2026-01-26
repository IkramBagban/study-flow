
import { AIModelFactory, currentAIConfig } from "../model-factory";

export class AgentBase {
    protected model;

    constructor() {
        this.model = AIModelFactory.createModel(currentAIConfig);
    }

    protected async safeParseJSON<T>(prompt: string): Promise<T> {
        try {
            const result = await this.model.invoke(prompt);
            const text = result.content.toString();
            // Remove markdown code fences
            const cleaned = text.replace(/```(?:json|javascript)?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error(`[AgentBase] JSON Parse Error for prompt: ${prompt.substring(0, 50)}...`, error);
            throw error;
        }
    }

    protected getPromptContext(context: Record<string, any>): string {
        return Object.entries(context)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');
    }
}
