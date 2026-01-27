
import { AgentBase } from "../core/agent-base";

export class ProfessorAgent extends AgentBase {
    constructor() {
        super("professor");
    }

    async generateText(context: {
        concept: string;
        course: string;
        variant: string;
        instruction: string;
    }): Promise<string> {
        const prompt = `
        You are an expert tutor. Write a concise educational text block using RICH TEXT formatting.
        
        Context: ${this.getPromptContext(context)}
        
        Style: Conversational, clear, engaging.
        Length: Under 120 words.
        
        Formatting Rules:
        1. Use Markdown for hierarchy (### for subheaders, * for lists, **bold** for emphasis).
           - CRITICAL: ALWAYS put an empty line BEFORE any header (###) or list (*).
        2. Use LaTeX for ALL mathematical formulas or scientific notations.
           - Inline: $E = mc^2$ (Use single $ decorators)
           - Block: 
             $$
             \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
             $$
             (Use double $$ decorators on their own lines)
        3. Use Markdown code blocks with language tags for any code snippets (e.g., \`\`\`typescript ... \`\`\`).
        4. Use blockquotes (>) for key insights, followed by an empty line.
        
        Output: JSON { "content": "..." }
        `;

        const res = await this.safeParseJSON<{ content: string }>(prompt);
        return res.content;
    }
}
