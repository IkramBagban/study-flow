
import { AgentBase } from "../core/agent-base";

export class DirectorAgent extends AgentBase {
    constructor() {
        super("director");
    }
    async planContentBytes(context: {
        course: string;
        module: string;
        concept: string;
        conceptType: string;
    }): Promise<any[]> {
        const prompt = `
        Role: Educational Director.
        Context: ${this.getPromptContext(context)}
        Task: Create a content flow (JSON Array) to teach this concept.
        
        Rules:
        - "priming": Analogy/Hook -> Visual -> Definition
        - "core": Definition -> Visual -> Example
        - "application": Problem -> Solution
        - End with "recall_question".
        
        Types: 
        - "text" (hook,definition,analogy,example)
        - "visual" (mermaid,recharts,svg,d3)
        - "recall_question" (flashcard,mcq)
        
        CRITICAL - Visual Tool Selection:
        - Use "mermaid" for: processes, workflows, sequences, relationships, hierarchies
        - Use "recharts" for: simple data trends, bar/line/pie charts, basic statistics
        - Use "svg" for: shapes, patterns, anatomical diagrams, physics, custom illustrations
          Examples: candlestick patterns, molecular structures, geometric shapes, trading signals
        - Use "d3" for: complex interactive visualizations, network graphs, force-directed layouts, advanced data viz
          Examples: stock market trends, complex relationships, interactive scatter plots, tree diagrams
        
        Example: [{"role":"text","variant":"hook","instruction":"..."},{"role":"visual","tool":"svg","instruction":"..."}]
        
        Output: JSON Array ONLY.
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
