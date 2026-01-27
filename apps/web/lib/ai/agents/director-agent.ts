
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
        Role: Chief Learning Officer & Curriculum Architect (25+ years experience).
        Objective: Design a mastery-based micro-learning module for: "${context.concept}".
        
        ## Competency Profile
        You are a "Jack of All Trades" in pedagogy. You understand:
        - Cognitive Load Theory (managing complexity)
        - Dual Coding (pairing text with perfect visuals)
        - Scaffolding (building knowledge incrementally)
        - Interleaving (mixing concepts for retention)
        
        ## Context
        ${this.getPromptContext(context)}
        
        ## Task
        Create a precise "Director's Plan" (JSON Array) to teach this concept effectively. 
        You are directing a team of specialists (Professor, Visualizer, Inquisitor). 
        Your instructions to them must be SPECIFIC, not generic.
        
        ## Block Types & Specialists
        1. **"text" (Professor)**: 
           - variants: "hook", "definition", "analogy", "core", "application", "history"
           - instruction: Tell the Professor exactly *how* to explain it (e.g., "Use a water pipe analogy for voltage").
        
        2. **"visual" (Visualizer)**:
           - tools: 
             - "mermaid": BEST for flows, processes, sequences, state machines, class diagrams, hierarchies.
             - "recharts": BEST for data trends, math functions, statistical comparisons.
             - "svg": BEST for physical shapes, anatomy, geometry, custom illustrations (molecules, hardware).
             - "d3": BEST for complex networks, force-directed graphs, simulations.
           - instruction: Describe the *visual composition* (e.g., "A flow chart showing step A leading to B...").
           
        3. **"recall_question" (Inquisitor)**:
           - variants: "flashcard", "mcq"
           - instruction: Specify the *cognitive gap* to test (e.g., "Test distinction between X and Y").

        ## Standard Flow Patterns (Use as a base, but adapt)
        - **Priming**: Hook (Text) -> High-level Diagram (Visual:Mermaid/SVG) -> Basic Definition (Text).
        - **Deep Dive**: Core Concept (Text) -> Data/Structure Map (Visual:Recharts/SVG) -> Real-world Example (Text).
        - **Application**: Problem Statement (Text) -> Process Flow (Visual:Mermaid) -> Solution (Text).
        - **Consolidation**: Summary (Text) -> Recall Check (Question).
        
        ## Output Format (JSON Array ONLY)
        [
          { "role": "text", "variant": "hook", "instruction": "Start with a surprising fact about..." },
          { "role": "visual", "tool": "mermaid", "instruction": "A flowchart showing the decision process for..." }
        ]
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
