# DesignKarlo — AI Assistance and Engineering Decisions Log

This document provides a factual, transparent record of how Artificial Intelligence assistance was utilized during the development of **DesignKarlo** for the CipherSchools Full Stack Development Internship assignment. It outlines the specific tools employed, collaborative development workflows, meaningful architectural decisions, alternatives evaluated and rejected, and the human verification procedures applied.

---

## 1. Development Workflow and AI Interaction Model

### Tooling Environment
- **AI Assistant:** Antigravity Engineering Agent (powered by Google DeepMind Gemini models).
- **Development Environment:** Antigravity IDE on Windows 11 with PowerShell 7 and Node.js v20.
- **Project Structure:** Monorepo using native npm workspaces (`apps/api`, `apps/web`).

### Collaboration Pattern
1. **Human Direction and Requirements Framing:** The developer defined the product requirements, architectural scope, domain constraints, and evaluation rubrics based on the assignment objectives.
2. **AI Synthesis and Drafting:** The AI assistant drafted TypeScript schemas, React components, Zod validation logic, Vitest test suites, and configuration files.
3. **Manual Code Review and Modification:** Every AI-proposed change was inspected for structural cleanliness, type safety, dependency hygiene, and alignment with the system design note. Proposed solutions that introduced extraneous libraries or architectural over-engineering were pruned or rejected.
4. **Terminal-Driven Verification:** No change was marked complete without running the local test suites (`npm run test:api`, `npm run test:web`) and production build commands (`npm run build`).

---

## 2. Meaningful AI-Assisted Engineering Decisions

### Decision 1: Native npm Workspaces and a Modular Monolith
- **Context / Problem:** The project required clean separation between the backend Express API (`apps/api`) and the React frontend SPA (`apps/web`), while allowing shared root commands and streamlined dependency management.
- **Options Considered:** Multi-repository setup, polyrepo with git submodules, third-party monorepo tools (Turborepo, Nx), or native npm workspaces in a modular monolith.
- **Decision Accepted:** **Native npm workspaces (`workspaces: ["apps/*"]`) in a modular monolith.**
- **Alternatives Rejected and Why:**
  - *Multi-repo / Submodules:* Rejected due to cross-repository coordination overhead, separate issue tracking, and synchronization friction during rapid iteration.
  - *Turborepo / Nx:* Rejected as unnecessary overhead. Native npm workspaces provide native dependency hoisting, workspace script delegation, and zero additional configuration complexity for a two-package project.
- **Human Review and Verification Performed:** Inspected root and workspace `package.json` scripts, verified root commands (`npm run dev`, `npm run build`, `npm run test`), and validated workspace hoisting across both applications.

---

### Decision 2: Structured Form/JSON Architecture Input vs. Drag-and-Drop UML Canvas
- **Context / Problem:** Low-Level Design practice requires candidates to model object-oriented architectures including class responsibilities, relationships, applied design patterns, and concurrency considerations.
- **Options Considered:** Interactive visual drag-and-drop canvas (e.g., React Flow, Konva, or GoJS), raw code compilation sandbox (Docker-based compiler), or a structured schema-driven Form/JSON editor.
- **Decision Accepted:** **Structured Form and JSON editor backed by a strict Zod schema (`StructuredDesignSchema`).**
- **Alternatives Rejected and Why:**
  - *Drag-and-Drop UML Canvas:* Rejected because visual canvas manipulation introduces immense UI state complexity, high interaction overhead (resizing boxes and aligning arrows), and fragile automated parsing, distracting candidates from architectural reasoning.
  - *Arbitrary Code Execution Sandbox:* Rejected because compiler output evaluates binary syntax and unit tests rather than architectural decoupling or design pattern justification, while introducing significant container security and execution overhead.
- **Why That Decision Was Appropriate:** Structured input forces candidates to articulate architectural reasoning clearly. Structured JSON enables deterministic schema validation, clean side-by-side revision diffing, and algorithmic rubric scoring without visual canvas noise.
- **Human Review and Verification Performed:** Evaluated editor UX, verified 15 unit and integration tests in `apps/web/src/validation.test.tsx` verifying field-level validation, entity rename cascading, and defensive schema parsing.

---

### Decision 3: Deterministic Rubric Evaluator (`deterministic-v1`) vs. Live LLM Grading
- **Context / Problem:** The platform required an automated feedback engine to critique candidate designs and track progression across sequential revisions.
- **Options Considered:** Live unconstrained LLM calls on every submission, hybrid heuristic + LLM evaluation, or a 100% deterministic rule-based evaluation engine.
- **Decision Accepted:** **Deterministic rule-based evaluation engine (`deterministic-v1`) across 4 foundational dimensions (Domain Entities, SOLID & Modularity, Extensibility & Patterns, Edge Cases & Concurrency).**
- **Alternatives Rejected and Why:**
  - *Live LLM Grading:* Rejected for the core evaluation pipeline due to network latency (multi-second delays), external API token expenses, rate limits, and non-deterministic scoring drift (where identical solutions receive differing numerical scores).
- **Why That Decision Was Appropriate:** Deterministic evaluation provides zero-latency feedback, works completely offline, costs nothing to execute, and produces reproducible scores. It ensures that revision deltas (`scoreDelta`, `resolvedConcerns`, `newConcerns`) reflect concrete architectural changes rather than prompt variance.
- **Human Review and Verification Performed:** Tested scoring rules against diverse submissions, verified 7 automated test suites in `apps/api/src/tests/deterministic-evaluator.test.ts` asserting exact scoring bounds (0–100), rubric deductions, and concern diffing (`compareEvaluations`).

---

### Decision 4: MongoDB Repository Pattern with Automated In-Memory Fallback
- **Context / Problem:** The backend needed persistent storage in production via MongoDB Atlas while allowing local development, CI pipelines, and evaluators to run immediately without requiring a local MongoDB daemon.
- **Options Considered:** Mandatory local MongoDB/Docker requirement, embedded SQLite database, or Repository Pattern with Mongoose and an in-memory fallback.
- **Decision Accepted:** **Repository pattern via `IAttemptRepository` interface with `MongoAttemptRepository` and `InMemoryAttemptRepository`, paired with non-blocking connection logic in `db.ts` and `X-Persistence-Mode` response headers.**
- **Alternatives Rejected and Why:**
  - *Hard-failing Server Startup on Database Disconnection:* Rejected because it creates excessive setup friction for reviewers who want to inspect or test the codebase locally without provisioning a database.
  - *Embedded SQLite:* Rejected to keep production MongoDB document modeling native and avoid native C-binding compilation issues across different operating systems.
- **Why That Decision Was Appropriate:** Enables zero-downtime development and testing. When MongoDB is unreachable, the API gracefully falls back to in-memory mode, masks credentials in logs, and informs the client of the storage state.
- **Human Review and Verification Performed:** Reviewed `apps/api/src/config/db.ts` to ensure credentials are masked in logs and connection errors don't crash Express; verified with 5 tests in `repository.test.ts`, 3 in `db-config.test.ts`, and full integration suites in `attempts-api.test.ts`.

---

### Decision 5: Defensive JSON Normalization and Field-Level Validation UX
- **Context / Problem:** When users submitted incomplete designs or imported raw JSON, the UI previously showed generic error banners or suffered white-screen rendering crashes when optional arrays were omitted.
- **Options Considered:** Generic top-level error banner, strict rejection of any non-standard JSON without assistance, or defensive normalization with field-level clickable error anchors.
- **Decision Accepted:** **Built `validateStructuredDesign` and `formatErrorLocation` for actionable jump-to-field error anchors, alongside `normalizeAndValidateImportJson` which defaults omitted arrays (`attributes`, `methods`, `relationships`, `designPatterns`), converts object notation to strings, maps field aliases, and preserves the active draft if import fails. Wrapped the editor in a React Error Boundary.**
- **Alternatives Rejected and Why:**
  - *Generic Error Banners:* Rejected because users could not identify which specific field or class failed validation.
  - *Silent State Overwrites:* Rejected because overwriting user drafts with malformed imports caused irreversible data loss.
- **Why That Decision Was Appropriate:** Prevents unhandled render exceptions, preserves user work, and provides clear guidance on why a submission failed validation.
- **Human Review and Verification Performed:** Verified through targeted regression tests in `apps/web/src/validation.test.tsx` (including the custom Parking Lot JSON crash regression test) and manual UI inspection.

---

### Decision 6: Separating Guided Practice (Problem Briefing) from Direct Attempt Flows
- **Context / Problem:** "Start Practice Session" and "Start Attempt" previously navigated to the same empty editor, causing confusion for candidates seeking guided learning versus those ready to draft immediately.
- **Options Considered:** Single monolithic editor screen, forced modal overlay on entry, or distinct views: a dedicated `ProblemBriefing` view for guided practice and direct editor routing for experienced users.
- **Decision Accepted:** **Implemented `ProblemBriefing` view with problem background, core entities, requirements, and edge cases with a "Start Designing" button, while preserving direct attempt access from historical cards and catalog specifications.**
- **Alternatives Rejected and Why:**
  - *Auto-creating Attempt on Briefing View:* Rejected because navigating to the briefing page without drafting would generate empty "ghost" attempts in the database.
- **Why That Decision Was Appropriate:** Accommodates differing learner intents: candidates studying a problem for the first time receive guided architectural context before drafting, while returning candidates can immediately begin drafting or revise previous attempts.
- **Human Review and Verification Performed:** Verified through 13 integration tests in `apps/web/src/App.test.tsx` asserting proper navigation flow, briefing display, and attempt creation timing.

---

### Decision 7: Distinct Starter Templates vs. Sample Architectures with Safe Draft Replacement
- **Context / Problem:** "Load Starter" and "Load Sample Architecture" had ambiguous boundaries, and clicking either button would immediately overwrite an in-progress design without warning, or could inadvertently trigger premature server submissions.
- **Options Considered:** Single template button, direct overwriting of local state, or distinct data structures with an explicit dirty-draft confirmation modal.
- **Decision Accepted:** **Defined distinct payloads (Starter = minimal 2-class baseline; Sample = complete sample architecture with strategy patterns and interfaces), guarded draft replacement with a confirmation modal when edits exist, and restricted template loading to local editor state without creating server submissions or incrementing revisions.**
- **Alternatives Rejected and Why:**
  - *Unconfirmed Replacement:* Rejected due to high risk of accidental data loss when exploring templates.
  - *Automatic Submission on Template Load:* Rejected to prevent polluting attempt history with unedited sample designs.
- **Why That Decision Was Appropriate:** Protects user drafts from accidental loss, clarifies the instructional purpose of a skeleton starter versus a comprehensive sample design, and keeps revision history clean.
- **Human Review and Verification Performed:** Verified through 4 specific test cases in `apps/web/src/App.test.tsx` testing payload differentiation, cancellation draft preservation, confirmed loading, and absence of accidental submissions.

---

### Decision 8: Production API URL Resolution, CORS, Persistence Status Detection, and Netlify Deployment Routing
- **Context / Problem:** Deployed frontend on Netlify received HTTP 404 on `/api/problems`, displayed an incorrect "In-Memory" badge despite the backend reporting a live MongoDB connection, and faced potential CORS issues.
- **Options Considered:** Hardcoding absolute API URLs with wildcards in CORS, separate backend routing, or Netlify `_redirects` proxying with relative API paths.
- **Decision Accepted:** **Configured Netlify `_redirects` proxying `/api/*` requests to the Render backend, aligned API URL resolution in `client.ts` to use relative paths in production, updated CORS configuration in Express `app.ts` to allow the Netlify origin, and wired `StorageBanner` to parse the `X-Persistence-Mode` header and `/api/health` status.**
- **Alternatives Rejected and Why:**
  - *Hardcoding Absolute URLs in Components:* Rejected because it broke local Vite proxying and exposed deployment URLs unnecessarily.
  - *Wildcard (`*`) CORS in Production:* Rejected for security best practices.
- **Why That Decision Was Appropriate:** Eliminates CORS issues in production, enables transparent API proxying through Netlify, and provides accurate real-time storage observability to the user.
- **Human Review and Verification Performed:** Verified in integration tests (`client.test.ts`, `health.test.ts`), checked live deployment responses, and verified the real-time green database indicator on the live deployment.

---

## 3. Human Verification and Validation Record

All AI-generated code, schemas, and configurations were subjected to rigorous local and automated verification. No unverified claims or synthetic figures have been documented.

### Automated Test Verification
- **Backend API Suite (`apps/api`):**
  - **7 test files passed, 50 tests passed** (100% passing).
  - Executed via `npm run test:api`.
  - Covered: Mongoose and in-memory repositories, problem catalog integrity, Zod submission schemas, deterministic evaluation rules, comparison logic, environment parsing, and Express REST routes.
- **Frontend Web Suite (`apps/web`):**
  - **3 test files passed, 37 tests passed** (100% passing).
  - Executed via `npm run test:web`.
  - Covered: API client wrappers, briefing navigation, structured editor form validation, clickable error anchors, JSON normalization, crash-prevention regression tests, and safe template loading workflows.
- **Total Test Suite:**
  - **87 passed** across all workspaces (`npm run test`).
- **Monorepo Production Build:**
  - Executed via `npm run build`.
  - Clean TypeScript compilation (`tsc`) for `apps/api`.
  - Clean TypeScript compilation and Vite production bundle (`dist/`) for `apps/web`.

### Manual End-to-End Verification
- Verified live deployment health check at [https://designkarlo-api.onrender.com/api/health](https://designkarlo-api.onrender.com/api/health), confirming active MongoDB connection state.
- Verified live frontend user flow at [https://designkarlo.netlify.app/](https://designkarlo.netlify.app/), validating problem briefing, structured submission, rubric evaluation display, and side-by-side revision comparison.
