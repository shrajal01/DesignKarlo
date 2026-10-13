# DesignKarlo — AI Assistance & Engineering Decisions Log

This document records the intentional use of AI assistance during the development of DesignKarlo. It tracks architectural guidance, decisions accepted, alternatives rejected, and verification steps performed.

---

## 1. Principles for AI Usage

1. **Augmentation, Not Autopilot:** AI is used for rapid scaffolding, boilerplate generation, edge-case analysis, and documentation structuring. All generated code and configurations must be reviewed and verified by executing builds and test suites.
2. **Explicit Verification:** Never mark a task or test as completed without running the actual command and recording the real output.
3. **Architectural Discipline:** Resist unnecessary complexity. When AI suggests microservices, distributed queues, or heavyweight frameworks, favor clean, modular monorepo patterns suited for the 2-day MVP timeframe.

---

## 2. Phase 1 Decisions Log (Project Foundation from Scratch)

### Decision 1: Monorepo Strategy (npm Workspaces)
* **Context:** The prompt requested frontend (`apps/web`) and backend (`apps/api`) separation with minimal infrastructure.
* **Option Considered:** Turborepo / Nx vs. Native npm workspaces.
* **Decision:** **Accepted Native npm Workspaces.**
* **Rationale:** Avoids third-party build orchestrator overhead and configuration bloat. Native npm workspaces provide straightforward dependency linking, simple root scripts, and seamless developer onboarding without global tool dependencies.

### Decision 2: Backend Architecture & Server Decoupling
* **Context:** The backend needed Express, TypeScript, Zod, and MongoDB/Mongoose readiness, with the strict constraint that the server must start and respond to `GET /api/health` without a running MongoDB daemon.
* **Decision:** Decoupled `app.ts` (Express application definition and middleware) from `index.ts` (server listening and DB bootstrap). Added non-blocking MongoDB connection logic in `src/config/db.ts` that catches connection errors and logs a fallback notice rather than crashing the process.
* **Rationale:** Allows integration tests (using `supertest`) to test routes in-memory without binding ports, and enables local developers to test endpoints even if Docker or MongoDB is not yet running on their machines.

### Decision 3: Visual Direction (Neo-Brutalism)
* **Context:** Establish an engaging, high-contrast, modern developer-centric aesthetic for DesignKarlo.
* **Decision:** Implemented a Neo-Brutalist design system featuring:
  * Warm cream background (`#FDFBF7`)
  * Solid black typography and 2px/4px black borders
  * Hard offset drop-shadows (`4px 4px 0px #000`, `6px 6px 0px #000`)
  * Electric-lime accent (`#CCFF00`)
* **Rationale:** Stands out vividly compared to generic dark-mode SaaS dashboards, perfectly matching the gritty, practical engineering persona of LLD candidates.

### Decision 4: Rejected Ideas in Phase 1
* **Rejected:** Drag-and-drop canvas UML editor (e.g. React Flow or Konva).
  * *Why Rejected:* Distracts from the core problem (evidence-based feedback and revision tracking) and blows past the 2-day project timeline. Structured text is faster to write, easier to evaluate, and cleanly versionable.
* **Rejected:** Premature database models and authentication.
  * *Why Rejected:* Keeping Phase 1 strictly bounded to foundation ensures verified developer experience, clean Git hygiene, and unambiguous baseline status before introducing domain logic.

---

## 3. Tool & Model Attribution

* **Primary AI Assistant:** Antigravity Engineering Agent (Gemini 3.8 Flash)
* **IDE / Platform:** Antigravity IDE (Windows 11, PowerShell 7)
