import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

// --- 1. Sub-Schemas (The "Data Types" of our Graph) ---

// A single block of content (The atom of our course)
export const BlockSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["text", "visual", "quiz", "error"]),
    content: z.string().optional(), // For text text
    code: z.string().optional(),    // For visual code
    caption: z.string().optional(), // For visuals
    variant: z.string().optional(), // For styling
    tool: z.string().optional(),    // For visuals
    question: z.string().optional(), // For quiz
    options: z.array(z.string()).optional(), // For MCQ
    answer: z.string().optional(),   // For quiz
    explanation: z.string().optional(), // For quiz
    feedback: z.string().optional(), // For internal review use
});

export type GeneratedBlock = z.infer<typeof BlockSchema>;

// The Plan Item (What we intend to build)
export const PlanItemSchema = z.object({
    role: z.enum(["text", "visual", "recall_question"]),
    variant: z.string().optional(),
    tool: z.string().optional(),
    intent: z.string().optional().describe("For visuals: The pedagogical goal (e.g., 'compare-concept-a-and-b', 'show-process-flow')"),
    instruction: z.string(),
    status: z.enum(["pending", "generated", "approved", "rejected"]).default("pending"),
    feedback: z.string().optional(), // If rejected
});

export type PlanItem = z.infer<typeof PlanItemSchema>;

// --- 2. Graph State (The "Brain" / Shared Memory) ---

export const ChapterGenAnnotation = Annotation.Root({
    // Inputs
    courseContext: Annotation<string>(), // "react" or "calculus"
    chapterTitle: Annotation<string>(),  // "Hooks and State"
    conceptTitle: Annotation<string>(),  // "useState"
    conceptType: Annotation<string>(),   // "core"
    sourceText: Annotation<string>(),    // User-provided learning material
    useOnlyResources: Annotation<boolean | undefined>(),

    // AI-Detected (set by Director)
    detectedDomain: Annotation<string>(),      // "PROGRAMMING", "STEM", etc.
    requiredArtifacts: Annotation<string>(),   // "code examples, API usage"

    // The Plan (Mutable)
    plan: Annotation<PlanItem[]>(),

    // Execution Pointer
    currentTaskIndex: Annotation<number>(),

    // --- Reviewer Loop ---
    currentDraft: Annotation<GeneratedBlock | null>(),
    feedback: Annotation<string | null>(),
    retryCount: Annotation<number>(),

    // Output Accumulator
    blocks: Annotation<GeneratedBlock[]>({
        reducer: (x, y) => x.concat(y),
    }),

    // Context Accumulator (For checking consistency)
    runningContext: Annotation<string>(),

    // Error Handling
    errors: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
    }),

    // Token Usage Tracking (Observability)
    tokenUsage: Annotation<{ inputTokens: number; outputTokens: number; totalTokens: number }>({
        reducer: (x, y) => ({
            inputTokens: (x?.inputTokens || 0) + (y?.inputTokens || 0),
            outputTokens: (x?.outputTokens || 0) + (y?.outputTokens || 0),
            totalTokens: (x?.totalTokens || 0) + (y?.totalTokens || 0),
        }),
    }),
});

export type ChapterGenState = typeof ChapterGenAnnotation.State;
