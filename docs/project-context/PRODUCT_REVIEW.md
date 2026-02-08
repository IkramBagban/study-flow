# Product Review & Roadmap

**Date:** 2026-02-02
**Reviewer:** "Product Manager" Agent

## Executive Summary
The application has a robust backend foundation (Prisma schema, RAG pipelines, LangGraph-based generation) and a modern frontend. The recent "Quiz History" feature was a significant UX upgrade. However, the product currently feels like a "Reader" rather than a complete "Learning System" due to the lack of **Active Recall/Flashcard UI** and complete **Resource Management**.

To transition from MVP to a stickier product, we must close the loop on RAG (enable PDF support) and Retention (enable Flashcard study).

---

## 1. Critical Issues Force-Ranked (P0)
*These block the core promise of "AI Study Flow".*

### 1.1 Missing PDF Support (RAG Blocked)
*   **Status**: `api/course/[id]/resources/upload` explicitly errors on PDFs.
*   **Impact**: Users cannot upload textbooks or lecture slides, which is the primary use case for an AI study aid.
*   **Fix**: Integrate `pdf-parse` or generic node buffer parsing to extract text from PDFs.

### 1.2 "Invisible" Knowledge Base
*   **Status**: Users can upload text (conceptually), but there is no UI to see, manage, or delete what the AI "knows".
*   **Impact**: Lack of trust. "Did it define X because of my file or because it's hallucinating?"
*   **Fix**: A "Course Resources" Settings Page listing uploaded files with delete/re-index options.

---

## 2. High-Value Feature Recommendations (P1)
*These differentiate the product from a generic "ChatGPT Wrapper".*

### 2.1 Spaced Repetition (Flashcard) Study Mode
*   **Observation**: Your database has a fully FSRS-compliant `Flashcard` table (`stability`, `difficulty`, `state`), but **no UI to use it**.
*   **Opportunity**: Create a Tinder-style "Study" interface where users swipe/rate cards.
*   **Value**: This is the highest retention feature. It turns users from one-time visitors (generating course) to daily active users (reviewing cards).

### 2.2 Dashboard & "Today's Focus"
*   **Observation**: The homepage likely just lists courses.
*   **Opportunity**: A "Today" view showing:
    *   "30 Cards Due for Review"
    *   "Continue Chapter 2 of Biology"
    *   "Your Streak: 5 Days"

### 2.3 Strict Mode Feedback Loop
*   **Observation**: We have a "Strict Mode" toggle.
*   **Opportunity**: In the UI, highlight concepts that came *directly* from user sources vs. general AI knowledge. This reinforces the value of uploading files.

---

## 3. UX/UI Polish (P2)
*   **Mobile Responsiveness**: ensure the new Quiz History/Detail views scale down to mobile gracefully (currently card-heavy).
*   **Loading States**: Course generation can take 30s+. Need a compelling "Building your curriculum..." animation/stepper so users don't bounce.
*   **Editability**: Allow users to "Regenerate" a single chapter or "Add a Concept" manually if the AI missed something.   

---

## 4. Proposed Immediate Next Steps
1.  **Implement PDF Parsing**: Unlock the upload capability.
2.  **Build Resource Manager**: Let users see their uploaded files.
3.  **Build Flashcard UI**: The database is ready; the frontend is the only missing piece.
