# RFC: Progressive PDF Ingestion & Course Generation Architecture

## 1. Problem Statement
Users upload large textbooks (300+ pages) or multiple files.
*   **Current Limit**: Dump all text -> LLM Context Window Overflow -> Poor/Truncated Course.
*   **Standard RAG**: Good for querying, but slow to index initially (bad UX).
*   **Goal**: Instant gratification (Course Outline) + High Precision (Deep Content) + Robustness.

## 2. Proposed Architecture: "The Streaming Scanner"

### Phase 1: The Metadata Handshake (Instant)
*   **Input**: User drops `Physics.pdf`.
*   **Action**: Server reads **Header Only** (using `unpdf`).
*   **Output**: `{ pages: 342, size: "15MB", status: "queued" }`.
*   **Decision Engine**:
    *   If < 20 pages: Process strictly.
    *   If > 20 pages: Activate **Chunking Mode**.
    *   *Chunk Size Strategy*: 30 pages usually map to 1-2 chapters. We create batches: `[1-30, 31-60, ..., 331-342, and so on]`.

### Phase 2: Progressive Skeleton Extraction (The "Fast" Lane)
Instead of waiting for the whole book, we process chunks in parallel or stream.

1.  **Chunk 1 (Pages 1-30)**:
    *   **Priority High**.
    *   **Extract**: TOC, Introduction, Chapter 1.
    *   **AI Task**: "Identify the Book Structure (TOC) if present. If not, outline topics in this chunk."
    *   **UX Update**: "Found Textbook Structure! 15 Chapters detected. Processing Chapter 1..."

2.  **Chunks 2...N (Pages 31+)**:
    *   **Priority Medium**.
    *   **Action**: Verify if the detected "Skeleton" holds true.
    *   **Refinement**: "Chapter 4 is actually called 'Thermodynamics II', updating outline..."
    *   **UX Update**: Progress bar filling. "Verified 5/15 Chapters."

### Phase 3: The Course Generation (Optimistic)
*   **Trigger**: User clicks "Generate Course".
*   **Input**: The **Skeleton Outline** (generated from Phase 2), NOT the full text.
*   **Agent**: `CoursePlannerAgent` uses the Skeleton to build the Module list.
*   **Result**: Instant Course Creation.

### Phase 4: Deep Indexing (The "Slow" Lane - Background)
*   While user starts Module 1, the server continues:
    *   **Chunking**: Breaking text into 1000-token segments.
    *   **Embedding**: Generating vectors.
    *   **Storage**: Updating the Vector DB.
*   This ensures that when the user asks a specific question in Module 10, the data is ready.

## 3. Data Flow & Reliability

### Database Schema Updates (Proposed)
```prisma
model Resource {
  id          String   @id @default(cuid())
  processStatus String // "scanning", "indexing", "ready", "error"
  totalPages  Int?
  processedPages Int   @default(0)
  
  // The "Skeleton" used for fast generation
  structure   Json?    // { "chapters": [{ "title": "Intro", "page": 1 }, ...] }
  
  // ... existing fields
}
```

### Reliability Checklist (The "Non-Negotiables")
- [ ] **Idempotence**: If the upload fails at page 50, retrying should resume or skip 1-50.
- [ ] **Isolation**: One bad PDF should not crash the server. (Run parsing in isolated Worker/Process).
- [ ] **Visibility**: User must explicitly see "Parsing 55/300".
- [ ] **Fallback**: If parsing fails, allow Manual Entry of topics.

## 4. Implementation Steps

1.  **Update `parse-pdf` API**: Return metadata immediately (don't wait for text).
2.  **New API `ingest/chunk`**: API to parse a specific range `startPage=X, endPage=Y`.
3.  **Frontend Poll**: Wizard polls for status/structure updates.
4.  **Agent**: Update `CoursePlanner` to accept `structureJson` instead of raw text.

## 5. UI/UX Journey
1.  **Drop Zone**: [ PDF Icon ] "Physics.pdf"
2.  **Immediate**: "Physics.pdf (342 Pages) - Analyzing..."
3.  **T+2s**: "Structure Detected: 15 Chapters."
4.  **T+5s**: "Deep Reading Chapter 1-3..."
5.  **User Action**: Clicks "Create Course".
6.  **Result**: Perfect Outline.
