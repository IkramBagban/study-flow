import { z } from "zod";
import { AssessmentOutputSchema, GradingResultSchema } from "./schemas";
import { AIModelFactory, currentAIConfig } from "./model-factory";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert tutor creating a diagnostic assessment.`],
    ["user", `Context:
        - User wants to learn: {topic}
        - Current Knowledge Level: {level}
        - Time Available: {time}
        - Source Material: "{text}"
        
        Task:
        Generate 3-5 multiple choice questions (MCQs) to test the user's understanding of the key concepts.
        The questions should be appropriate for a {level} level learner.`]
  ]);

  const chain = prompt.pipe(generatorModel);

  return await chain.invoke({
    topic,
    level,
    time,
    text: text.slice(0, 8000)
  });
}

export async function gradeQuiz(
  questions: any[],
  userAnswers: any[]
) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert tutor grading a student's quiz.`],
    ["user", `Original Questions:
        {questions}
        
        Student's Answers:
        {userAnswers}
        
        Task:
        1. Calculate the score.
        2. Provide holistic feedback on what the student understands and what they missed.
        3. For each question, confirm if it was correct and explain why (especially if wrong).`]
  ]);

  const chain = prompt.pipe(graderModel);

  return await chain.invoke({
    questions: JSON.stringify(questions),
    userAnswers: JSON.stringify(userAnswers)
  });
}
