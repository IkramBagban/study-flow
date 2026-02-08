# RAG Implementation & Architecture

## Overview
This document details the Retrieval-Augmented Generation (RAG) architecture used in StudyFlow. The system allows users to upload custom learning materials (text, PDFs, etc.) which are then indexed and used by the AI to generate highly grounded and relevant course content.

## Architecture Guidelines

### 1. Technology Stack
- **Database**: PostgreSQL (Neon) with `pgvector` extension for vector storage.
- **ORM**: Prisma (using raw SQL for vector operations).
- **Embeddings**: Google Gemini `text-embedding-004` (768 dimensions).
- **Orchestration**: LangChain.js & LangGraph.
- **Processing**: Recursive Character Text Splitting.

### 2. Data Models
The RAG system relies on two core database models:

**`Resource`**
- Represents a source file or text input.
- Stores metadata (`fileName`, `type`) and the raw `content`.
- Linked to a specific `Course`.

**`Embedding`**
- Represents a searchable chunk of text.
- Contains the `vector` (Unsupported type in Prisma, accessed via raw SQL).
- Linked to a `Resource`.
- Uses `content` field for retrieving the actual text during generation.

```prisma
model Resource {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId  String
  content   String   @db.Text
  type      String   // "text", "pdf", "url"
  fileName  String?
  embeddings Embedding[]
}

model Embedding {
  id         String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  resourceId String                 @db.Uuid
  vector     Unsupported("vector")? // mapped to 768 dim vector
  content    String                 @db.Text
}
```

## Ingestion Pipeline

The ingestion process is handled by `lib/rag/vector-store.ts`.

1.  **Input**: Raw text is received (from file upload or "Paste Text" input).
2.  **Creation**: A `Resource` record is created to store the master copy.
3.  **Splitting**:
    *   Strategy: `RecursiveCharacterTextSplitter`.
    *   Chunk Size: 1000 characters.
    *   Overlap: 200 characters.
4.  **Embedding**:
    *   The chunks are batched (size 10) and sent to Gemini Embedding API.
5.  **Storage**:
    *   Vectors are inserted into Postgres using `prisma.$executeRaw` because Prisma Client does not natively support vector types yet.
    *   `INSERT INTO "embedding" ... VALUES (..., ${vector}::vector)`

## Retrieval Pipeline

Retrieval is performed contextually during the content generation phase.

1.  **Trigger**: `ChapterGenerationService` or `CourseStructureService` needs context.
2.  **Search**: `searchSimilar(courseId, query)` is called.
3.  **Vector Search**:
    *   The query (e.g., "Quantum Entanglement") is converted to an embedding vector.
    *   Postgres `pgvector` performs a Cosine Distance search (`<=>` operator).
    *   `SELECT ... ORDER BY vector <=> ${queryVector} LIMIT ${k}`
4.  **Context Injection**:
    *   The top `k` (default 5) matching text chunks are retrieved.
    *   They are formatted as a "Knowledge Context" block.
    *   This block is appended to the `sourceText` of the AI prompt.

## Strict Mode ("Use Only Resources")

We support a "Strict Mode" for high-fidelity content generation based *only* on user materials.

### Implementation
- **Frontend**: User toggles "Use only provided resources".
- **State**: The boolean flag `useOnlyResources` is passed through the API to `CourseService`.
- **Architect (Structure Level)**:
    *   The `AnalyzerNode` prompt changes to explicitly forbid outside knowledge.
    *   *"IMPORTANT: You are RESTRICTED to the provided Source Material... Do NOT introduce outside concepts."*
- **Director (Chapter Level)**:
    *   The `ChapterGenerationService` retrieves the flag from `course.sourceData`.
    *   It passes this flag to the `DirectorNode`.
    *   The Director prompt includes a standard strictness injection.

## Project Structure
- `lib/rag/vector-store.ts`: Core logic for ingestion and retrieval.
- `lib/rag/embeddings.ts`: Wrapper for Google Generative AI embeddings.
- `lib/ai/services/chapter-generation-service.ts`: Consumer of RAG for content.
- `lib/ai/engine/architect/nodes/analyzer.ts`: Consumer of RAG for structure.

## Future Plans
- [ ] PDF Parsing (Currently TODO in upload route).
- [ ] Image/OCR support for visual resources.
- [ ] Hybrid Search (Keyword + Semantic).
