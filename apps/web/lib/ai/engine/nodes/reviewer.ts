
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIModelFactory } from "../../model-factory";
import { z } from "zod";
import { ChapterGenState } from "../state";

// Use a strict model for reviewing (low temp)
const reviewerModel = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash", // or a stronger model if available
    temperature: 0.2
});

const ReviewOutputSchema = z.object({
    isApproved: z.boolean(),
    feedback: z.string()
});

export const reviewerNode = async (state: ChapterGenState) => {
    const { currentDraft, conceptTitle, currentTaskIndex, plan, runningContext } = state;

    // Safety check
    if (!currentDraft) {
        return { feedback: "No draft found to review." }; // Should loop back to generator
    }

    const task = plan[currentTaskIndex];

    console.log(`[LANGGRAPH-V2] Reviewer Node: Analyzing ${currentDraft.type}...`);

    let prompt: ChatPromptTemplate;
    // 1. Text/Quiz Review
    // 1. Text/Quiz Review (Auto-Approve for now as per user request)
    if (currentDraft.type === 'text' || currentDraft.type === 'quiz') {
        console.log(`[LANGGRAPH-V2] ⚡ Reviewer Node: Auto-approving ${currentDraft.type} (Review disabled)`);
        return { feedback: null };
    }

    // 2. Visual Review (The Strict One)
    if (currentDraft.type === 'visual') {
        prompt = ChatPromptTemplate.fromMessages([
            ["system", `Role: QA Engineer & Design Critic.
             Task: Strict syntax and aesthetic check for {tool}.
             
             Guidelines:
             - Mermaid: check for unquoted text labels, broken parens.
             - SVG: check viewBox, clipping.
             - Colors: Prefer #3b82f6 (Primary), #64748b (Neutral).
             
             Draft Code:
             \`\`\`
             {code}
             \`\`\`
             `],
            ["user", "Approve or Reject."]
        ]);

        const chain = prompt.pipe(reviewerModel.withStructuredOutput(ReviewOutputSchema));
        const result = await chain.invoke({
            tool: currentDraft.tool || 'diagram',
            code: currentDraft.code
        });

        return {
            feedback: result.isApproved ? null : result.feedback
        };
    }

    return { feedback: null }; // Pass through errors or unknown types
};
