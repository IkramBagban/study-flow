
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
        You are a Data Visualization expert.
        
        General Context: ${this.getPromptContext(context)}
        ${context.surroundingContext ? `\nSurrounding Content Context:\n${context.surroundingContext}\n` : ''}
        
        Task: Generate code for the requested visualization tool.
        
        Rules:
        - Mermaid: Return ONLY valid Mermaid syntax. 
          - Always start with "graph LR" or "graph TD".
          - Use explicit node shapes: A[Label], B(Label), C((Label)).
          - IMPORTANT: Always put quotes around labels that contain symbols or spaces: A["Label with (Parentheses)"]
          - Example: graph LR\n  A["Input"] --> B["Process"]
        - Recharts: Return ONLY a valid JSON object.
          - Use double quotes for ALL keys.
          - Example: { "type": "line", "data": [{ "x": 1, "y": 2 }] }
        - SVG: Return a raw <svg> string. 
        - D3: Return a JSON object with { type, data, config }.
          
        SVG Best Practices:
          - Use viewBox="0 0 400 300"
          - Colors: stroke="#10b981" (green), "#ef4444" (red), "#3b82f6" (blue)
          - Use white background context if needed.
        
        Output: JSON { "code": "...", "caption": "Brief description" }
        `;

    return await this.safeParseJSON<{ code: string; caption: string }>(prompt);
  }
}
