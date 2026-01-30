import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { PlanItemSchema } from "../state";
import { AIModelFactory } from "../../model-factory";

// The Output Schema (Zod)
const DirectorOutputSchema = z.object({
    plan: z.array(PlanItemSchema)
});

// We use the Gemini definition from your env, but managed via LangChain
const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash", // Fast model for planning
    temperature: 0.7
});

// The Node Function
export const directorNode = async (state: any) => {
    const { channel, conceptTitle, conceptType } = state;

    console.log(`[LANGGRAPH-V2] 🎬 Director Node: Planning ${conceptTitle} (${conceptType})`);

    // 1. Define Prompt Template
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `Role: Chief Learning Officer & Curriculum Architect.
       Objective: Design a micro-learning plan for the concept: "{concept}".
       Type: {type}.
       
       You must output a JSON plan consisting of simple BLOCK TASKS.
       
       Block Types:
       - text (variants: hook, definition, core, analogy, history)
       - visual (tools: mafs [math/physics], mermaid [flows], recharts [data], svg [anatomy])
       - recall_question (variants: flashcard, mcq)
       
       Standard Flow:
       1. Hook (Text)
       2. Simple Diagram (Visual)
       3. Definition (Text)
       4. Analogy/Example (Text)
       5. Active Recall (Question)
      `
        ],
        ["user", "Create the plan for '{concept}'."]
    ]);

    // 2. Bind Schema (Native Structured Output)
    const structuredModel = model.withStructuredOutput(DirectorOutputSchema);

    // 3. Run Chain
    const chain = prompt.pipe(structuredModel);

    const result = await chain.invoke({
        concept: conceptTitle,
        type: conceptType,
    });

    // 4. Return State Update
    return {
        plan: result.plan.map(p => ({ ...p, status: "pending" })),
        currentTaskIndex: 0,
        blocks: [],
        runningContext: ""
    };
};
