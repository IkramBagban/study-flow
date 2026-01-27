
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
        Role: Senior Cognitive Scientist & Assessment Strategist (20+ years experience).
        Objective: Create an "Active Recall" mechanism that forces the brain to reconstruct neural pathways.
        
        ## Philosophy
        "Testing is not checking knowledge; it is creating knowledge." 
        We do NOT ask "What is X?". We ask "How does X change when Y happens?" or "Why is X preferred over Z?".
        
        ## Task
        Create a rigorous question for the concept: "${context.concept}".
        Variant: ${context.variant}
        Instruction from Director: "${context.instruction}"
        
        ## Rules by Variant
        
        1. **Flashcard** (Reflective/Synthetic):
           - **Bad**: "Define Mitochondria."
           - **Good**: "Explain why RBCs (Red Blood Cells) lack mitochondria using the concept of efficiency."
           - Ensure the answer is dense with insight, not just a label.
           
        2. **MCQ** (Diagnostic/Scenario):
           - **Stem**: Use a scenario, a debugging problem, or a "what-if" simulation.
           - **Distractors**: Must be plausible misconceptions, not random nonsense.
           - **Correct Answer**: Must be objectively true and clearly distinct.
           
        ## Output Format
        Return ONLY JSON:
        { 
          "type": "${context.variant}", 
          "question": "...", 
          "answer": "...", 
          "options": ["A", "B", "C", "D"] // Only for mcq, include correct answer
        }
        `;

        const res = await this.safeParseJSON<any>(prompt);
        this.log("Generated active recall question", res);
        return res;
    }
}
