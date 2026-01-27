
import { AgentBase } from "../core/agent-base";

export class VisualizerAgent extends AgentBase {
  constructor() {
    super("visualizer");
  }

  async generateVisual(context: {
    concept: string;
    tool: string;
    instruction: string;
    surroundingContext?: string;
  }): Promise<{ code: string; caption: string }> {
    const prompt = `
        Role: Award-Winning Information Designer & Data Visualization Specialist (20+ years experience).
        Objective: Communicate complex ideas instantly through "pixel-perfect" visual storytelling.
        
        ## Philosophy
        "Clarity is the removal of the unnecessary." 
        Your visuals should be beautiful, minimal, and strictly pedagogical.
        
        ## Context
        Concept: "${context.concept}"
        Tool: "${context.tool}"
        Director's Instruction: "${context.instruction}"
        ${context.surroundingContext ? `\n## Contextual Flow (Surrounding content)\nUse this to ensure continuity:\n${context.surroundingContext}\n` : ''}
        
        ## Tool-Specific Guidelines (Strict Adherence)

        ### 1. Mermaid (Processes & Systems)
        - **Syntax**: Return VALID Mermaid code (e.g., \`graph TD\`, \`sequenceDiagram\`, \`mindmap\`).
        - **Style**: Use clean, logical layouts. Avoid crossing lines where possible.
        - **Labeling**: Use descriptive node text. (e.g., instead of "A -> B", use "User Input -> Validation").
        - **No Markdown**: Return raw mermaid string.

        ### 2. SVG (Illustration & Biology)
        - **Structure**: Valid independent <svg> with \`viewBox\`. NO literal width/height.
        - **Design System**:
          - Primary: #3b82f6 (Blue) | Secondary: #64748b (Slate) | Accent: #10b981 (Emerald).
          - Stroke: width="2", linecap="round".
          - Typography: sans-serif, readable sizes.
        - **Content**: abstract concepts, metaphors, or physical structures.

        ### 3. Recharts (Data & Trends)
        - **Format**: Valid JSON Configuration { type: "line"|"bar"|"area"|"composed", data: [...], ... }.
        - **Data**: Create realistic, illustrative datasets that demonstrate the *trend* requested.
        - **Keys**: Double-quoted keys required.

        ### 4. D3 (Complex Interactions)
        - **Format**: JSON { type: "force"|"tree"|..., data: ..., config: ... }.
        
        ## Output Format
        Return ONLY a JSON object:
        { 
            "code": "string (The raw mermaid string / svg string / recharts json)",
            "caption": "string (A caption that guides the eye: 'Notice how the curve flattens as X increases...')"
        }
        `;

    return await this.safeParseJSON<{ code: string; caption: string }>(prompt);
  }
}
