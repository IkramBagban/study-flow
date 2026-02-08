# Product Requirements Document (PRD)

## Product Name (Working)

**Learning Intelligence Platform**

---

## 1. Product Vision

Build a **universal, science-backed learning intelligence system** that dynamically understands *how* a user learns, *what* they know, *what* they are about to forget, and *what* they should do next — across **any domain** (academics, skills, professional learning, self-growth, etc.).

The product does not optimize for content consumption.
It optimizes for **durable understanding, retention, and directional learning**.

---

## 2. Problem Statement

Most learners face these problems:

* Learning feels **random and directionless**
* Users forget most of what they learn
* Platforms assume completion = understanding
* Content is one-size-fits-all
* Learners don’t know:

  * where they are
  * what matters next
  * why they are learning something

Existing tools focus on **content delivery**, not **learning decisions**.

---

## 3. Target Users

### Primary Users

* Serious learners (students, professionals, self-learners)
* Preparing for exams, interviews, mastery, or deep understanding

### Secondary Users

* Educators / mentors (future)
* Coaching institutes (future)

---

## 4. Core Product Philosophy

The system is built on:

* Learning science
* Cognitive psychology
* Neuroscience
* Schema formation
* Active recall
* Desirable difficulty
* Spaced repetition
* Cognitive load theory

**Key belief:**

> Learning is a sequence of decisions, not a sequence of lessons.

---

## 5. Core Product Goal

The system should:

* Build strong mental schemas
* Maintain learning direction
* Prevent random topic hopping
* Adapt to individual cognitive states
* Maximize long-term retention

---

## 6. High-Level User Flow

1. User selects topic / subject
2. User states goal (optional)
3. System shows high-level domain map
4. User performs lightweight self-assessment
5. System runs adaptive diagnostics
6. System builds a personalized learning map
7. User refines priorities (optional)
8. Learning begins with adaptive guidance

---

## 7. Learning Flow (Detailed)

### 7.1 Topic Selection

User chooses what they want to learn (any domain).

---

### 7.2 Orientation Phase (Schema Seeding)

Before testing or teaching:

System presents:

* Domain overview
* Core topic groups (4–7 max)
* One-line purpose for each group

**Goal:**

> Establish mental orientation and curiosity.

---

### 7.3 Self-Assessment (Coarse)

For each core topic group:

* Never heard
* Heard, don’t understand
* Some understanding
* Confident

This is **signal collection**, not truth.

---

### 7.4 Adaptive Diagnostic Phase

System probes uncertain areas using:

* Short adaptive quizzes
* Open-ended recall questions
* Limited recognition checks

Rules:

* Ask before explain
* Stop early when confidence is clear
* Identify misconceptions

Output:

> Real knowledge-state per micro-concept

---

### 7.5 Learning Map Generation

System generates a **personalized learning map**:

* Dynamic layer of topics and sub topics whichever/however is required for the user to learn
* Micro-concepts (atomic units)
* Explicit dependencies

The map must always show:

* Where the user is
* What comes next
* Why it comes next
* How topics connect

---

### 7.6 User Refinement 

User may:

* Add missing topics (For later)
* Change priorities (For later)
* Skip confirmed mastery areas

Structure remains **science-driven**, not preference-driven.

---

### 7.7 Course Instance Lock

The finalized map becomes a **living course instance**:

* Adaptive
* Time-aware
* Continuously updated

---

## 8. Knowledge-State Model (Core Engine)

For each micro-concept, store:

* Familiarity level
* Confidence score
* Error patterns
* Misconception fingerprints
* Last recall timestamp
* Forgetting risk
* Preferred explanation style

This model is the **single source of truth**.

---

## 9. Learning Decision Engine

At every step, the system decides:

* Ask recall or explain
* Revisit old concept or move forward
* Increase or decrease difficulty
* Change explanation style
* Trigger revision or not

This engine is **the primary moat**.

---

## 10. Learning Map Design Rules

Non-negotiable rules:

1. Structure before detail
2. One new idea at a time
3. Top-down + bottom-up learning
4. Difficulty adapts per concept
5. Time is part of learning

---

## 11. Content Generation Rules

Priority order:

1. User-provided resources
2. Trusted sources
3. Generated content

Content structure:

Context → Prediction → Example → Explanation → Visual → Recall → Application

Mandatory properties:

* Micro-learning
* Active recall
* Adaptive difficulty
* Minimal verbosity

---

## 12. Memory & Retention System

* Spaced recall scheduling
* Recall triggered by forgetting risk
* Short, frequent, targeted reviews

Nothing is ever marked "completed forever".

---

## 13. UX & Design Principles

* Cognitive minimalism
* Low-saturation colors
* High readability typography
* Predictable layout
* No gamification pressure

Design reduces cognitive noise.

---

## 14. Non-Goals

The product will NOT:

* Optimize for content bingeing
* Rely on streaks or dopamine hooks
* Replace human curiosity
* Teach without assessment

---

## 15. Success Metrics

Primary:

* Retention after x/y/z days
* Reduction in repeated misconceptions
* Time-to-mastery per concept

Secondary:

* User trust signals
* Voluntary continued usage

---

## 16. Risks & Challenges

* Over-complexity
* User fatigue
* AI hallucinations
* Cost control
* Cold-start problem

Mitigation through scope control and domain focus.

---

## 17. Long-Term Vision

Become the **learning brain** users rely on —
not for content, but for **learning decisions**.

---

## 18. One-Line Definition

> A cognitive navigation system that decides the next best learning action for each individual.
