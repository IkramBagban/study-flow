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
  text: string,
  useOnlyResources?: boolean
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
        - The questions should be appropriate for a {level} level learner.
        
        ${useOnlyResources ? "IMPORTANT: STRICT MODE ENABLED. You MUST ONLY ask questions that can be answered using the provided Source Material. Do not use outside knowledge." : ""}
        `]
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
  userAnswers: any[],
  stats?: { score: number; correctCount: number; totalQuestions: number }
) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert tutor grading a student's quiz.
    
    Context:
    Score: {score}%
    Correct: {correctCount}/{totalQuestions}
    
    Your goal is to provide specific, actionable advice based on this performance.`],
    ["user", `Original Questions:
        {questions}
        
        Student's Answers:
        {userAnswers}
        
        Task:
        1. Assign a Performance Level based on the score: "Excellent" (>80%), "Good" (60-80%), or "Needs Improvement" (<60%).
        2. Identify Growth Areas: Strengths and skills demonstrated. Provide as a list of short phrases (e.g., "Understanding of X").
        3. List Areas to Review: Specific concepts/topics the user got wrong. Provide as a list of short phrases.
        4. Provide holistic feedback encouraging growth.
        5. For each question, explain the correct answer clearly.`]
  ]);

  const chain = prompt.pipe(graderModel);

  return await chain.invoke({
    questions: JSON.stringify(questions),
    userAnswers: JSON.stringify(userAnswers),
    score: stats?.score || 0,
    correctCount: stats?.correctCount || 0,
    totalQuestions: stats?.totalQuestions || 0
  });
}
