import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// --- 1. Data Schemas ---

export const DomainMapSchema = z.object({
    subject: z.string(),
    welcomeMessage: z.string(),
    keyConcepts: z.array(z.string()),
    groups: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number(),
        whyImportant: z.string()
    }))
});

export const ConceptSchema = z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(["priming", "core", "application"]),
    order: z.number()
});

export const ChapterSchema = z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    concepts: z.array(ConceptSchema)
});

export const ModuleSchema = z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    chapters: z.array(ChapterSchema)
});

export const CourseStructureSchema = z.object({
    modules: z.array(ModuleSchema)
});


// --- 2. Graph State ---

export const ArchitectAnnotation = Annotation.Root({
    // Inputs
    topic: Annotation<string>(),
    goal: Annotation<string>(),
    level: Annotation<string>(),
    sourceText: Annotation<string | undefined>(),

    // Outputs
    domainMap: Annotation<z.infer<typeof DomainMapSchema> | null>(),
    structure: Annotation<z.infer<typeof CourseStructureSchema> | null>(),

    // Status
    error: Annotation<string | null>(),
});

export type ArchitectState = typeof ArchitectAnnotation.State;
