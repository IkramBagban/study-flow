
import { AgentBase } from "../core/agent-base";

export class InquisitorAgent extends AgentBase {
    constructor() {
        super("inquisitor");
    }

    async generateQuestion(context: {
        concept: string;
        instruction: string;
    }): Promise<any> {
        const prompt = `
        Create a single active recall question.
        
        Context: ${this.getPromptContext(context)}
        
        Output: JSON { "question": "...", "answer": "...", "options": ["A", "B", "C"] (optional) }
        `;

        return await this.safeParseJSON<any>(prompt);
    }
}
