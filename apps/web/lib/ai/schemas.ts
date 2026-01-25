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
