# DesignKarlo - AI Assistance and Engineering Decisions Log

This document provides a factual record of how AI assistance was utilized throughout the development of DesignKarlo. It outlines the specific tools employed, collaborative development workflows, architectural guidance accepted, alternative approaches rejected, and human verification procedures applied.

---

## 1. Purpose and Scope

Artificial Intelligence was leveraged as an interactive pair-programming assistant to accelerate project foundation, schema modeling, boilerplate generation, validation edge-case analysis, and test suite creation.

While AI assisted with rapid code synthesis and structural exploration, all architectural choices, engineering trade-offs, code reviews, and final acceptance criteria were directed and validated by the developer. The platform's correctness, stability, and adherence to assignment requirements were confirmed through local test execution, static analysis, and production build verification.

---

## 2. Tools and Workflow

### Development Environment and Tooling
- **Primary AI Assistant:** Antigravity Engineering Agent (powered by Google DeepMind Gemini models).
- **IDE and Platform:** Antigravity IDE operating on Windows 11 with PowerShell 7.
- **Workflow Modality:** Conversational pair programming with iterative terminal-driven verification.

### Collaborative Workflow Pattern
1. **Requirements Framing:** The human developer established the functional scope, domain requirements, architectural constraints, and assignment rubrics.
2. **AI Proposal and Generation:** The AI assistant generated candidate implementations, TypeScript schemas, test cases, and configuration files aligned with the established design principles.
3. **Diff Review and Refinement:** The developer reviewed code diffs for adherence to clean architecture principles, eliminating extraneous dependencies or over-engineered patterns.
4. **Terminal Verification:** Commands were executed directly in the local environment (`npm run test:api`, `npm run test:web`, `npm run build`) to ensure that all generated code executed cleanly without errors or warnings.

---

## 3. Principles for AI Usage

1. **Augmentation, Not Autopilot:** AI was used to draft repetitive boilerplate, articulate edge cases, and scaffold modular structures. Code was not integrated without inspecting its runtime implications.
2. **Deterministic Verification:** No feature or test was documented as complete without running the corresponding terminal command and observing the output.
3. **Architectural Restraint:** Complex architectural proposals (e.g., distributed message brokers, microservices, or heavyweight build orchestrators) were resisted in favor of clean, modular monorepo patterns suited for an MVP codebase.
4. **Resilience and Graceful Degradation:** The AI was prompted to ensure that external dependency failures (such as MongoDB being offline) degrade gracefully to functional in-memory alternatives rather than terminating the process.

---

## 4. Engineering Decisions and Trade-offs Log

### Decision 1: Monorepo Strategy (Native npm Workspaces)
- **Context:** The project required separating the backend API (`apps/api`) from the frontend client (`apps/web`) while sharing root-level scripts and configuration.
- **Option Considered:** Turborepo or Nx vs. Native npm workspaces.
- **Decision:** **Accepted Native npm Workspaces.**
- **Rationale:** Native npm workspaces eliminate third-party build orchestrator overhead and configuration complexity. They provide native dependency hoisting, workspace script delegation, and zero additional installation friction for developers.
- **Rejected:** Turborepo / Nx. Deemed unnecessary overhead for a two-package MVP.

### Decision 2: Decoupled Server Architecture and Dual Persistence Fallback
- **Context:** The Express backend needed to support MongoDB document persistence while allowing local developers and evaluators to run the server and test suites without requiring a running MongoDB daemon.
- **Decision:**
  1. Decoupled Express application pipeline configuration (`src/app.ts`) from process listening and database bootstrapping (`src/index.ts`).
  2. Implemented the Repository Pattern via the `IAttemptRepository` interface, backed by `MongoAttemptRepository` (Mongoose) and `InMemoryAttemptRepository`.
  3. Added non-blocking connection logic in `src/config/db.ts` that catches connection failures, logs a sanitized notice, and automatically switches the active repository to in-memory mode.
- **Rationale:** Decoupled `app.ts` enables Supertest integration suites to run in-memory without port conflicts. The dual persistence pattern allows immediate evaluation without Docker or MongoDB setup, broadcasting the active storage mode via the `X-Persistence-Mode` header.
- **Rejected:** Hard-failing server startup on MongoDB connection failure.

### Decision 3: Structured Text/Form Modeling vs. Visual Canvas UML
- **Context:** Low-Level Design practice requires communicating class responsibilities, relationships, and design patterns.
- **Option Considered:** Visual drag-and-drop canvas (e.g., React Flow or Konva) vs. Structured form-based text editor.
- **Decision:** **Accepted Structured Form and JSON Editor.**
- **Rationale:** Canvas tools introduce high interaction overhead, complex layout state, and difficulty in automated parsing. Structured forms (organized into Assumptions, Entities, Relationships, Patterns, and Edge Cases) allow fast authoring, clear schema validation, precise diffing between revisions, and deterministic rubric evaluation.
- **Rejected:** Interactive drag-and-drop UML canvas. It distracts from core architectural reasoning and complicates multi-revision diffing.

### Decision 4: Deterministic Rubric Evaluator vs. Live LLM Grading
- **Context:** The platform needed an automated feedback engine to evaluate design submissions and calculate revision deltas.
- **Option Considered:** Live LLM API calls on submission vs. Rule-based deterministic evaluation engine (`deterministic-v1`).
- **Decision:** **Accepted Deterministic Rule-Based Evaluator for MVP.**
- **Rationale:** Live LLM grading introduces network latency, external API token costs, rate limits, and non-deterministic score drift between identical revisions. The `deterministicEvaluator` provides instant feedback across four 25-point dimensions (Domain Entities, SOLID and Modularity, Extensibility and Patterns, Edge Cases and Concurrency), guaranteeing repeatable scoring and clear concern diffing.
- **Rejected:** Unconstrained one-shot LLM evaluation for the core evaluation pipeline.

### Decision 5: Field-Level Validation UX and Defensive JSON Import
- **Context:** Submitting complex structured designs previously produced generic validation error messages or caused render crashes when imported JSON lacked optional fields.
- **Decision:**
  1. Built `validateStructuredDesign` and `formatErrorLocation` in `apps/web/src/utils/validation.ts` to surface field-level errors with clickable anchors.
  2. Built `normalizeAndValidateImportJson` in `apps/web/src/utils/importer.ts` to default missing arrays (`attributes`, `methods`, `relationships`, `designPatterns`), normalize object formats, map aliases (`edgeCases` to `edgeCasesConsidered`), and reject invalid structures without modifying existing form state.
  3. Introduced a React Error Boundary (`ErrorBoundary.tsx`) to catch unhandled rendering exceptions and provide recovery options.
- **Rationale:** Prevents white-screen crashes, preserves in-progress user drafts when importing malformed JSON, and provides clear guidance on why a submission failed validation.
- **Rejected:** Generic submission error banners and silent JSON import state overrides.

### Decision 6: Duplicate Submission Throttling
- **Context:** Rapid resubmissions or accidental double-clicks could pollute attempt history with identical duplicate revisions.
- **Decision:** Implemented an in-memory SHA-256 payload cache in `apps/api/src/services/attemptService.ts` with a 5-second window. Identical submissions within this window return the existing submission record with `isDuplicate: true` rather than incrementing the revision counter.
- **Rationale:** Protects data integrity and avoids unnecessary evaluation cycles.

### Decision 7: Anonymous Practice Sessions
- **Context:** Users should be able to start practicing LLD immediately without onboarding friction.
- **Decision:** Stored an anonymous user identifier in browser `localStorage` (`dk_anonymous_user_id`), passed to `/api/attempts` endpoints to group historical attempts.
- **Rationale:** Eliminates authentication barriers during initial evaluation while establishing the schema foundation for future multi-user authentication.
- **Rejected:** Premature authentication walls (OAuth/JWT) during the MVP phase.

---

## 5. Specific Areas of AI Assistance

### Project Scaffolding and Infrastructure
- Generated root and workspace `package.json` configurations for npm workspaces.
- Configured TypeScript configurations (`tsconfig.json`) across backend and frontend workspaces.
- Established Vite proxy rules (`vite.config.ts`) to route `/api` calls directly to the Express server in development.

### Schema Design and Edge-Case Analysis
- Formulated Zod schemas for structured submissions (`StructuredDesignSchema`), defining strict validation for entity naming, non-empty responsibilities, declared relationship targets, and pattern justifications.
- Identified potential edge cases in JSON import handling (e.g., payloads omitting optional arrays or using field aliases) and generated defensive normalization routines.

### Test Suite Construction
- Generated comprehensive Vitest and Supertest integration suites for the API server (`attempts-api.test.ts`, `submission-schema.test.ts`, `deterministic-evaluator.test.ts`, `repository.test.ts`, `health.test.ts`).
- Created React Testing Library suites (`App.test.tsx`, `validation.test.tsx`) testing form validation, rename cascading, JSON normalization, and crash prevention.

### Architectural Documentation
- Structured the initial Technical Design Note (`docs/design-note.md`) and Research Note (`docs/research-note.md`).
- Authored Mermaid sequence and architecture diagrams representing data flows and domain entity relationships.

---

## 6. Human Review and Verification Record

All code generated or modified with AI assistance underwent strict manual review and terminal verification:

1. **Code Review:** Inspecting generated modules for maintainability, type safety, secure URI handling (e.g., masking MongoDB credentials in logs), and proper separation of concerns.
2. **Terminal Execution:** Every major milestone was validated by running the monorepo test suites and build scripts.
   - **Backend Verification:** All 47 API tests in `apps/api` passing via `npm run test:api`.
   - **Frontend Verification:** All 18 Web tests in `apps/web` passing via `npm run test:web`.
   - **Production Build:** Clean TypeScript compilation and Vite bundling via `npm run build`.
