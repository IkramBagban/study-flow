import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { PlanItemSchema } from "../state";
import { AIModelFactory } from "../../model-factory";

const DirectorOutputSchema = z.object({
    domain: z.string().describe("Granular domain: COMPUTING, MATHEMATICS, PHYSICAL_SCIENCES, SOCIAL_SCIENCES, HUMANITIES, LIFE_SCIENCES, MEDICINE, or GENERAL"),
    requiredArtifacts: z.string().describe("Specific artifacts required: e.g., 'SMILES strings for molecule', 'Historical timeline', 'Calculus derivations', 'React code examples'"),
    plan: z.array(PlanItemSchema)
});

const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

export const directorNode = async (state: any) => {
    const { courseContext, chapterTitle, conceptTitle, conceptType, sourceText, useOnlyResources } = state;

    console.log(`[Director] Planning "${conceptTitle}" (${conceptType}) for: ${courseContext}`);

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `Role: Expert Curriculum Architect & Pedagogy Specialist.

## Course Context
Subject: "{subject}"
Chapter: "{chapter}"
${sourceText ? `Source Material (User provided): "{sourceText}"` : ''}
${useOnlyResources ? `IMPORTANT: STRICT MODE ENABLED. You MUST ONLY use the provided Source Material. If the concept is not covered, do not invent it.` : ''}

## Your Task
1. FIRST: Classify the topic into a granular DOMAIN.
2. SECOND: Detail the REQUIRED ARTIFACTS for this domain.
3. THIRD: Design a micro-learning plan for "{concept}" (Type: {type}).

## Visual Planning (The "Intent" Pattern)
For visual blocks, do NOT worry about the technical library. Instead, provide a clear, UNIQUE INTENT for each block.
Avoid redundancy: If you already have a text explanation or a previous diagram, the next one should show a DIFFERENT perspective (e.g., "Orientation" vs "Calculation" vs "Constraint").
- Example: "Show the hierarchical relationship between objects"
- Example: "Plot the curve of diminishing returns"
- Example: "Timeline of the major battles in the revolution"
- Example: "Molecular structure of the catalyst"

## Domain Capabilities (Reference for Visuals)
Our system currently supports:
- Logic/Flow Diagrams (Mermaid)
- Math/Physics Plots (Mafs)
- Data Charts (Recharts)
- Molecular Strings (SMILES)
- Chronological Lists (Timeline)
- Custom Diagrams (SVG)

## Required Artifacts Guidelines
- COMPUTING: "Production-ready code, memory safety tips, performance trade-offs"
- CHEMISTRY: "SMILES molecular strings, reaction balancing, valence electron counts"
- MATH/PHYSICS: "Derivation steps, coordinate plots, specific constant values"
- ECONOMICS: "Supply/Demand equilibrium, macro-economic indicators"
- HISTORY: "Contextual timelines, map markers, primary source perspectives"
- etc

## Planning Rules
- For COMPUTING: Include code_walkthrough + "Architecture flow" intent
- For MATH/PHYSICS: Include LaTeX derivation + "Coordinate function plot" intent
- For CHEMISTRY: Include "Molecular structure" intent
- For HISTORY: Include "Historical timeline" intent`
        ],
        ["user", "Analyze subject '{subject}' and concept '{concept}' to create a professional learning plan."]
    ]);

    const structuredModel = model.withStructuredOutput(DirectorOutputSchema);
    const chain = prompt.pipe(structuredModel);

    const result = await chain.invoke({
        concept: conceptTitle,
        type: conceptType,
        subject: courseContext || 'general',
        chapter: chapterTitle || '',
        sourceText: sourceText ? sourceText.substring(0, 3000) : '',
        useOnlyResources: useOnlyResources || false
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
