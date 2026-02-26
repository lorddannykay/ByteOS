# ByteOS — The Operating System for Learning

<p align="center">
  <strong>Learns with you, for you.</strong>
</p>

<p align="center">
  An <strong>AI-native</strong>, <strong>evidence-informed</strong> learning platform that democratises high-quality, personalised education.
</p>

---

## About

**ByteOS** is an open-source Learning Operating System built on principles from the **learning sciences** and **cognitive science**. It combines:

- **AI-powered authoring** — Create courses from prompts or documents without armies of instructional designers.
- **Adaptive delivery** — Content adapts to each learner’s goals, prior knowledge, and struggles.
- **Multi-modality** — One authoring flow; delivery in text, video, audio, mindmaps, flashcards, and games.
- **Personal AI tutor “Byte”** — RAG-based Q&A with longitudinal memory and contextual help.
- **Learning paths & certifications** — Structured programmes with due dates, compliance, and shareable credentials.

The platform is designed so that **learners** get a personalised, supportive experience, **L&D teams** can build and assign training quickly, and **organisations** can track outcomes and compliance — all without the cost of traditional enterprise authoring tools and LMSs.

---

## Research Foundation

ByteOS is grounded in established research on **adaptive instruction**, **multimodal learning**, **intelligent tutoring**, **formative assessment**, and **learner modelling**. For a concise account of the evidence base and design choices, see:

- **[RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md)** — Learning sciences alignment, references, and suggested citation.

We encourage use and extension of ByteOS in **academic and applied research** and ask that you cite the repository when you do.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         B Y T E O S                             │
├────────────────────────────┬────────────────────────────────────┤
│   ByteOS Studio (:3000)    │   ByteOS Learn (:3001)             │
│   Admin / authoring        │   Learner delivery                  │
│   Next.js 14, TypeScript   │   Next.js 14, TypeScript            │
├────────────────────────────┴────────────────────────────────────┤
│   Supabase (PostgreSQL, Auth, Storage) — single source of truth  │
├─────────────────────────────────────────────────────────────────┤
│   ByteOS Intelligence (:8000) — Python FastAPI                  │
│   Adaptive engine, AI tutor, next-best-action                   │
└─────────────────────────────────────────────────────────────────┘
```

- **Studio** — Create courses, learning paths, assign learners, set due dates, view analytics and compliance.
- **Learn** — Enrol in courses and paths, learn with Byte, track progress, earn certificates.
- **Intelligence** — Optional Python service for heavier adaptive logic; core flows also work with direct AI calls from Studio/Learn.

---

## Project Structure

```
ByteOS/
├── README.md                 ← You are here
├── RESEARCH_FOUNDATION.md    ← Learning sciences & citation
├── ECOSYSTEM.md              ← Master architecture (for contributors & AI agents)
├── AGENTS.md                 ← Instructions for AI coding agents
├── LICENSE                   ← MIT
├── docs/
│   ├── PRD.md                ← Product requirements
│   ├── STRATEGIC_PATH.md     ← Roadmap & priorities
│   ├── ACTION_PLANS.md       ← Executable action plans
│   ├── PRODUCT_FEATURES.md   ← Feature specification
│   ├── USER_PERSONAS.md      ← Personas
│   └── USER_FLOWS.md         ← User flows
├── byteos-studio/            ← Admin app (Next.js 14) — Port 3000
├── byteos-learn/             ← Learner app (Next.js 14) — Port 3001
├── byteos-intelligence/      ← AI engine (Python FastAPI) — Port 8000
└── byteos-video/             ← Video generation (optional)
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Supabase** account ([supabase.com](https://supabase.com))
- At least one **AI provider** key (e.g. [Together AI](https://together.ai))

### 1. Clone and install

```bash
git clone https://github.com/lorddannykay/ByteOS.git
cd ByteOS
```

### 2. Supabase

1. Create a project at [Supabase](https://supabase.com).
2. In the SQL Editor, run the schema/migrations from your Prisma schema or the SQL provided in `ECOSYSTEM.md` (and any triggers/policies as documented).
3. Note your project URL, anon key, and service role key.

### 3. ByteOS Studio (admin)

```bash
cd byteos-studio
cp .env.example .env.local   # or create .env.local
# Set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL, TOGETHER_API_KEY
npm install
npx prisma db push
npm run dev
```

→ **http://localhost:3000**

### 4. ByteOS Learn (learner)

```bash
cd byteos-learn
cp .env.example .env.local
# Use the SAME Supabase keys; add TOGETHER_API_KEY for Byte
npm install
npm run dev
```

→ **http://localhost:3001**

### 5. (Optional) ByteOS Intelligence

```bash
cd byteos-intelligence
pip install -r requirements.txt
# Configure .env and run
uvicorn src.api.main:app --reload --port 8000
```

---

## Features (high level)

| Area | Capabilities |
|------|----------------|
| **Authoring** | AI course generation (outline + modules + quizzes), markdown content, adaptive/mandatory paths, assign learners + due dates. |
| **Learning** | Personalised dashboard, streaks & progress, Byte tutor (RAG + memory), quizzes, text selection → Byte, learning paths with unlock rules. |
| **Intelligence** | Next-best-action, onboarding assessment, struggle detection from quizzes, adaptive path ordering, personalised welcome. |
| **Compliance** | Path/course assignments, due dates, compliance view (overdue / at-risk / on-track), certificates with shareable verification link. |

See [docs/PRODUCT_FEATURES.md](./docs/PRODUCT_FEATURES.md) for the full specification.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Studio & Learn | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL); Prisma in Studio |
| Auth | Supabase Auth |
| AI | Together AI (primary), OpenAI/Anthropic (fallback) |
| Intelligence | Python FastAPI (optional) |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ECOSYSTEM.md](./ECOSYSTEM.md) | Architecture, schema, phases — **read first** when contributing. |
| [RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md) | Learning sciences, evidence base, citation. |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents. |
| [docs/STRATEGIC_PATH.md](./docs/STRATEGIC_PATH.md) | Vision alignment and roadmap. |
| [docs/PRD.md](./docs/PRD.md) | Product requirements. |

---

## Contributing

We welcome contributions that align with the project’s goal: **democratising high-quality, personalised learning** using evidence-informed design. Please read [ECOSYSTEM.md](./ECOSYSTEM.md) and [AGENTS.md](./AGENTS.md) before making large changes.

1. Fork the repository.
2. Create a branch, make your changes, and add tests if applicable.
3. Open a Pull Request with a clear description of the change and how it fits the roadmap.

---

## License

ByteOS is released under the **MIT License**. See [LICENSE](./LICENSE).

---

## Citation

If you use ByteOS in research or derivative work, please cite the repository and the research foundation:

```bibtex
@software{byteos2026,
  author       = {ByteOS Contributors},
  title        = {ByteOS: An AI-Native Learning Operating System},
  year         = {2026},
  url          = {https://github.com/lorddannykay/ByteOS},
  note         = {Evidence-informed adaptive learning platform. Research foundation: RESEARCH_FOUNDATION.md}
}
```

---

<p align="center">
  <strong>ByteOS</strong> — Learns with you, for you.
</p>

<p align="center">
  <sub>February 2026</sub>
</p>
