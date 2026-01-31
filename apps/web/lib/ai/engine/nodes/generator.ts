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

// --- Visual Tools (Defined as Zod Schemas for LLM Tool Binding) ---

const MermaidTool = z.object({
    code: z.string().describe("Valid Mermaid syntax. Use graph TD. ALWAYS quote labels with special characters or math: A[\"V = πr²h\"]."),
    caption: z.string().describe("Brief explanation of the diagram")
}).describe("Generate a graph, flowchart, or architecture diagram using Mermaid.");

const MafsTool = z.object({
    code: z.string().describe("JSON Object with structure: { type: 'plot', items: [ { type: 'function', expression: 'x^2', color: 'blue' }, { type: 'point', x: 2, y: 4 } ], domain: { x: [-5, 5], y: [-5, 5] } }. Valid item types: function, point, line, text, vector, circle. Formulas must be strings."),
    caption: z.string().describe("Math/Physics explanation")
}).describe("Generate interactive math plots and physics coordinate systems.");

const RechartsTool = z.object({
    code: z.string().describe("JSON configuration for a chart. Include 'type' (line, bar, pie, area) and 'data' array."),
    caption: z.string().describe("Data analysis caption")
}).describe("Generate data visualizations (charts, bars, trends).");

const ChemistryTool = z.object({
    code: z.string().describe("Valid SMILES string for a molecule or reaction (e.g., 'C1=CC=CC=C1' for Benzene)."),
    caption: z.string().describe("Chemical explanation")
}).describe("Generate molecular structures and chemical reactions using SMILES notation.");

const TimelineTool = z.object({
    code: z.string().describe("JSON array of events: [{\"date\": \"...\", \"event\": \"...\", \"impact\": \"...\"}]"),
    caption: z.string().describe("Historical context")
}).describe("Generate a chronological timeline of events.");

const SVGTool = z.object({
    code: z.string().describe("Valid SVG markup. Include viewBox. Use primary #3b82f6, accent #10b981."),
    caption: z.string().describe("Diagram caption")
}).describe("Generate a custom scientific or technical SVG diagram.");

const visualTools = {
    mermaid: MermaidTool,
    mafs: MafsTool,
    recharts: RechartsTool,
    chemistry: ChemistryTool,
    timeline: TimelineTool,
    svg: SVGTool
};

const VisualSelector = z.object({
    tool: z.enum(["mermaid", "mafs", "recharts", "nivo", "chemistry", "timeline", "svg"]).describe("The technical tool selected to best fulfill the pedagogical intent"),
    code: z.string().describe("The technical code for the selected tool"),
    caption: z.string().describe("Contextual caption explaining the visual")
}).describe("Selection and generation of the optimal visualization tool for a specific pedagogical intent");

// --- Visual Tool Definitions (Agent Pattern) ---

const VisualTools = {
    mermaid: {
        description: "Generate a graph, flowchart, or architecture diagram. Best for processes, state machines, logic flows, and hierarchies.",
        parameters: MermaidTool
    },
    mafs: {
        description: "Generate interactive math plots and physics coordinate systems via Mafs React components. Best for Calculus, Algebra, and Vectors.",
        parameters: MafsTool
    },
    recharts: {
        description: "Generate standard data visualizations (Line, Bar, Pie) using Recharts. Best for simple, clean charts and comparisons.",
        parameters: RechartsTool
    },
    nivo: {
        description: "Generate premium, highly interactive charts using Nivo (Line, Bar, Pie). Best for high-end data journalism, complex datasets, and smooth transitions.",
        parameters: RechartsTool // Re-use the same schema as it fits Nivo too
    },
    chemistry: {
        description: "Generate high-quality 2D molecular structures or chemical reactions using SMILES notation. Will be rendered with professional chemistry models.",
        parameters: ChemistryTool
    },
    timeline: {
        description: "Generate a chronological timeline of events using JSON.",
        parameters: TimelineTool
    },
    svg: {
        description: "Generate custom scientific or technical diagrams using raw SVG markup. Use viewBox. and add proper labels and text when needed. WARNING: Do NOT use 'NaN' for attributes. Calculate coordinates carefully.",
        parameters: SVGTool
    }
};

const VISUAL_SYSTEM_PROMPT = `You are an expert Pedagogical Illustrator.

TASK: Create a visual artifact for the concept "{concept}" in "{subject}".
INTENT: {intent}

{sourceTextSection}

CONTEXT:
{context}

INSTRUCTION: {instruction}

Your task is to select and call the MOST appropriate tool to visualize this concept. 
Every tool has specific syntax rules. Follow them exactly.
WARNING: Mafs is 2D ONLY. For 3D shapes like Cones or Spheres, use SVG (2D projection).
Mafs Tip: Use strings for formulas: <OfX y='x^2' /> is better than y={{(x) => x*x}}. NO arrow functions.`;

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
- Use fenced code blocks ONLY for programming concepts (e.g. valid Python/JS algorithms).
- DO NOT use code blocks for visualizations (no Matplotlib/Pyplot). Use the 'visual' tool for that.
- Use LaTeX ($...$) for math formulas

OUTPUT: You must return a JSON object with two fields:
1. content: The main educational markdown content
2. summary: A one-line summary of the key point

Do NOT wrap the output in markdown code blocks. Just return the structured data.`;

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
            ["user", "Select the best tool and generate a visual for '{concept}' based on intent: {intent}"]
        ]);

        try {
            // Convert definitions into LangChain tools for bindTools
            const tools = Object.entries(VisualTools).map(([name, config]) => {
                return {
                    name,
                    description: config.description,
                    schema: config.parameters
                };
            });

            // Force the model to choose a tool
            const modelWithTools = (visualizerModel as any).bindTools(tools);
            const response = await modelWithTools.invoke(await prompt.format({
                concept: conceptTitle,
                intent: task.intent || "Clarify concept visually",
                context: runningContext || "No context",
                instruction: task.instruction,
                subject: courseContext || 'general',
                sourceTextSection: sourceTextSection
            }));

            const duration = Date.now() - startTime;
            tokenUsage = extractTokenUsage(response); // response here is the Raw message

            const toolCall = response.tool_calls?.[0];

            if (toolCall) {
                const selectedTool = toolCall.name;
                const args = toolCall.args as any;

                console.log(`[Generator] Visual block: Agent CALLED ${selectedTool} | ${duration}ms | ${tokenUsage.totalTokens} tokens`);

                generatedBlock = {
                    type: 'visual',
                    tool: selectedTool,
                    code: args.code,
                    caption: args.caption || ''
                };
            } else {
                console.warn('[Generator] Model failed to use tool, attempting content fallback');
                throw new Error("Model did not call a visualization tool.");
            }
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error(`[Generator] Visual agent failed (${Date.now() - startTime}ms): ${errorMessage}`);

            generatedBlock = {
                type: 'visual',
                tool: 'mermaid',
                code: 'graph TD; A["Error"] --> B["Agent Synthesis Failed"];',
                caption: `Visualization agent encountered an issue: ${errorMessage}`
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
