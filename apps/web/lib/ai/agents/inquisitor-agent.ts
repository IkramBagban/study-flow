
import { AgentBase } from "../core/agent-base";

export class InquisitorAgent extends AgentBase {
    constructor() {
        super("inquisitor");
    }

    async generateQuestion(context: {
        concept: string;
        instruction: string;
        variant: 'flashcard' | 'mcq';
    }): Promise<any> {
        this.log("Generating active recall question for concept", { concept: context.concept, variant: context.variant });
        const prompt = `
        Role: Learning Scientist & Assessment Expert.
        
        Task: Create a powerful ACTIVE RECALL question for the concept: "${context.concept}".
        Variant: ${context.variant} (Generate ONLY this type)
        
        Rules:
        1. FORMAT: 
           - If "flashcard": Generate a Question -> Answer pair.
           - If "mcq": Generate Question -> 3-4 Options -> Correct Answer.
        2. COGNITIVE DEPTH: Don't ask for definitions. Ask HOW something works, WHY a certain trade-off exists, or WHAT would happen in a specific scenario.
        3. CONCISE ANSWER: The answer must be 1-2 sentences max or the correct option string.
        4. CLARITY: Ensure the question is unambiguous.
        
        Context: ${this.getPromptContext(context)}
        Specific Instruction: ${context.instruction}
        
        Output: JSON { "type": "${context.variant}", "question": "...", "answer": "...", "options": [] (only for mcq) }
        `;

        const res = await this.safeParseJSON<any>(prompt);
        this.log("Generated active recall question", res);
        return res;
    }
}
