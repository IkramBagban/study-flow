# 🧠 StudyFlow AI Engine V2: Architecture & Decision Log

**Status**: Verified & Active  
**Date**: 2026-01-30  
**Version**: 2.0 (LangGraph Migration)

---

## 1. 📋 Executive Summary
We have successfully migrated the legacy "Agent Classes" architecture to a **LangGraph-based State Machine**. This separates **Control Flow** (the Graph) from **Instruction Logic** (the Nodes) and **Execution** (the Services).

### Key Upgrades
-   **True Multi-Agent Loop**: Restored and hardened the `Generator` -> `Reviewer` -> `Retry` cycle.
-   **Stateful Memory**: The Graph strictly manages the state (blocks, prompts, errors), preventing hallucinations and data loss.
-   **Streaming First**: The architecture is designed for real-time `values` streaming, allowing the UI to render content block-by-block.
-   **Type Safety**: All inputs/outputs are validated via Zod Schemas.

---

## 2. 🏛️ Core Architecture

### 2.1 The Node Pattern (Nodes = Agents)
In V2, "Agents" are no longer Classes. They are **Nodes**—pure functions that take `State` and return `Update`.

| Legacy Agent | New Node | Role |
| :--- | :--- | :--- |
| `DirectorAgent` | `nodes/director.ts` | **Planner**: Breaks concepts into granular tasks (Hook, Visual, Text, Quiz). |
| `ProfessorAgent` | `nodes/generator.ts` | **Content**: Generates Educational Text & Quizzes. |
| `VisualizerAgent` | `nodes/generator.ts` | **Visuals**: Generates Mermaid/Mafs code. |
| `ReviewerAgent` | `nodes/reviewer.ts` | **Critic**: Validates syntax, pedagogy, and mobile-responsiveness. |
| *New* | `committing` (in `graph.ts`) | **Gatekeeper**: Commits approved blocks to permanent state. |

### 2.2 The State Machine (`state.ts`)
The `ChapterGenState` is the single source of truth.

```typescript
export const ChapterGenAnnotation = Annotation.Root({
    // 1. The Plan
    plan: Annotation<PlanItem[]>(),
    currentTaskIndex: Annotation<number>(),

    // 2. The Loop (Drafting & Review)
    currentDraft: Annotation<GeneratedBlock | null>(),
    feedback: Annotation<string | null>(),
    retryCount: Annotation<number>(),

    // 3. The Output (Accumulated)
    blocks: Annotation<GeneratedBlock[]>({
        reducer: (x, y) => x.concat(y), // Append-only
    }),

    // 4. Context (Short-term memory)
    runningContext: Annotation<string>(), 
});
```

---

## 3. 🔄 The Chapter Generation Graph

**File**: `lib/ai/engine/graph.ts`

### Flow Definition
1.  **Start** -> `planning` (Director creates 5-6 tasks).
2.  `planning` -> `generating`.
3.  **Loop**:
    -   `generating` (Creates Draft).
    -   `generating` -> `reviewing`.
    -   `reviewing` (Validates Draft).
    -   **Conditional Edge**:
        -   ✅ **Approved**: -> `committing` (Save to Blocks, Clear Draft).
        -   ❌ **Rejected** (with Feedback): -> `generating` (Retry with Instructions).
        -   ⚠️ **Max Retries**: -> `committing` (Force Save).
4.  `committing` -> `generating` (Next Task) OR `END`.

### 🔄 Streaming Strategy
-   **Mode**: `streamMode: "values"`
-   **Why**: We need the **Full State** at every tick to ensure the Frontend receives the complete list of blocks (Hook + Visual + Text...), not just the latest delta. This fixed the "Active Recalls Only" bug.

---

## 4. 🏗️ The Architect Graph

**File**: `lib/ai/engine/architect/`

Used for High-Level Domain Mapping and Course Structuring.

-   **Analyzer Node**: Takes `Topic` -> outputs `DomainMap`.
-   **Structurer Node**: Takes `DomainMap` -> outputs `Modules & Chapters`.
-   **Service Pattern**: `CourseStructureService` orchestrates these nodes manually for finer control during the "Course Setup" phase.

---

## 5. ✅ Verification Log

| Component | Status | Verification Method |
| :--- | :--- | :--- |
| **Logic Wiring** | ✅ PASS | Verified `graph.ts` edges and conditional logic. Review/Retry loop is active. |
| **State Integrity** | ✅ PASS | Verified `blocks` reducer uses `concat`. Draft logic clears correctly in `committing`. |
| **Type Safety** | ✅ PASS | Verified `Zod` schemas in `schemas.ts` and `state.ts`. |
| **Streaming** | ✅ PASS | Verified `ChapterGenerationService` uses `values` mode to prevent data loss. |
| **Legacy Cleanup** | ⚠️ PENDING | `lib/ai/agents/` folder contains Zombie Code. Safe to delete. |

---

## 6. 🔮 Future Improvements

1.  **Global Knowledge Context**: Inject "Previous Chapter" summaries into `runningContext` for better continuity.
2.  **Parallel Generation**: Run `visual` and `text` generation in parallel (requires branching graph).
3.  **Human-in-the-Loop**: Pause the graph at `reviewing` state to allow Admin/User manual approval (LangGraph native feature).

---

*This document serves as the architectural source of truth for the AI Engine.*
