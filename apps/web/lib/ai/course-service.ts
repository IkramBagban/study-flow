/**
 * CourseService (Facade)
 * 
 * Simplified main service that delegates to specialized services.
 * This is the main entry point for course-related operations.
 */

import { CourseStructureService } from "./services/course-structure-service";
import { ChapterGenerationService } from "./services/chapter-generation-service";

export class CourseService {

    // ============================================
    // COURSE STRUCTURE OPERATIONS
    // ============================================

    /**
     * Generate domain map for a topic
     */
    static async generateDomainMap(topic: string, goal: string, sourceText?: string, useOnlyResources?: boolean) {
        return CourseStructureService.generateDomainMap(topic, goal, sourceText, useOnlyResources);
    }

    /**
     * Generate diagnostic quiz for concept assessment
     */
    static async generateDiagnosticQuiz(
        topic: string,
        goal: string,
        level: string,
        concepts: string[],
        sourceText?: string,
        useOnlyResources?: boolean
    ) {
        return CourseStructureService.generateDiagnosticQuiz(topic, goal, level, concepts, sourceText, useOnlyResources);
    }

    /**
     * Generate course structure (modules, chapters, concepts)
     */
    static async generateCourseStructure(domainMap: any, userLevel: string) {
        return CourseStructureService.generateCourseStructure(domainMap, userLevel);
    }

    /**
     * Generate complete course blueprint with assessment data
     */
    static async generateCourseBlueprint(
        userId: string,
        topic: string,
        goal: string,
        level: string,
        sourceText?: string,
        assessmentData?: any,
        useOnlyResources?: boolean
    ) {
        return CourseStructureService.generateCourseBlueprint(
            userId,
            topic,
            goal,
            level,
            sourceText,
            assessmentData,
            useOnlyResources
        );
    }

    /**
     * Create a complete course in the database
     */
    static async createCourse(input: {
        userId: string;
        topic: string;
        goal: string;
        level: string;
        sourceText?: string;
        assessmentData?: any;
    }) {
        return CourseStructureService.createCourse(input);
    }

    // ============================================
    // CHAPTER CONTENT GENERATION
    // ============================================

    /**
     * Generate content for a chapter (standard, non-streaming)
     */
    static async generateChapterContent(chapterId: string) {
        return ChapterGenerationService.generateChapterContent(chapterId);
    }

    /**
     * Generate content for a chapter with streaming updates (SSE)
     */
    static async generateChapterContentStream(
        chapterId: string,
        callbacks: {
            onConceptStart: (conceptTitle: string, index: number, total: number) => void;
            onBlockComplete: (conceptTitle: string, blockIndex: number, block: any) => void;
            onConceptComplete: (conceptTitle: string, blocksCount: number) => void;
            onError: (error: string, conceptTitle?: string) => void;
            onProgress: (message: string) => void;
        }
    ) {
        return ChapterGenerationService.generateChapterContentStream(chapterId, callbacks);
    }
}
