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

// Zod Schemas with descriptions (these guide the AI's structured output)
// NOTE: Gemini may have issues with single-field schemas, so we include multiple fields
const TextOutput = z.object({
    content: z.string().describe("The educational content as a markdown string. Include code blocks, formulas, or other artifacts as specified."),
    summary: z.string().describe("A one-line summary of the key point covered in this content.")
}).describe("Educational text content block with content and summary");

const VisualOutput = z.object({
    code: z.string().describe("The visualization code (Mermaid syntax, SVG markup, or React JSX depending on tool). Raw code only, no markdown fences."),
    caption: z.string().describe("A brief 1-2 sentence caption explaining what the visual shows")
}).describe("Visual diagram or chart for the concept");

const QuizOutput = z.object({
    question: z.string().describe("The quiz question text. For programming topics, include code snippets in markdown."),
    options: z.array(z.string()).optional().describe("For MCQ: Array of 4 answer choices. For flashcard: omit this field."),
    answer: z.string().describe("The correct answer. For MCQ: the full text of the correct option."),
    explanation: z.string().describe("Brief explanation of why this answer is correct and what the student should learn.")
}).describe("Quiz or recall question to test understanding");

// --- Adaptive Prompt Templates (No hardcoded domain logic) ---

const TEXT_SYSTEM_PROMPT = `You are a world-class {subject} educator.

TASK: Generate {variant} content for the concept "{concept}".

DOMAIN: {domain}
REQUIRED ARTIFACTS: {requiredArtifacts}

{sourceTextSection}

PREVIOUS CONTENT:
{context}

INSTRUCTION: {instruction}

REQUIREMENTS:
1. Include {requiredArtifacts} - this is mandatory
2. Use terminology appropriate for {subject}
3. Keep content 80-150 words
4. Use domain-relevant examples only

FORMATTING:
- **Bold** key terms
- Use fenced code blocks with language tags for code
- Use LaTeX ($...$) for math formulas

OUTPUT: You must return a JSON object with two fields:
1. content: The main educational markdown content
2. summary: A one-line summary of the key point

Do NOT wrap the output in markdown code blocks. Just return the structured data.`;

const VISUAL_SYSTEM_PROMPT = `You are a technical illustrator creating a visual for: {subject}

## Context
- Subject: {subject}
- Concept: "{concept}"
- Tool to use: {tool}
- Required output: {requiredArtifacts}

## Previously Generated Content
{context}

## Director's Instruction
{instruction}

## Your Task
Create a {tool} visualization that is:
1. Directly relevant to the concept "{concept}" in {subject}
2. Uses domain-appropriate terminology and structure
3. Mobile-friendly (vertical layout, aspect ratio 3:2 or 4:3)

## Tool-Specific Syntax

### Mermaid
- Valid types: graph TD, sequenceDiagram, classDiagram, flowchart, etc
- ALL labels with spaces MUST be quoted: A["User Input"]
- Arrows: -->, --o, --x

### SVG
- Include viewBox, NO fixed width/height
- Colors: Primary #3b82f6, Secondary #64748b, Accent #10b981
- Clean, minimal design

### Mafs
- Return valid React JSX for Mafs components
- Use Coordinates.Cartesian, Plot.OfX, etc.

### Recharts
- Return valid JSON with type, data array, and keys

OUTPUT: Return the visualization code directly. Do NOT wrap in JSON. The system handles the JSON structure.`;

const QUIZ_SYSTEM_PROMPT = `You are an assessment expert creating a question for: {subject}

## Context
- Subject: {subject}
- Domain: {domain}
- Concept: "{concept}"
- Question Type: {variant}
- Required artifacts: {requiredArtifacts}

## Previously Generated Content
{context}

## Director's Instruction
{instruction}

## Your Task
Create a {variant} question that:
1. Tests understanding of "{concept}" in the context of {subject}
2. Is domain-appropriate (uses {domain} terminology and scenarios)
3. Requires applying knowledge, not just recalling definitions

## Question Guidelines
- If the domain involves code: Include actual code snippets in the question
- If the domain involves math: Require calculations or formula application
- If the domain involves history: Reference specific events, dates, or figures
- Distractors (for MCQ): Must be plausible misconceptions, not obviously wrong
- Explanation: Should teach the concept, not just confirm the answer

OUTPUT: Return the question, answer, options (if MCQ), and explanation as plain text values. Do NOT nest them in additional JSON structure.`;

// Token usage extraction
function extractTokenUsage(response: any): { inputTokens: number; outputTokens: number; totalTokens: number } {
    try {
        const responseMetadata = response?.response_metadata || {};
        const usageMetadata = response?.usage_metadata || responseMetadata?.usage_metadata || {};

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
    const { plan, currentTaskIndex, runningContext, conceptTitle, courseContext, detectedDomain, requiredArtifacts, sourceText } = state;

    if (currentTaskIndex >= plan.length || !plan[currentTaskIndex]) {
        return {};
    }

    const task = plan[currentTaskIndex];
    if (!task) return {};

    const blockType = task.role;
    const blockVariant = task.variant || task.tool || 'default';
    const domain = detectedDomain || 'GENERAL';
    const artifacts = requiredArtifacts || 'concrete examples and clear explanations';

    console.log(`[Generator] Creating Block ${currentTaskIndex + 1}/${plan.length} [${blockType} | ${blockVariant}] (${domain})`);

    // Retry logic
    if (state.feedback && state.currentDraft) {
        console.warn(`[Generator] Retry (${(state.retryCount || 0) + 1}): ${state.feedback}`);
        task.instruction += `\n\n[CRITICAL FEEDBACK - FIX THIS]: ${state.feedback}`;
    }

    let generatedBlock: any = null;
    let errorMessage: string | null = null;
    let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const startTime = Date.now();

    // Build source text section if available
    const sourceTextSection = sourceText
        ? `## Reference Material (Ground your content in this):\n${sourceText.substring(0, 2000)}`
        : '';

    // 1. Text Generation
    if (task.role === 'text') {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", TEXT_SYSTEM_PROMPT],
            ["user", "Generate {variant} content for '{concept}' that includes {requiredArtifacts}."]
        ]);

        try {
            const chain = prompt.pipe(professorModel.withStructuredOutput(TextOutput, { name: "TextContent", includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                context: runningContext || "Start of chapter.",
                instruction: task.instruction,
                subject: courseContext || 'general',
                domain: domain,
                variant: task.variant || 'core',
                requiredArtifacts: artifacts,
                sourceTextSection: sourceTextSection
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Text block: ${duration}ms | ${tokenUsage.totalTokens} tokens`);

            // Debug: Log the actual response structure
            console.log(`[Generator] DEBUG - response.parsed:`, response.parsed);
            console.log(`[Generator] DEBUG - response.raw type:`, typeof response.raw);
            console.log(`[Generator] DEBUG - response.raw content:`, response.raw?.content?.toString().substring(0, 500));

            // Structured output should give us the content directly
            if (response.parsed?.content) {
                generatedBlock = { type: 'text', variant: task.variant, content: response.parsed.content };
            } else {
                // Try to extract from raw if parsed failed
                const rawContent = response.raw?.content;
                if (rawContent && typeof rawContent === 'string') {
                    console.log(`[Generator] Using raw content fallback`);
                    let contentToUse = rawContent;
                    try {
                        // Check if it's a JSON string and parse it
                        if (rawContent.trim().startsWith('{')) {
                            const parsed = JSON.parse(rawContent);
                            if (parsed.content) {
                                contentToUse = parsed.content;
                                console.log('[Generator] Successfully parsed JSON from raw content');
                            }
                        }
                    } catch (e) {
                        console.log('[Generator] Failed to parse raw JSON, using raw string');
                    }
                    generatedBlock = { type: 'text', variant: task.variant, content: contentToUse };
                } else if (Array.isArray(rawContent) && rawContent[0]?.text) {
                    console.log(`[Generator] Using raw content array fallback`);
                    generatedBlock = { type: 'text', variant: task.variant, content: rawContent[0].text };
                } else {
                    throw new Error('AI returned empty or invalid response');
                }
            }
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
            ["user", "Generate a {tool} visualization for '{concept}'."]
        ]);

        try {
            const chain = prompt.pipe(visualizerModel.withStructuredOutput(VisualOutput, { name: "VisualDiagram", includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                tool: task.tool || 'mermaid',
                context: runningContext || "No context",
                instruction: task.instruction,
                subject: courseContext || 'general',
                requiredArtifacts: artifacts
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Visual block (${task.tool}): ${duration}ms | ${tokenUsage.totalTokens} tokens`);

            // Check if parsed content exists
            if (response.parsed?.code) {
                generatedBlock = { type: 'visual', tool: task.tool, code: response.parsed.code, caption: response.parsed.caption || '' };
            } else {
                throw new Error('AI returned empty or invalid visual response');
            }
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
            ["user", "Generate a {variant} question for '{concept}'."]
        ]);

        try {
            const chain = prompt.pipe(professorModel.withStructuredOutput(QuizOutput, { name: "QuizQuestion", includeRaw: true }));
            const response = await chain.invoke({
                concept: conceptTitle,
                context: runningContext || "No context",
                variant: task.variant || 'flashcard',
                instruction: task.instruction,
                subject: courseContext || 'general',
                domain: domain,
                requiredArtifacts: artifacts
            });

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response.raw);

            console.log(`[Generator] Quiz block (${task.variant}): ${duration}ms | ${tokenUsage.totalTokens} tokens`);

            // Check if parsed content exists
            if (response.parsed?.question && response.parsed?.answer) {
                generatedBlock = { type: 'quiz', variant: task.variant, ...response.parsed };
            } else {
                throw new Error('AI returned empty or invalid quiz response');
            }
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

    const stateUpdate: any = {
        currentDraft: generatedBlock,
        retryCount: nextRetryCount,
        tokenUsage: tokenUsage
    };

    if (errorMessage) {
        stateUpdate.errors = [`[${blockType}/${blockVariant}] ${errorMessage}`];
    }

    return stateUpdate;
};
