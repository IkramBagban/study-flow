import { z } from "zod";
import { AssessmentOutputSchema, GradingResultSchema } from "./schemas";
import { AIModelFactory, currentAIConfig } from "./model-factory";

// Initialize the model using our Factory
const model = AIModelFactory.createModel(currentAIConfig);

// Structured Output for Generation
const generatorModel = model.withStructuredOutput(AssessmentOutputSchema);

// Structured Output for Grading
const graderModel = model.withStructuredOutput(GradingResultSchema);

export async function generateQuiz(
    topic: string,
    level: string,
    time: string,
    text: string
) {
    const prompt = `
    You are an expert tutor creating a diagnostic assessment.
    
    Context:
    - User wants to learn: ${topic}
    - Current Knowledge Level: ${level}
    - Time Available: ${time}
    - Source Material: "${text.slice(0, 8000)}" (truncated if too long)
    
    Task:
    Generate 3-5 multiple choice questions (MCQs) to test the user's understanding of the key concepts in the source material.
    The questions should be appropriate for a ${level} level learner.
    
    Output Format: JSON with question, options (id, text), and correctOptionId.
  `;

    return await generatorModel.invoke(prompt);
}

export async function gradeQuiz(
    questions: any[],
    userAnswers: any[]
) {
    const prompt = `
    You are an expert tutor grading a student's quiz.
    
    Original Questions & Correct Answers:
    ${JSON.stringify(questions)}
    
    Student's Answers:
    ${JSON.stringify(userAnswers)}
    
    Task:
    1. Calculate the score.
    2. Provide holistic feedback on what the student understands and what they missed.
    3. For each question, confirm if it was correct and explain why (especially if wrong).
  `;

    return await graderModel.invoke(prompt);
}
