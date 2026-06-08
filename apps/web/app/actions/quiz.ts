"use server";

import { prisma } from "@study-flow/db";
import { generateQuiz, gradeQuiz } from "@/lib/ai/quiz-service";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getChapterQuiz(chapterId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const existingQuiz = await prisma.quiz.findFirst({
        where: { chapterId, chapter: { module: { course: { userId: session.user.id } } } },
        include: {
            questions: {
                include: { options: true },
                orderBy: { order: "asc" }
            },
            attempts: {
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: 20
            }
        }
    });

    if (existingQuiz) {
        return existingQuiz;
    }

    // Generate new quiz
    const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, module: { course: { userId: session.user.id } } },
        include: {
            module: { include: { course: true } },
            concepts: true
        }
    });

    if (!chapter) throw new Error("Chapter not found");

    const topic = chapter.title;
    const level = chapter.module.course.level || "Intermediate";
    const sourceText = chapter.concepts
        .map(c => `Concept: ${c.title}\nContent: ${JSON.stringify(c.content)}`)
        .join("\n\n");

    const aiResult = await generateQuiz(
        topic,
        level,
        "15 mins",
        sourceText || "General knowledge on existing topic"
    );

    // Save to DB
    const quiz = await prisma.quiz.create({
        data: {
            title: `Quiz: ${chapter.title}`,
            chapterId: chapter.id,
            courseId: chapter.module.courseId,
            questions: {
                create: aiResult.questions.map((q, idx) => ({
                    question: q.question,
                    explanation: q.explanation,
                    order: idx,
                    options: {
                        create: q.options.map(o => ({
                            text: o.text,
                            isCorrect: o.id === q.correctOptionId
                        }))
                    }
                }))
            }
        },
        include: {
            questions: { include: { options: true } },
            attempts: true
        }
    });

    return quiz;
}

export async function submitQuizAttempt(
    quizId: string,
    answers: { questionId: string; optionId: string }[]
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, course: { userId: session.user.id } },
        include: { questions: { include: { options: true } } }
    });

    if (!quiz) throw new Error("Quiz not found");

    // Calculate score locally
    let correctCount = 0;
    // @ts-ignore
    const detailedAnswers = answers.map(ans => {
        const q = quiz.questions.find(q => q.id === ans.questionId);
        if (!q) return null;
        const selectedOpt = q.options.find(o => o.id === ans.optionId);
        const isCorrect = selectedOpt?.isCorrect || false;
        if (isCorrect) correctCount++;
        return {
            questionId: ans.questionId,
            optionId: ans.optionId,
            isCorrect
        };
    }).filter(Boolean);

    const score = (correctCount / quiz.questions.length) * 100;

    // Prepare data for AI Grading
    const questionsForAI = quiz.questions.map(q => ({
        id: q.id,
        text: q.question,
        options: q.options.map(o => ({ id: o.id, text: o.text }))
    }));

    const userAnswersForAI = answers.map(a => ({
        questionId: a.questionId,
        selectedOptionId: a.optionId
    }));

    let feedback = "Great job!";
    let performanceAnalysis: any = {};

    try {
        const aiFeedback = await gradeQuiz(
            questionsForAI,
            userAnswersForAI,
            { score, correctCount, totalQuestions: quiz.questions.length }
        );
        feedback = aiFeedback.feedback;
        performanceAnalysis = {
            performanceLevel: aiFeedback.performanceLevel,
            growthAreas: aiFeedback.growthAreas,
            areasToReview: aiFeedback.areasToReview,
            corrections: aiFeedback.corrections
        };
    } catch (e) {
        console.error("AI Grading failed", e);
        feedback = `You scored ${Math.round(score)}%. Review your answers to see what you missed.`;
    }

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
        data: {
            quizId,
            userId: session.user.id,
            score: score,
            feedback: feedback,
            answers: detailedAnswers as any,
            metadata: performanceAnalysis || {},
        }
    });

    revalidatePath(`/courses/${quiz.courseId}`);

    // Return structured result for frontend consumption
    return {
        ...attempt,
        score,
        percentage: Math.round(score),
        correctCount,
        totalQuestions: quiz.questions.length,
        performanceLevel: performanceAnalysis.performanceLevel || (score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement"),
        growthAreas: performanceAnalysis.growthAreas || [],
        areasToReview: performanceAnalysis.areasToReview || [],
        corrections: performanceAnalysis.corrections || [],
    };
}

export async function getCourseQuiz(courseId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const existingQuiz = await prisma.quiz.findFirst({
        where: { courseId, chapterId: null, course: { userId: session.user.id } }, // Ensure it's a course quiz, not a chapter one
        include: {
            questions: {
                include: { options: true },
                orderBy: { order: "asc" }
            },
            attempts: {
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    if (existingQuiz) {
        return existingQuiz;
    }

    // Generate new quiz
    const course = await prisma.course.findFirst({
        where: { id: courseId, userId: session.user.id },
        include: {
            modules: {
                include: {
                    chapters: {
                        include: { concepts: true }
                    }
                }
            }
        }
    });

    if (!course) throw new Error("Course not found");

    const topic = course.title;
    const level = course.level || "Intermediate";

    let sourceText = `Course Goal: ${course.goal}\n\n`;
    course.modules.forEach(m => {
        sourceText += `Module: ${m.title}\n${m.description || ""}\n`;
        m.chapters.forEach(c => {
            sourceText += `Chapter: ${c.title}\n`;
            c.concepts.forEach(con => {
                sourceText += `- Concept: ${con.title}\n`;
            });
        });
    });

    const aiResult = await generateQuiz(
        topic,
        level,
        "30 mins",
        sourceText
    );

    // Save to DB
    const quiz = await prisma.quiz.create({
        data: {
            title: `Final Exam: ${course.title}`,
            courseId: course.id,
            questions: {
                create: aiResult.questions.map((q, idx) => ({
                    question: q.question,
                    explanation: q.explanation,
                    order: idx,
                    options: {
                        create: q.options.map(o => ({
                            text: o.text,
                            isCorrect: o.id === q.correctOptionId
                        }))
                    }
                }))
            }
        },
        include: {
            questions: { include: { options: true } },
            attempts: true
        }
    });

    return quiz;
}
