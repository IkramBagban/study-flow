
import { AgentBase } from "../core/agent-base";

export class VisualizerAgent extends AgentBase {
    constructor() {
        super("visualizer");
    }

    async generateVisual(context: {
        concept: string;
        tool: string;
        instruction: string;
    }): Promise<{ code: string; caption: string }> {
        const prompt = `
        You are a Data Visualization expert.
        
        Context: ${this.getPromptContext(context)}
        
        Task: Generate code for the requested visualization tool.
        
        Rules:
        - Mermaid: Return ONLY valid Mermaid syntax string. Use for flowcharts, sequences, processes.
        - Recharts: Return ONLY valid JSON props (data array, keys, type) for Recharts. Use for data trends, math functions.
        - SVG: Return a raw <svg> string. Use for custom diagrams, anatomical charts, physics vectors, or specific shapes.
        - D3: Return a JSON object with D3 visualization config. Use for complex interactive visualizations.
          
        SVG Best Practices:
          - Use viewBox="0 0 400 300" (adjust based on content)
          - Use semantic colors: stroke="#10b981" (green), "#ef4444" (red), "#64748b" (gray)
          - Add stroke-width="2" for visibility
          - Use fill="none" for outlines, fill="#color" for solid shapes
          - Add text labels with fill="#color" (background is white. Colors should be visible)
          - For candlesticks: Draw rectangles for body, lines for wicks
            Example: <rect x="100" y="80" width="30" height="60" fill="#10b981" stroke="#10b981"/>
                     <line x1="115" y1="50" x2="115" y2="80" stroke="#10b981" stroke-width="2"/>
        
        D3 Best Practices:
          - Return JSON with: { "type": "line|bar|scatter|area", "data": [...], "config": {...} }
          - For line charts: data should be array of {x, y} points
          - For bar charts: data should be array of {label, value} objects
          - Include axis labels, colors, and dimensions in config
          - Example: {"type":"line","data":[{"x":0,"y":10},{"x":1,"y":20}],"config":{"xLabel":"Time","yLabel":"Value","color":"#3b82f6"}}
        
        Output: JSON { "code": "...", "caption": "Brief description of what the visual shows" }
        `;

        return await this.safeParseJSON<{ code: string; caption: string }>(prompt);
    }
}
