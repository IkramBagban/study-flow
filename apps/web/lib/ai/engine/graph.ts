import { StateGraph, END, START } from "@langchain/langgraph";
import { ChapterGenAnnotation, ChapterGenState } from "./state";
import { directorNode } from "./nodes/director";
import { generatorNode } from "./nodes/generator";
import { reviewerNode } from "./nodes/reviewer";

// --- Helper Node: Committing ---
// Commits the approved draft to the permanent record
const committingNode = (state: ChapterGenState) => {
    const { currentDraft, runningContext, currentTaskIndex } = state;

    // Safety: If no draft, we must still solve the "task" so we don't loop forever.
    // Ideally this shouldn't happen if Reviewer works, but as a fallback:
    if (!currentDraft) {
        console.warn(`[Graph] ⚠️ Committing node reached without draft for task ${currentTaskIndex}. Skipping.`);
        return {
            currentTaskIndex: currentTaskIndex + 1,
            // We don't update blocks or context, just move on
            // Reset Loop State to be safe
            currentDraft: null,
            feedback: null,
            retryCount: 0
        };
    }

    // Update Context
    let newContext = runningContext;
    if (currentDraft.type === 'text') newContext += `\n\n${currentDraft.content}`;
    if (currentDraft.type === 'visual') newContext += `\n\n[Visual: ${currentDraft.caption}]`;

    return {
        blocks: [currentDraft], // Reducer will append
        currentTaskIndex: currentTaskIndex + 1,
        runningContext: newContext,
        // Reset Loop State
        currentDraft: null,
        feedback: null,
        retryCount: 0
    };
};

// --- The Graph Definition ---

// 1. Initialize
const workflow = new StateGraph(ChapterGenAnnotation);

// 2. Add Nodes
workflow.addNode("planning", directorNode);
workflow.addNode("generating", generatorNode);
workflow.addNode("reviewing", reviewerNode);
workflow.addNode("committing", committingNode);

// 3. Define Edges
workflow.addEdge(START, "planning");
workflow.addEdge("planning", "generating");
workflow.addEdge("generating", "reviewing");

// 4. Conditional Edge for Review
workflow.addConditionalEdges(
    "reviewing",
    (state) => {
        const { feedback, retryCount, plan, currentTaskIndex } = state;

        // A. Approved? (No feedback)
        if (!feedback) {
            return "committing";
        }

        // B. Rejected but Max Retries reached?
        const MAX_RETRIES = 2;
        if ((retryCount || 0) >= MAX_RETRIES) {
            console.warn(`[Graph] Max retries reached for task ${currentTaskIndex}. Committing anyway.`);
            return "committing";
        }

        // C. Rejected -> Retry
        return "generating";
    }
);

// 5. Post-Commit Edge
workflow.addConditionalEdges(
    "committing",
    (state) => {
        // More tasks?
        if (state.currentTaskIndex < state.plan.length) {
            return "generating";
        }
        return END;
    }
);


// 6. Compile
export const chapterGeneratorGraph = workflow.compile();
