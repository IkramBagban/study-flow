
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIModelFactory } from "../../model-factory";
import { z } from "zod";
import { ChapterGenState } from "../state";

// Models
const professorModel = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

const visualizerModel = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.4
});

// Zod Schemas for specific outputs
const TextOutput = z.object({ content: z.string() });
const VisualOutput = z.object({ code: z.string(), caption: z.string() });
const QuizOutput = z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    answer: z.string(),
    explanation: z.string()
});

// --- Prompt Templates ---

const TEXT_SYSTEM_PROMPT = `Role: World-Renowned Professor & Science Communicator (25+ years experience).
Persona: You are like Richard Feynman meets Carl Sagan. You explain complex topics with crystal clarity, infectious enthusiasm, and deep rigor.

Context So Far:
{context}

Instruction from Director: "{instruction}"

## Voice & Style
- **Conversational & Direct**: Speak directly to the student ("Imagine you are...").
- **Deep but Accessible**: Never "dumb down" content; simplify the *explanation*, not the *science*.
- **Story-Driven**: Use analogies and real-world hooks where possible.
- **Concise**: Every word must earn its place. (Target: ~80-120 words).

## Formatting Standards
1. **Markdown**: Use bolding (**text**) for key terms being defined.
2. **Math**: Use LaTeX for formulas. Inline: $x$, Block: $$ x = y $$.
3. **Code**: Use triple backtick blocks with language tags.
4. **Structure**: 
   - Use short paragraphs.
   - Use bullet points for lists.
   - NO generic "In conclusion" or "Let's dive in" fluff. Start immediately.`;

const VISUAL_SYSTEM_PROMPT = `Role: Award-Winning Information Designer & Data Visualization Specialist (20+ years experience).
Objective: Communicate complex ideas instantly through "pixel-perfect" visual storytelling.

## Philosophy
"Clarity is the removal of the unnecessary." 
Your visuals should be beautiful, minimal, and strictly pedagogical.

**CRITICAL: MOBILE FIRST LAYOUTS**
- Users read on phones and narrow columns.
- **AVOID WIDE DIAGRAMS**. They become tiny when scaled down.
- **PREFER VERTICAL (Top-Down)** flows over horizontal (Left-Right).
- **Target Aspect Ratio**: 3:2 or 4:3 or 1:1. NEVER 16:9 or wider.

## Context
Concept: "{concept}"
Tool: "{tool}"
Instruction: "{instruction}"

Surrounding Context:
{context}

## Tool-Specific Guidelines

### Mermaid (Processes & Systems)
- **Syntax**: Return VALID Mermaid code (graph TD, sequenceDiagram, etc).
- Use graph TD (Top-Down) for hierarchies. Use graph LR only for short 3-4 step flows.
- **CRITICAL**: ALL node labels with spaces MUST be quoted: A["User Input"] not A[User Input].
- Arrow syntax: -->, --o, --x, -.->, ==>.

### SVG (Illustration & Biology)
- Valid independent <svg> with viewBox. NO literal width/height.
- Aspect Ratio: Keep width roughly equal to height (e.g., viewBox="0 0 500 400").
- Design System: Primary #3b82f6 (Blue), Secondary #64748b (Slate), Accent #10b981 (Emerald).
- NEVER cut off text at the edge. NEVER overlap labels.

### Recharts (Data & Trends)
- Return valid JSON: type, data array, keys.
- Create realistic datasets demonstrating the trend.

### Mafs (Math & Physics)
- Return valid React component logic.`;

const QUIZ_SYSTEM_PROMPT = `Role: Senior Cognitive Scientist & Assessment Strategist.
Objective: Create an "Active Recall" mechanism that forces the brain to reconstruct neural pathways.

## Philosophy
"Testing is not checking knowledge; it is creating knowledge." 
We do NOT ask "What is X?". We ask "How does X change when Y happens?".

## Task
Create a rigorous question for the concept: "{concept}".
Variant: {variant}
Instruction: {instruction}

Context So Far:
{context}

## Rules by Variant
1. **Flashcard**:
   - **Bad**: "Define Mitochondria."
   - **Good**: "Explain why RBCs lack mitochondria using the concept of efficiency."
   
2. **MCQ**:
   - **Stem**: Use a scenario, a debugging problem, or a "what-if" simulation.
   - **Distractors**: Must be plausible misconceptions.`;

// Helper to extract token usage from response metadata
function extractTokenUsage(response: any): { inputTokens: number; outputTokens: number; totalTokens: number } {
    try {
        // Gemini returns usage in response_metadata.usage or usage_metadata
        const responseMetadata = response?.response_metadata || {};
        const usageMetadata = response?.usage_metadata || responseMetadata?.usage_metadata || {};

        // Try multiple possible structures
        const inputTokens =
            usageMetadata?.input_tokens ||
            usageMetadata?.promptTokenCount ||
            responseMetadata?.usage?.promptTokenCount ||
            0;

        const outputTokens =
            usageMetadata?.output_tokens ||
            usageMetadata?.candidatesTokenCount ||
            responseMetadata?.usage?.candidatesTokenCount ||
            0;

        const totalTokens =
            usageMetadata?.total_tokens ||
            usageMetadata?.totalTokenCount ||
            responseMetadata?.usage?.totalTokenCount ||
            (inputTokens + outputTokens) ||
            0;

        return { inputTokens, outputTokens, totalTokens };
    } catch {
        return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }
}

// --- The Master Generator Node ---
export const generatorNode = async (state: ChapterGenState) => {
    const { plan, currentTaskIndex, runningContext, conceptTitle } = state;

    if (currentTaskIndex >= plan.length || !plan[currentTaskIndex]) {
        return {};
    }

    const task = plan[currentTaskIndex];
    if (!task) return {};

    const blockType = task.role;
    const blockVariant = task.variant || task.tool || 'default';

    console.log(`[Generator] Creating Block ${currentTaskIndex + 1}/${plan.length} [${blockType} | ${blockVariant}]`);

    // Retry logic
    if (state.feedback && state.currentDraft) {
        console.warn(`[Generator] Retry (${(state.retryCount || 0) + 1}): ${state.feedback}`);
        task.instruction += `\n\n[CRITICAL FEEDBACK - FIX THIS]: ${state.feedback}`;
    }

    let generatedBlock: any = null;
    let errorMessage: string | null = null;
    let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const startTime = Date.now();

    // 1. Text Generation
    if (task.role === 'text') {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", TEXT_SYSTEM_PROMPT],
            ["user", "Generate the content for '{concept}'."]
        ]);

        try {
            const chain = prompt.pipe(professorModel.withStructuredOutput(TextOutput, { includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                context: runningContext || "Start of chapter.",
                instruction: task.instruction
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Text block: ${duration}ms | ${tokenUsage.totalTokens} tokens (in: ${tokenUsage.inputTokens}, out: ${tokenUsage.outputTokens})`);

            generatedBlock = { type: 'text', variant: task.variant, content: response.parsed.content };
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error(`[Generator] Text generation failed (${Date.now() - startTime}ms): ${errorMessage}`);

            generatedBlock = {
                type: 'text',
                variant: task.variant,
                content: `(Content generation failed. Please regenerate.)\n\nError: ${errorMessage}`
            };
        }
    }

    // 2. Visual Generation
    else if (task.role === 'visual') {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", VISUAL_SYSTEM_PROMPT],
            ["user", "Generate the visualization code."]
        ]);

        try {
            const chain = prompt.pipe(visualizerModel.withStructuredOutput(VisualOutput, { includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                tool: task.tool || 'mermaid',
                context: runningContext || "No context",
                instruction: task.instruction
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Visual block (${task.tool}): ${duration}ms | ${tokenUsage.totalTokens} tokens (in: ${tokenUsage.inputTokens}, out: ${tokenUsage.outputTokens})`);

            generatedBlock = { type: 'visual', tool: task.tool, code: response.parsed.code, caption: response.parsed.caption };
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error(`[Generator] Visual generation failed (${Date.now() - startTime}ms): ${errorMessage}`);

            generatedBlock = {
                type: 'visual',
                tool: task.tool,
                code: 'graph TD; A["Error"] --> B["Could Not Generate Visual"];',
                caption: `Generation failed: ${errorMessage}`
            };
        }
    }

    // 3. Quiz Generation
    else if (task.role === 'recall_question') {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", QUIZ_SYSTEM_PROMPT],
            ["user", "Generate the question."]
        ]);

        try {
            const chain = prompt.pipe(professorModel.withStructuredOutput(QuizOutput, { includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                context: runningContext || "No context",
                variant: task.variant || 'flashcard',
                instruction: task.instruction
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Quiz block (${task.variant}): ${duration}ms | ${tokenUsage.totalTokens} tokens (in: ${tokenUsage.inputTokens}, out: ${tokenUsage.outputTokens})`);

            generatedBlock = { type: 'quiz', variant: task.variant, ...response.parsed };
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error(`[Generator] Quiz generation failed (${Date.now() - startTime}ms): ${errorMessage}`);

            generatedBlock = {
                type: 'quiz',
                variant: task.variant,
                question: 'Generation Error',
                answer: 'Please regenerate.',
                explanation: `Error: ${errorMessage}`
            };
        }
    }

    // Output to Draft for Review
    const isRetry = !!state.feedback;
    const nextRetryCount = (state.retryCount || 0) + (isRetry ? 1 : 0);

    // Build state update with error and token accumulation
    const stateUpdate: any = {
        currentDraft: generatedBlock,
        retryCount: nextRetryCount,
        tokenUsage: tokenUsage
    };

    // Accumulate errors to state if any occurred
    if (errorMessage) {
        stateUpdate.errors = [`[${blockType}/${blockVariant}] ${errorMessage}`];
    }

    return stateUpdate;
};
