import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/lib/ai/course-service";
import { CourseStructureService } from "@/lib/ai/services/course-structure-service";
import { prisma } from "@study-flow/db";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const GenerateSchema = z.object({
    topic: z.string(),
    goal: z.string(),
    level: z.string(),
    action: z.enum(["domain-map", "assess", "course-structure", "infer"]),
    sourceText: z.string().optional(),
    useOnlyResources: z.boolean().optional(),
    // Optional fields
    concepts: z.array(z.string()).optional(), // For 'assess' phase
    selectedConcepts: z.array(z.string()).optional(), // For 'infer' phase
    quizResults: z.array(z.any()).optional(), // For 'infer' phase
    assessmentData: z.object({
        quizResults: z.array(z.object({
            questionId: z.string(),
            correct: z.boolean()
        })),
        knownConcepts: z.array(z.string())
    }).optional() // For 'course-structure' phase
});

export const maxDuration = 60; // Allow longer interaction for AI generation

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, goal, level, action, concepts, selectedConcepts, quizResults, assessmentData, sourceText, useOnlyResources } = GenerateSchema.parse(body);

        if (action === "domain-map") {
            const domainMap = await CourseService.generateDomainMap(topic, goal, sourceText, useOnlyResources);
            return NextResponse.json(domainMap);
        }

        if (action === "assess") {
            if (!concepts) return NextResponse.json({ error: "Concepts required for assessment" }, { status: 400 });
            const assessment = await CourseService.generateDiagnosticQuiz(topic, goal, level, concepts, sourceText, useOnlyResources);
            return NextResponse.json(assessment);
        }

        if (action === "infer") {
            const profile = await CourseStructureService.inferKnowledgeProfile(topic, level, selectedConcepts || [], quizResults || []);
            return NextResponse.json(profile);
        }

        if (action === "course-structure") {
            const session = await auth.api.getSession({
                headers: await headers()
            });

            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const course = await CourseService.generateCourseBlueprint(
                session.user.id,
                topic,
                goal,
                level,
                sourceText,
                assessmentData,
                useOnlyResources
            );
            return NextResponse.json({ courseId: course.id });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Course Generation API Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
