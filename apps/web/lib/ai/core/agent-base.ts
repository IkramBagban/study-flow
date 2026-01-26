
import { AIModelFactory } from "../model-factory";
import { getAgentModel } from "./agent-config";

export class AgentBase {
    protected model;
    protected agentName: string;

    constructor(agentName: string) {
        this.agentName = agentName;
        const config = getAgentModel(agentName);
        console.log("config:=>", config)
        this.model = AIModelFactory.createModel(config);
        console.log(`[${agentName}] Using ${config.provider}/${config.model}`);
    }

    protected async safeParseJSON<T>(prompt: string): Promise<T> {
        try {
            const result = await this.model.invoke(prompt);
            const text = result.content.toString();
            // Remove markdown code fences
            const cleaned = text.replace(/```(?:json|javascript)?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error(`[${this.agentName}] JSON Parse Error for prompt: ${prompt.substring(0, 50)}...`, error);
            throw error;
        }
    }

    protected getPromptContext(context: Record<string, any>): string {
        return Object.entries(context)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');
    }
}
