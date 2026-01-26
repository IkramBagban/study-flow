
import { AgentBase } from "../core/agent-base";

export class VisualizerAgent extends AgentBase {
    async generateVisual(context: {
        concept: string;
        tool: string;
        instruction: string;
    }): Promise<{ code: string; caption: string }> {
        const prompt = `
        You are a Data Visualization expert.
        
        Context: ${this.getPromptContext(context)}
        
        Task: Generate code for the requested visualization tool.
        
        Rules:
        - Mermaid: Return ONLY valid Mermaid syntax string.
        - Recharts: Return ONLY valid JSON props (data array, keys, type) for Recharts.
        
        Output: JSON { "code": "...", "caption": "..." }
        `;

        return await this.safeParseJSON<{ code: string; caption: string }>(prompt);
    }
}
