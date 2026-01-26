
import { AgentBase } from "../core/agent-base";

export class DirectorAgent extends AgentBase {
    async planContentBytes(context: {
        course: string;
        module: string;
        concept: string;
        conceptType: string;
    }): Promise<any[]> {
        const prompt = `
        You are the Director of an educational content engine.
        
        Context:
        ${this.getPromptContext(context)}
        
        Task:
        Decide the best SEQUENCE (Flow) of content blocks to teach this concept effectively.
        Maximize student engagement and retention.

        Rules:
        - If "priming": Start with an Analogy or Hook.
        - If "core": Start with a Definition, then a Visual, then an Example.
        - If "application": Start with a Problem Scenario, then a Solution.
        - ALWAYS end with a "recall_question".
        
        Available Agents/Block Types:
        - "text" (Variant: "hook", "definition", "analogy", "example", "history")
        - "visual" (Tools: "mermaid" for processes, "recharts" for data/math)
        - "recall_question" (Assessment)

        Output Example:
        [
            { "role": "text", "variant": "hook", "instruction": "Explain via a water pipe analogy" },
            { "role": "visual", "tool": "mermaid", "instruction": "Flowchart of pressure accumulation" },
            { "role": "recall_question", "instruction": "Test understanding of pressure" }
        ]

        CRITICAL: Return ONLY valid JSON array.
        `;

        try {
            return await this.safeParseJSON<any[]>(prompt);
        } catch (e) {
            console.error("[DirectorAgent] Planning failed, falling back to default.", e);
            // Fallback plan if AI fails
            return [
                { role: "text", variant: "definition", instruction: "Explain the concept simply." },
                { role: "recall_question", instruction: "Check understanding." }
            ];
        }
    }
}
