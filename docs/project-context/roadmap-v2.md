# Future Roadmap (V2/V3) & Advanced Principles

**Status:** Planned / Research Phase
**Purpose:** These features add depth to the core MVP but strictly rely on the stabilization of the initial "Learning Loop."

---

## 🛠 V2 Features: The "Deepening"

### 1. Dual Coding Implementation (Visuals)
*   **Principle:** The brain processes visual and verbal information in separate channels. Using both doubles retention.
*   **Implementation:**
    *   **Auto-Diagramming:** AI must generate specific visual models for abstract concepts.
    *   *Example:* When teaching "Redux Data Flow," generate a Mermaid sequence diagram showing the action moving to the reducer.
    *   **Constraint:** No text-only explanations for complex structural concepts.

### 2. The "Feynman Loop" (Teach-to-Learn)
*   **Principle:** The Protégé Effect. You learn best when you teach.
*   **Implementation:**
    *   **"Simulate Student" Mode:** The AI creates a persona (e.g., "Confused Junior Dev").
    *   The User must type an explanation.
    *   The AI grades the *clarity* and *analogy use*, not just keyword matching.

---

## 🚀 V3 Features: The "Emotional Layer"

### 3. Emotional Regulation & Frustration Detection
*   **Principle:** Frustration (Amygdala activation) shuts down the Prefrontal Cortex (learning).
*   **Mechanism:** "The Give-Up Listener."
    *   **Trigger:** User gets 3 questions wrong OR takes >60s to answer with erased text.
    *   **Action:** System detects "Undesirable Difficulty."
    *   **Response:**
        1.  Pause new content.
        2.  Switch to **Scaffolding Mode** (Give a concrete example).
        3.  Offer a "Win" (an easier question to restore dopamine/confidence).

### 4. Collaborative Classrooms (Instructor Mode)
*   **Feature:** Teachers upload materials; study plans are auto-generated for 100+ students.
*   **Analytics:** Instructor sees a "Heatmap" of class confusion (e.g., "80% of students failed the 'Promise.all' schema check").

---

## 🔮 Future Tech Integrations
-   **Voice Mode:** Verbal active recall (using OpenAI Realtime API) for lower friction.
-   **Mobile App (React Native):** For "dead time" study (commute/waiting).
