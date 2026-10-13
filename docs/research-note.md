# DesignKarlo — Research Note

**Status:** Preliminary Discovery / Early Hypothesis  
**Last Updated:** Phase 1 (Foundation Setup)  
**Authors:** DesignKarlo Team

---

## 1. Problem Statement

Preparing for and mastering Low-Level Design (LLD) is one of the most unstructured and frustrating phases of a software engineer's interview preparation and architectural development.

While High-Level Design (HLD) centers on macro-architectures (caching, load balancing, sharding), Low-Level Design demands concrete object-oriented analysis, strict application of design principles (SOLID, DRY, KISS), suitable design pattern selection, and clear class/interface boundaries.

Key learner pain points observed:
1. **Ambiguous Feedback Loop:** When engineers practice classic problems (e.g., *Parking Lot*, *Elevator System*, *Movie Ticket Booking*), they typically read a static blog post, watch a YouTube video, or draw diagrams on an online whiteboard. There is no objective critique of whether their particular class decomposition was cohesive, scalable, or testable.
2. **False Sense of Progress:** Practicing 20 different LLD problems once each does not foster architectural maturity. Deep learning occurs when a candidate designs a solution, gets critiqued on a specific architectural smell (e.g., tight coupling between payment and ticket reservation), revises the design, and visually witnesses the improvement.
3. **Diagramming Overhead vs. Thought Clarity:** Learners spend excessive time fiddling with visual UML drag-and-drop boxes and arrows rather than focusing on the reasoning behind contracts, state transitions, and encapsulation.

---

## 2. Preliminary Market & Landscape Observations

### A. Existing Tools & Approaches
* **UML / Visual Diagramming Tools (Draw.io, Lucidchart, PlantUML, Mermaid):**
  * *Strengths:* Excellent for producing presentation-grade architectural diagrams.
  * *Limitations:* These are passive drawing canvases. They do not evaluate design choices, check for SOLID violations, or explain why an inheritance tree is brittle.
* **Coding Practice Platforms (LeetCode, HackerRank):**
  * *Strengths:* Clear binary input/output automated test validation.
  * *Limitations:* Optimized for data structures and algorithmic complexity. They do not assess object-oriented modularity, extensibility, or interface segregation.
* **Generic AI Scoring / LLM Chats (ChatGPT, Claude prompts):**
  * *Strengths:* Can provide quick qualitative feedback on design outlines.
  * *Limitations:* Typically produces generic, one-shot "8/10 good job" scores without a persistent rubric, longitudinal comparison across revisions, or structured diffs that prove improvement between iterations.

---

## 3. Intended Focus & Core Differentiator

DesignKarlo differentiates itself by zeroing in on **continuity, evidence-based feedback, and attempt progression**:

```
Choose Problem ➔ Design Solution ➔ Submit ➔ Receive Feedback ➔ Revise ➔ Compare Attempts
```

Rather than building a complex, cumbersome visual UML drag-and-drop suite or an unpredictable one-shot AI rating widget, DesignKarlo prioritizes:
1. **Structured Text-Based Submissions:** Fast to author, standard to parse, and easy to version-control.
2. **Deterministic, Evidence-Based Rubrics:** Feedback that cites specific design principles, concrete class responsibilities, and identified coupling risks.
3. **Multi-Attempt History & Diffs:** Enabling candidates to compare Attempt #1 vs. Attempt #2 to observe concrete architectural evolution.

---

## 4. Verification Matrix

| Observation / Hypothesis | Status | Notes |
| :--- | :--- | :--- |
| Learners struggle with lack of actionable, principle-anchored LLD feedback | **Verified (Empirical/Anecdotal)** | Common feedback across software engineering communities and candidate interview post-mortems. |
| Existing diagramming tools lack automated architectural critique | **Verified** | Standard diagramming suites provide rendering engines, not design analyzers. |
| Text-based structured modeling is faster and more expressive than drag-and-drop UML for practice | **Hypothesis (Needs Validation)** | Needs usability testing with actual users during MVP pilot. |
| Rubric-anchored LLM evaluations can produce consistent, repeatable scores across revisions | **Needs Investigation** | Requires empirical testing with prompt templates, temperature controls, and structured JSON schemas in Phase 2. |
| Showing side-by-side diffs of design models directly accelerates candidate learning | **Needs Investigation** | Will be evaluated once comparison view and revision tracking are implemented. |

---

## 5. Next Research Steps

1. Draft sample submissions for 2 core problems (*Parking Lot* and *Rate Limiter*) to test parsing reliability.
2. Benchmark LLM evaluation prompts against established LLD rubric dimensions (Entity Modeling, SOLID principles, Extensibility, Interface Separation).
3. Test latency and determinism of structured feedback generation.
