
import { AIModelFactory } from "../model-factory";
import { getAgentModel } from "./agent-config";

export class AgentBase {
    protected model;
    protected agentName: string;

    constructor(agentName: string) {
        this.agentName = agentName;
        const config = getAgentModel(agentName);
        this.model = AIModelFactory.createModel(config);
        console.log(`[${agentName}] Initialized with ${config.provider}/${config.model}`);
    }

    protected log(step: string, details?: any) {
        console.log(`[${this.agentName.toUpperCase()}] > ${step}`);
        if (details) {
            console.log(JSON.stringify(details, null, 2));
        }
    }


    protected async safeParseJSON<T>(prompt: string): Promise<T> {
        try {
            const result = await this.model.invoke(prompt);
            let text = result.content.toString().trim();

            // 1. Try to find the JSON block inside markdown fences if they exist
            const fenceMatch = text.match(/```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/);
            const jsonCandidate = (fenceMatch && fenceMatch[1]) ? fenceMatch[1].trim() : text;

            // 2. If parsing fails, try to extract the first { or [ block
            try {
                return JSON.parse(jsonCandidate) as T;
            } catch (e) {
                const blockMatch = jsonCandidate.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (blockMatch && blockMatch[0]) {
                    return JSON.parse(blockMatch[0]) as T;
                }
                throw e;
            }
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
