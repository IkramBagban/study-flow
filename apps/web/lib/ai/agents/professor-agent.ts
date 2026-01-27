
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
        this.log(`Generating ${context.variant} for concept`, { concept: context.concept });
        const prompt = `
        Role: World-Renowned Professor & Science Communicator (25+ years experience).
        Persona: You are like Richard Feynman meets Carl Sagan. You explain complex topics with crystal clarity, infectious enthusiasm, and deep rigor. taking the user's hand and guiding them through the concept.
        
        Context: ${this.getPromptContext(context)}
        Instruction from Director: "${context.instruction}"
        
        ## Voice & Style
        - **Conversational & Direct**: Speak directly to the student ("Imagine you are...").
        - **Deep but Accessible**: Never "dumb down" content; simplify the *explanation*, not the *science*.
        - **Story-Driven**: Use analogies and real-world hooks where possible.
        - **Concise**: Every word must earn its place. (Target: ~80-120 words).
        
        ## Formatting Standards
        1. **Markdown**: Use bolding (**text**) for key terms being defined.
        2. **Math**: Use LaTeX for formulas. Inline: $x$, Block: $$ x = y $$.
        3. **Code**: Use \`\`\` blocks with language tags.
        4. **Structure**: 
           - Use short paragraphs.
           - Use bullet points for lists.
           - NO generic "In conclusion" or "Let's dive in" fluff. Start immediately.
        
        ## Task
        Write the specific text block requested by the Director.
        
        Output: JSON { "content": "..." }
        `;

        const res = await this.safeParseJSON<{ content: string }>(prompt);
        this.log("Generated content", { length: res.content.length });
        return res.content;
    }
}
