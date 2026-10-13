# DesignKarlo ⚡

> **Low-Level Design (LLD) practice platform with iterative, evidence-based feedback.**

DesignKarlo helps software engineers practice Low-Level Design problems, receive objective and actionable feedback anchored in design principles, revise their architectures, and clearly track how their solutions improve across multiple attempts.

---

## 🎯 Core Practice Workflow

```
Choose Problem ➔ Design Solution ➔ Submit ➔ Receive Feedback ➔ Revise ➔ Compare Attempts
```

Our key differentiator is **continuity and usefulness of feedback across attempts**, rather than a cluttered UML drag-and-drop canvas or a generic one-shot AI score.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | High-performance SPA with type safety |
| **Styling** | Tailwind CSS (Neo-Brutalist theme) | High-contrast visual design system |
| **Icons** | Lucide React | Clean, consistent icons |
| **Backend** | Node.js + Express + TypeScript | Modular REST API service |
| **Validation**| Zod | Runtime schema validation for requests and environment |
| **Database** | MongoDB + Mongoose | Document persistence (optional for Phase 1 foundation) |
| **Testing** | Vitest + Supertest + React Testing Library | Fast, unified unit & integration testing |
| **Monorepo** | npm workspaces | Zero-dependency multi-package orchestration |

---

## 📂 Project Structure

```
d:/MVP/
├── apps/
│   ├── api/                     # Express backend
│   │   ├── src/
│   │   │   ├── config/          # Environment & MongoDB configuration
│   │   │   ├── middleware/      # Zod validation & global error handlers
│   │   │   ├── routes/          # Health check & modular route definitions
│   │   │   ├── tests/           # Integration tests (Vitest + Supertest)
│   │   │   ├── app.ts           # Express app definition & middleware pipeline
│   │   │   └── index.ts         # Server bootstrap & entry point
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                     # React frontend (Vite)
│       ├── src/
│       │   ├── App.tsx          # Neo-brutalist landing & API status widget
│       │   ├── App.test.tsx     # Vitest component tests
│       │   ├── main.tsx         # React DOM root entry
│       │   ├── index.css        # Tailwind directives & neo-brutalist styles
│       │   └── test-setup.ts    # Testing library matchers
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── docs/
│   ├── research-note.md         # Problem analysis, market landscape & verification matrix
│   └── design-note.md           # Domain concepts, submission format & architecture decisions
├── AI_USAGE.md                  # Log of AI usage and engineering decisions
├── README.md                    # Project documentation & setup instructions
├── .env.example                 # Root environment template
├── .gitignore                   # Monorepo git ignore rules
└── package.json                 # Monorepo root configuration & workspace scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

### 2. Installation
Install all monorepo dependencies across root, frontend, and backend with a single command from the project root:

```bash
npm install
```

### 3. Environment Configuration
Create your local environment files from the provided examples:

```bash
# Root environment file
cp .env.example .env

# Backend environment file (optional, inherits root if needed)
cp apps/api/.env.example apps/api/.env
```

> **Note:** MongoDB is **not required** to run the Phase 1 foundation. If MongoDB is offline, the API server automatically runs in standalone mode and the health endpoint continues to operate normally.

---

## 💻 Available Scripts

Run these scripts from the monorepo root:

### Development
```bash
# Run both Frontend (Vite) and Backend (Express) concurrently
npm run dev

# Run only the Backend API (http://localhost:5000)
npm run dev:api

# Run only the Frontend Web App (http://localhost:5173)
npm run dev:web
```

### Building
```bash
# Type-check and build both workspaces
npm run build

# Build only the Backend (dist/)
npm run build:api

# Build only the Frontend (dist/)
npm run build:web
```

### Testing
```bash
# Run tests across all workspaces
npm run test

# Run Backend tests only (Vitest + Supertest)
npm run test:api

# Run Frontend tests only (Vitest + React Testing Library)
npm run test:web
```

---

## 🩺 Verifying Health Endpoint

Once the API server is running (`npm run dev` or `npm run dev:api`), open your browser or run:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "designkarlo-api",
  "timestamp": "2026-10-14T...",
  "uptime": 5,
  "environment": "development",
  "database": "disconnected (standalone mode)"
}
```

The frontend at `http://localhost:5173` also features an interactive verification widget that queries `/api/health` directly through the Vite dev proxy.

---

## 📝 Milestone Status

- [x] **Milestone 1:** Project Foundation from Scratch (Monorepo, React+Vite, Express API, Neo-Brutalist Theme, Documentation, Git initialization).
- [ ] **Milestone 2:** Problem Library & Domain Models.
- [ ] **Milestone 3:** Structured Design Submission Editor.
- [ ] **Milestone 4:** Rubric-Based Feedback Engine.
- [ ] **Milestone 5:** Multi-Attempt Comparison & Progression View.
