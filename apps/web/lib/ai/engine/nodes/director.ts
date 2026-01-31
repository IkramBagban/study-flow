import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { PlanItemSchema } from "../state";
import { AIModelFactory } from "../../model-factory";

const DirectorOutputSchema = z.object({
    domain: z.string().describe("The detected domain: PROGRAMMING, STEM, HUMANITIES, LIFE_SCIENCES, or GENERAL"),
    requiredArtifacts: z.string().describe("What artifacts this topic requires: code examples, formulas, timelines, etc."),
    plan: z.array(PlanItemSchema)
});

const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

export const directorNode = async (state: any) => {
    const { courseContext, chapterTitle, conceptTitle, conceptType, sourceText } = state;

    console.log(`[Director] Planning "${conceptTitle}" (${conceptType}) for: ${courseContext}`);

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `Role: Chief Learning Officer & Curriculum Architect.

## Course Context
Subject: "{subject}"
Chapter: "{chapter}"
${sourceText ? `Source Material (User provided): "{sourceText}"` : ''}

## Your Task
1. FIRST: Analyze the subject and concept to determine the DOMAIN and REQUIRED ARTIFACTS
2. THEN: Design a micro-learning plan for: "{concept}" (Type: {type})

## Domain Detection (YOU must determine this)
Analyze the subject/concept and classify into ONE of:
- PROGRAMMING: Web dev, JavaScript, Python, React, APIs, databases, software
- STEM: Math, Physics, Chemistry, Engineering, Statistics
- HUMANITIES: History, Geography, Politics, Economics, Philosophy
- LIFE_SCIENCES: Biology, Medicine, Anatomy, Ecology
- GENERAL: Everything else

## Required Artifacts by Domain
Based on the domain, specify what artifacts MUST be included:
- PROGRAMMING: "working code examples with syntax highlighting, API usage, best practices"
- STEM: "LaTeX formulas, derivations, worked numerical examples"
- HUMANITIES: "specific dates, people, events, cause-effect chains"
- LIFE_SCIENCES: "biological processes, anatomical diagrams, clinical examples"

## Block Types Available
- text (variants: hook, definition, core, analogy, example, code_walkthrough)
- visual (tools: mafs [math graphs], mermaid [flows/architecture], recharts [data], svg [diagrams])
- recall_question (variants: flashcard, mcq)

## Planning Rules

### For PROGRAMMING topics:
- MUST include at least one "code_walkthrough" or "example" text block
- Visual should be: mermaid (architecture/flow) or svg (UI mockup)
- Instruction for text blocks MUST say "Include working code example"

### For STEM topics:
- MUST include formulas in LaTeX
- Visual should be: mafs (function graphs) or svg (physics diagrams)
- Instruction MUST say "Include formulas and derivation"

### For all topics:
- Keep analogies WITHIN the domain (no physics analogies for React!)
- Ground content in the actual subject matter

## Standard Flow
1. Hook - Domain-relevant introduction
2. Visual/Code - Diagram or code example
3. Definition - Precise explanation with domain terminology
4. Example/Walkthrough - Concrete application
5. Active Recall - Domain-appropriate question`
        ],
        ["user", "Analyze and create the plan for '{concept}' in the {subject} course."]
    ]);

    const structuredModel = model.withStructuredOutput(DirectorOutputSchema);
    const chain = prompt.pipe(structuredModel);

    const result = await chain.invoke({
        concept: conceptTitle,
        type: conceptType,
        subject: courseContext || 'general',
        chapter: chapterTitle || '',
        sourceText: sourceText ? sourceText.substring(0, 3000) : ''
    });

    console.log(`[Director] Detected domain: ${result.domain} | Artifacts: ${result.requiredArtifacts}`);

    return {
        plan: result.plan.map(p => ({ ...p, status: "pending" })),
        detectedDomain: result.domain,
        requiredArtifacts: result.requiredArtifacts,
        currentTaskIndex: 0,
        blocks: [],
        runningContext: ""
    };
};
