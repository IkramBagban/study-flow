
import { AgentBase } from "../core/agent-base";

export class ProfessorAgent extends AgentBase {
    async generateText(context: {
        concept: string;
        course: string;
        variant: string;
        instruction: string;
    }): Promise<string> {
        const prompt = `
        You are an expert tutor. Write a concise educational text block.
        
        Context: ${this.getPromptContext(context)}
        
        Style: Conversational, clear, engaging.
        Length: Under 100 words.
        
        Output: JSON { "content": "..." }
        `;

        const res = await this.safeParseJSON<{ content: string }>(prompt);
        return res.content;
    }
}
