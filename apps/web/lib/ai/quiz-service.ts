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
    ["system", `You are an expert tutor creating a comprehensive diagnostic assessment.`],
    ["user", `Context:
        - User wants to learn: {topic}
        - Current Knowledge Level: {level}
        - Time Available: {time}
        - Source Material: "{text}"
        
        Task:
        Generate 5-10 multiple choice questions (MCQs) that cover the *breadth* of the provided material.
        - Ensure questions target the main concepts, definitions, and key processes described.
        - Avoid focusing on narrow details unless they are critical.
        - The questions should be appropriate for a {level} level learner.`]
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
    ["system", `You are an expert tutor grading a student's quiz. Your goal is to provide specific, actionable advice.`],
    ["user", `Original Questions:
        {questions}
        
        Student's Answers:
        {userAnswers}
        
        Task:
        1. Calculate the score.
        2. Identify Knowledge Gaps: Specifically list which concepts the student struggled with.
        3. Recommended Focus Areas: List the specific names of topics/concepts the user should review.
        4. Provide holistic feedback encouraging growth.
        5. For each question, explain the correct answer clearly.`]
  ]);

  const chain = prompt.pipe(graderModel);

  return await chain.invoke({
    questions: JSON.stringify(questions),
    userAnswers: JSON.stringify(userAnswers)
  });
}
