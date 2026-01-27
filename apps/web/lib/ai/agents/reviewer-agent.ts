
import { AgentBase } from "../core/agent-base";

export class ReviewerAgent extends AgentBase {
    constructor() {
        super("reviewer");
    }

    async reviewVisual(context: {
        concept: string;
        tool: string;
        code: string;
        instruction?: string;
    }): Promise<{ isApproved: boolean; feedback: string }> {
        this.log("Reviewing generated visual", { tool: context.tool });

        const prompt = `
        Role: Senior QA Engineer & Strict Design Critic.
        Objective: Verify that the generated code is syntactically valid, aesthetically professional, and layout-safe.
        **ATTITUDE**: You are a perfectionist. You are paid to Find Errors. If the visual is "okay" but not "perfect", REJECT IT.
        
        ## Context
        Concept: "${context.concept}"
        Tool: "${context.tool}"
        Original Instruction: "${context.instruction || 'N/A'}"
        
        ## Code to Review
        \`\`\`
        ${context.code}
        \`\`\`

        ## Checklist (Strict)
        
        1. **Syntax Check**:
           - Is it valid JSON (for Recharts/D3)?
           - Is it valid XML/SVG (for SVG)?
           - Is it valid Mermaid syntax?
        
        2. **Layout & Syntax (CRITICAL)**:
           - **Mermaid**: 
             - **MANDATORY**: ALL text labels MUST be inside double quotes strings. 
             - *Check*: Look for patterns like \`A[Start Process]\` (INVALID) vs \`A["Start Process"]\` (VALID). 
             - *Check*: Look for parentheses in labels without quotes: \`B(Radius (r))\` (INVALID) vs \`B("Radius (r)")\` (VALID).
             - *Check*: Look for invalid arrow text: \`A -- text --> B\` (INVALID) vs \`A -- "text" --> B\` (VALID).
             - *Check*: If \`stateDiagram\`, ensure NO \`state "Desc" {\` patterns. Must be \`state ID as "Desc" {\`.
             - *Check*: If \`sequenceDiagram\`, REJECT any usage of the keyword \`style\`. It breaks the parser.
             - Attempting to render unquoted text with special chars WILL BREAK the render.
           - **SVG**: Check \`viewBox\` coordinates. If an element is at x=100 but viewBox ends at 100, is it clipped?
           - **Aspect Ratio**: Avoid extreme width. If it looks like a long horizontal strip that requires scrolling, suggest switching to Vertical/Top-Down.
        
        3. **Aesthetics & Pedagogy**:
           - **Mobile Friendly**: Is it readable on a phone? (No tiny text, no panoramic scrolling).
           - **Colors**: Is it using the strict palette (#3b82f6 for primary, #64748b for neutral)? If it uses default 'red' or 'green' or 'black', REJECT IT.
           - **Complexity**: Is it too simple? (e.g. just one box?). If so, REJECT IT.
           - **alignment**: Are elements weirdly floating?
        
        ## Output Format
        Return ONLY a JSON object:
        {
          "isApproved": boolean,
          "feedback": "string (If approved: 'Perfect'. If rejected: specific instructions on WHAT to fix. e.g. 'Text at x=90 is clipped by viewBox width 100. Increase viewBox width to 120.')"
        }
    `;

        try {
            return await this.safeParseJSON<{ isApproved: boolean; feedback: string }>(prompt);
        } catch (e) {
            console.error("[Reviewer] Failed to parse review, assuming approved to prevent lockup.", e);
            return { isApproved: true, feedback: "Reviewer error, passing through." };
        }
    }
    async translateUserFeedback(context: {
        concept: string;
        userFeedback: string;
        currentCode: string;
    }): Promise<string> {
        const prompt = `
        Role: Lead Technical Art Director.
        Task: Translate "User Feedback" into specific "Technical Instructions" for a junior developer.
        
        ## Input
        Concept: "${context.concept}"
        User Feedback: "${context.userFeedback}"
        Current Code Context: 
        \`\`\`
        ${context.currentCode.substring(0, 1000)}...
        \`\`\`
        
        ## Analysis
        Analyze the user's intent. 
        - If they say "It's clipped", find WHERE it might be clipped in the code.
        - If they say "Colors are ugly", specify the exact hex codes to change.
        - If they say "Make it simpler", specify what elements to remove.
        
        ## Output
        Return a single string of clear, actionable, technical instructions.
        Example: "User wants blue. Change stroke='#000' to stroke='#3b82f6'. Increase viewBox width by 20px."
        
        Output String:
        `;

        try {
            const res = await this.model.invoke(prompt);
            return res.content.toString();
        } catch (e) {
            return context.userFeedback; // Fallback
        }
    }
    async validateContent(context: {
        type: 'text' | 'quiz';
        content: any;
        knowledgeContext?: string; // Prededing text to check against
    }): Promise<{ isApproved: boolean; feedback: string }> {
        this.log(`Reviewing content type: ${context.type}`);

        const isQuiz = context.type === 'quiz';
        const prompt = `
        Role: Senior Editor & Fact Checker.
        Objective: Verify that the content is accurate, relevant, and consistent.
        
        ## Mode: ${isQuiz ? "QUIZ VALIDATION (Cross-Check)" : "TEXT VALIDATION (Fact Check)"}

        ${isQuiz ? `
        ## Task: Cross-Reference Quiz with Text
        1. Read the provided TEXT below.
        2. Read the QUIZ items (Question + Options + Correct Answer) below.
        3. **CRITICAL CHECK**: Is the correct answer *explicitly* or *implicitly* taught in the TEXT?
           - If YES: Approved.
           - If NO: REJECT. The user shouldn't be asked about things not taught yet.
        4. **Ambiguity Check**: Is the question confusing or have multiple potentially correct answers?
        ` : `
        ## Task: Fact Check & Tone Check
        1. Read the TEXT below.
        2. **Accuracy**: Does it contain any obvious hallucinations or false claims?
        3. **Tone**: Is it pedagogical, encouraging, and clear? (Not dry, not overly casual).
        4. **Structure**: Does it use proper markdown headers and formatting?
        `}

        ## Context Material (The Lesson So Far)
        \`\`\`
        ${context.knowledgeContext || "No prior context."}
        \`\`\`

        ## Content to Review
        \`\`\`
        ${typeof context.content === 'string' ? context.content : JSON.stringify(context.content, null, 2)}
        \`\`\`

        ## Output Format
        Return ONLY a JSON object:
        {
          "isApproved": boolean,
          "feedback": "string (If rejected, explain WHY and WHAT to fix. e.g. 'Question asks about X, but X was not mentioned in the text context. Add X to text or change question.')"
        }
        `;

        try {
            return await this.safeParseJSON<{ isApproved: boolean; feedback: string }>(prompt);
        } catch (e) {
            console.error("[Reviewer] Content review failed", e);
            return { isApproved: true, feedback: "Reviewer error" };
        }
    }
}
