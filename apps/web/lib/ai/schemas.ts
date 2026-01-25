import { z } from "zod";

export const AssessmentInputSchema = z.object({
    topic: z.string(),
    knowledgeLevel: z.enum(["beginner", "intermediate", "advanced"]),
    timeCommitment: z.string(), // e.g., "15 mins", "2 hours"
    sourceText: z.string(),
});

export const MCQOptionSchema = z.object({
    id: z.string(),
    text: z.string(),
});

export const MCQSchema = z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(MCQOptionSchema),
    correctOptionId: z.string(), // We'll strip this before sending to client, or keep it if client-side grading
    explanation: z.string().optional(),
});

export const AssessmentOutputSchema = z.object({
    questions: z.array(MCQSchema),
});

export const UserAnswersSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string(),
        selectedOptionId: z.string(),
    })),
});

export const GradingResultSchema = z.object({
    score: z.number(),
    totalQuestions: z.number(),
    feedback: z.string(),
    corrections: z.array(z.object({
        questionId: z.string(),
        correct: z.boolean(),
        explanation: z.string(),
    })),
});

// --- Course Generation Schemas ---

// 1. Domain Map (The High-Level Terrain) - Phase A
export const TopicGroupSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().describe("1-2 line purpose of this group"),
    order: z.number(),
    whyImportant: z.string().describe("Why this group exists and why users should care"),
});

export const DomainMapSchema = z.object({
    subject: z.string(),
    groups: z.array(TopicGroupSchema),
    welcomeMessage: z.string().describe("A short, engaging message setting the context for the domain map"),
    keyConcepts: z.array(z.string()).describe("List of 5-10 key jargon/concepts in this field to check user knowledge"),
});

// 2. Micro-Concept (The Atomic Unit) - Phase C
export const MicroConceptSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["priming", "core", "application", "review"]), // Concept Seeding vs Deep Dive
    content: z.object({
        hook: z.string().describe("One concrete hook or analogy (for priming)"),
        explanation: z.string().describe("Short explanation (micro-learning)"),
        example: z.string().optional().describe("Concrete example or scenario"),
        visual: z.object({
            type: z.enum(["mermaid", "none"]),
            code: z.string().describe("Mermaid diagram code if type is mermaid, otherwise empty"),
            caption: z.string().optional().describe("Caption for the diagram")
        }).optional().describe("A visual representation of the concept if helpful"),
    }),
    recallQuestion: z.object({
        question: z.string().describe("Active recall question (not just recognition)"),
        answer: z.string().describe("Correct answer"),
        hint: z.string().optional(),
    }).optional(),
});

// 3. Course Structure (The Full Map)
export const SubTopicSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    parentGroupId: z.string(),
    order: z.number(),
    estimatedTime: z.string(),
    microConcepts: z.array(MicroConceptSchema).describe("List of atomic concepts to teach this subtopic"),
    dependencies: z.array(z.string()).describe("IDs of other subtopics that must be learned first"),
});

export const CourseStructureSchema = z.object({
    domainMap: DomainMapSchema,
    subTopics: z.array(SubTopicSchema),
    recommendedPath: z.array(z.string()).describe("Ordered list of subtopic IDs for the optimal learning path"),
});
