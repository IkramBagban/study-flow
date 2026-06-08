import { headers } from "next/headers";
import { prisma } from "@study-flow/db";
import { auth } from "@/lib/auth";

export async function getSessionUserId(): Promise<string | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user.id ?? null;
}

export async function userOwnsCourse(userId: string, courseId: string): Promise<boolean> {
    const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
        select: { id: true }
    });
    return !!course;
}

export async function userOwnsChapter(userId: string, chapterId: string): Promise<boolean> {
    const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, module: { course: { userId } } },
        select: { id: true }
    });
    return !!chapter;
}

export async function userOwnsChapterInCourse(
    userId: string,
    courseId: string,
    chapterId: string
): Promise<boolean> {
    const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, module: { courseId, course: { userId } } },
        select: { id: true }
    });
    return !!chapter;
}

export async function userOwnsConcept(userId: string, conceptId: string): Promise<boolean> {
    const concept = await prisma.concept.findFirst({
        where: { id: conceptId, chapter: { module: { course: { userId } } } },
        select: { id: true }
    });
    return !!concept;
}

export async function userOwnsFlashcard(userId: string, cardId: string): Promise<boolean> {
    const card = await prisma.flashcard.findFirst({
        where: { id: cardId, course: { userId } },
        select: { id: true }
    });
    return !!card;
}

export async function userOwnsResource(
    userId: string,
    courseId: string,
    resourceId: string
): Promise<boolean> {
    const resource = await prisma.resource.findFirst({
        where: { id: resourceId, courseId, course: { userId } },
        select: { id: true }
    });
    return !!resource;
}
