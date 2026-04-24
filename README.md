# Umurava Lens

**AI-powered talent screening for recruiters.** Built for the Umurava AI Hackathon.

Umurava Lens helps recruiters create job postings, ingest candidates in multiple formats, run
a single AI pass that evaluates and ranks every applicant, review explainable strengths and
gaps, and send AI-drafted outreach emails — with the **recruiter always making the final call**.

![Stack](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9-green?logo=mongodb)
![Redux%20Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2-purple?logo=redux)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?logo=google)

---

## Table of contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Talent Profile Schema](#talent-profile-schema)
- [AI decision flow](#ai-decision-flow)
- [Human-in-the-loop: outreach](#human-in-the-loop-outreach)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Assumptions and limitations](#assumptions-and-limitations)

---

## What it does

**Scenario 1 — Applicants from Umurava's platform:**
Upload structured candidate profiles (matching the Umurava Talent Profile Schema) via JSON,
pre-seeded profiles, or bulk uploads. Run AI screening → get a ranked shortlist with a
configurable Top 10 or Top 20 cap.

**Scenario 2 — Applicants from external sources:**
Drop PDF resumes or CSV spreadsheets directly into the app. Gemini extracts structured profile
data into the same schema. Drive picker is supported for recruiters who store resumes in
Google Drive.

For each shortlisted candidate the recruiter sees:

- Overall match score (0–100) + confidence
- Sub-scores per dimension (skills, experience, education, project impact)
- Specific strengths and gaps tied to the candidate's profile
- A recommendation (`hire`, `consider`, `risky`)
- A **draft outreach email** — pre-written but never auto-sent

---

## Architecture

```
┌─────────────────────┐         REST          ┌──────────────────────┐
│   Next.js 16 App    │ ───────────────────▶ │  Express 5 API       │
│   Redux Toolkit     │ ◀─────────────────── │  TypeScript          │
│   Tailwind 4        │        JSON + JWT     │  JWT auth            │
└─────────────────────┘                       └──────┬───────────────┘
                                                     │
                                         ┌───────────┼───────────────┐
                                         │           │               │
                                         ▼           ▼               ▼
                                  ┌─────────────┐ ┌────────┐  ┌──────────────┐
                                  │  MongoDB    │ │ Gemini │  │   SMTP       │
                                  │  Atlas /    │ │ API    │  │  (Ethereal   │
                                  │  local      │ │        │  │   fallback)  │
                                  └─────────────┘ └────────┘  └──────────────┘
```

**Collections:** `users`, `jobs`, `candidates`, `screeningresults`.

**AI calls:** two — `extractCandidateFromCV` (CV → structured Talent Profile) and
`screenCandidates` (job + candidates → ranked results + per-candidate email drafts).

---

## Tech stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend framework | **Next.js 16** (App Router) | Spec-required |
| State | **Redux Toolkit** with async thunks | Spec-required |
| Styling | **Tailwind CSS 4** | |
| Backend | **Node.js + TypeScript + Express 5** | |
| Database | **MongoDB + Mongoose 9** | Spec-required |
| LLM | **Google Gemini** (`gemini-flash-latest`) | Spec-required |
| Auth | JWT + bcrypt | Single recruiter role for the hackathon |
| Email | Nodemailer — real SMTP in prod, Ethereal fallback in dev | |
| File parsing | `pdf-parse` for resumes, `csv-parser` for spreadsheets | |
| Drive integration | Google Picker API (optional) | |

---

## Talent Profile Schema

The Mongoose `Candidate` model in [backend/src/models/Candidate.ts](backend/src/models/Candidate.ts)
implements the full Umurava Talent Profile Schema verbatim:

```ts
{
  firstName, lastName, email, headline, bio, location, phone,
  skills:         [{ name, level: "Beginner|Intermediate|Advanced|Expert", yearsOfExperience }],
  languages:      [{ name, proficiency: "Basic|Conversational|Fluent|Native" }],
  experience:     [{ company, role, startDate, endDate, description, technologies[], isCurrent }],
  education:      [{ institution, degree, fieldOfStudy, startYear, endYear }],
  certifications: [{ name, issuer, issueDate }],
  projects:       [{ name, description, technologies[], role, link, startDate, endDate }],
  availability:   { status: "Available|Open to Opportunities|Not Available",
                    type:   "Full-time|Part-time|Contract",
                    startDate? },
  socialLinks:    { linkedin, github, portfolio, ... },
  source:         "Umurava Platform | CSV | PDF | Google Drive | Manual"
}
```

Required fields are enforced at the model level. CSV/PDF ingestion runs every candidate through
`normalizeCandidate()` to guarantee enum correctness before insertion.

### Compliance with Section 4: Extensibility
Per the official specification, we left all core structured fields completely unmodified. However, we robustly **extended** the schema mathematically and architecturally to support the AI engine:
- **Computed Attributes:** Added strict aggregations like total `yearsOfExperience` calculating natively off the `experience[].startDate` and `endDate`.
- **System Metadata:** Added `resumeUrl`, `avatarUrl`, `phone`, and `source` tags.
- **AI Screening Results Model:** Instead of bloating the core Profile Schema, we built a dedicated 1-to-1 `ScreeningResult` relational schema. This securely houses the **AI-generated scores** (sub-scores for technical, experience, education, impact), along with the AI reasoning (strengths/gaps) and email outreach drafts, keeping the raw Talent Profile pristine as requested.

---

## AI decision flow

```
                    JOB + CANDIDATES
                          │
                          ▼
   ┌────────────────────────────────────────────────┐
   │  Prompt builder                                │
   │  - Injects full job spec & aiWeights           │
   │  - Inlines each candidate's Talent Profile     │
   │  - Embeds passingScore + shortlistCap          │
   │  - Forces JSON response schema                 │
   └────────────────┬───────────────────────────────┘
                    ▼
          Gemini (temperature 0.1, JSON mode)
                    │
                    ▼
   ┌────────────────────────────────────────────────┐
   │  Output per candidate:                         │
   │  - score, rank, confidence                     │
   │  - sub-scores (skills/exp/edu/projects)        │
   │  - strengths[], gaps[]                         │
   │  - recommendation (hire/consider/risky)        │
   │  - emailSubject, emailDraft                    │
   └────────────────┬───────────────────────────────┘
                    ▼
   ┌────────────────────────────────────────────────┐
   │  Post-processing                               │
   │  - Sort by rank                                │
   │  - Flag shortlisted = (score ≥ passingScore)   │
   │                       AND (rank ≤ shortlistCap)│
   │  - Persist ScreeningResult (one per candidate) │
   │  - Update Job counters                         │
   └────────────────────────────────────────────────┘
```

**Why this design:**

- **One prompt, all candidates.** Multi-candidate comparison in a single pass gives the LLM
  context to rank consistently. It also keeps the cost and latency budget for a 50-candidate job
  inside one API call.
- **Weights come from the recruiter.** Each job has `aiWeights` (technical / experience /
  education / project impact, 0–100). The prompt tells Gemini to apply them explicitly.
- **Determinism over creativity.** `temperature: 0.1`, `responseMimeType: 'application/json'`,
  and a brace-matching JSON extractor for fallback parsing (`extractJson()` in
  [geminiService.ts](backend/src/services/geminiService.ts)).
- **Top 10 / Top 20.** `shortlistCap` is a per-job field (spec asks for "Top 10 or 20"). The
  prompt still evaluates *every* candidate so the recruiter has full context, but only the top N
  passing candidates are flagged as `shortlisted`.

---

## Human-in-the-loop: outreach

The spec is explicit: **the recruiter makes the final hiring decision, not the AI.** Lens
enforces this at two levels:

1. **No auto-send.** Gemini drafts `emailSubject` + `emailDraft` per candidate during screening
   (interview invite for shortlisted, graceful decline for the rest). Drafts are saved with
   `emailStatus: 'not_sent'`.
2. **Recruiter reviews and sends.** On each shortlist card there is an `OutreachPanel`
   component — recruiters can edit the subject/body, save drafts, and only when they explicitly
   click **Send email** (with a confirmation prompt) does the outreach leave the system. The
   `emailStatus` flips to `sent` and the `emailSentAt` timestamp is persisted.

Ethereal SMTP is used as a safe dev fallback: emails are captured to a preview URL rather than
delivered, so demos never leak into real inboxes.

---

## Local setup

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local install or a free Atlas cluster)
- **Google Gemini API key** — https://aistudio.google.com/app/apikey

### 1. Clone and install

```bash
git clone <repo-url>
cd umurava-lens

# Backend
cd backend
cp .env.example .env   # then fill in GEMINI_API_KEY + MONGODB_URI
npm install

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
```

### 2. Seed the database

From `backend/`:

```bash
npm run seed
```

This creates:

- 1 admin recruiter user (credentials logged at the end of seeding — default is
  `admin@umurava.africa` / `umurava-admin-2026`, configurable via `SEED_ADMIN_*` env vars).
- 3 jobs (one active with pre-screened candidates).
- 4 candidates matching the Umurava Talent Profile Schema.
- 4 screening results with recruiter-ready email drafts.

### 3. Run

```bash
# Terminal 1
cd backend && npm run dev
# → http://localhost:5000/api/health

# Terminal 2
cd frontend && npm run dev
# → http://localhost:3000
```

Sign in at http://localhost:3000/login with the seeded credentials.
(Default: **`admin@umurava.africa`** / **`umurava-admin-2026`**)

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | API port (default 5000) |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | **yes** | Mongo connection string |
| `GEMINI_API_KEY` | **yes** | Gemini LLM key |
| `JWT_SECRET` | **yes in prod** | Secret for signing JWTs |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | no | Seeded admin |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | no | Real outreach delivery; if any is missing, Ethereal is used |

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes in prod | Backend API base URL (with `/api` suffix) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_API_KEY` / `NEXT_PUBLIC_GOOGLE_APP_ID` | no | Google Drive picker on the upload page |

---

## Deployment

**Frontend → Vercel**

- Root directory: `frontend/`
- Build command: `npm run build` (auto)
- Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.

**Backend → Render / Railway / Fly.io**

A Render blueprint is included at the repo root as [`render.yaml`](render.yaml). On Render,
point a new Blueprint at the repo and fill the secrets prompted (Mongo URI, Gemini key, SMTP).
A [`Procfile`](backend/Procfile) is also provided for Heroku-style hosts.

**Database → MongoDB Atlas** (free M0 tier works).

Post-deploy checklist:

1. Set `NODE_ENV=production`.
2. Set a strong `JWT_SECRET`.
3. Run `npm run seed` once against the production DB (or create an admin manually).
4. Hit `/api/health` to confirm the service is up.

---

## Project structure

```
umurava-lens/
├── backend/
│   ├── src/
│   │   ├── config/            # Mongo + Gemini client setup
│   │   ├── models/            # User, Job, Candidate, ScreeningResult
│   │   ├── services/          # geminiService, emailService
│   │   ├── controllers/       # auth, job, candidate, screening, outreach
│   │   ├── middleware/        # auth JWT guard
│   │   ├── routes/            # Express route groups
│   │   ├── seed.ts            # Admin + demo data seeder
│   │   └── index.ts           # Server entry
│   ├── .env.example
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/         # Recruiter sign-in
│   │   │   ├── dashboard/
│   │   │   ├── jobs/          # List, create, edit, shortlist, compare
│   │   │   ├── candidates/    # List + bulk upload (PDF/CSV/Drive)
│   │   │   ├── shortlisted/   # Top-N across all jobs
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── layout/        # AppShell (auth gate), Sidebar, Topbar
│   │   │   ├── screening/     # OutreachPanel
│   │   │   └── ui/
│   │   ├── store/             # Redux slices (auth, jobs, candidates, screening)
│   │   ├── hooks/             # useGoogleDrivePicker
│   │   └── lib/               # axios with JWT interceptor
│   ├── .env.example
│   └── vercel.json
├── render.yaml                # One-click backend deploy blueprint
└── README.md
```

---

## API reference

All `/api/*` endpoints except `/api/auth/login` and `/api/health` require a
`Authorization: Bearer <JWT>` header.

**Auth**

- `POST /api/auth/login` → `{ token, user }`
- `GET  /api/auth/me` → `{ user }`

**Jobs**

- `GET /api/jobs` · `POST /api/jobs` · `GET /api/jobs/:id` · `PUT /api/jobs/:id` · `DELETE /api/jobs/:id`
- `GET /api/jobs/dashboard/stats`

**Candidates**

- `GET /api/candidates` (with `jobId`, `search`, `page`, `limit`, `dateFrom/To`)
- `POST /api/candidates/upload` (JSON array)
- `POST /api/candidates/upload/files` (PDF resumes, multipart)
- `POST /api/candidates/upload/csv` (CSV files, multipart)
- `GET /api/candidates/:id` · `DELETE /api/candidates/:id` · `DELETE /api/candidates` (bulk via body)

**Screening**

- `POST /api/screening/run` (body: `{ jobId, candidateIds? }`)
- `GET  /api/screening/:jobId` (with `minScore`, `recommendation`, `shortlistedOnly`)
- `GET  /api/screening/shortlisted` (Top-N across all jobs)
- `GET  /api/screening/compare?candidateIds=id1,id2&jobId=...`
- `PATCH /api/screening/results/:id/email` — update draft

**Outreach**

- `POST /api/outreach/send` (body: `{ screeningResultId, subject?, body? }`)
- `POST /api/outreach/send/batch` (body: `{ screeningResultIds: [] }`)

---

## Assumptions and limitations

1. **Single-tenant auth.** The hackathon build has a recruiter role only — no multi-tenant
   workspaces, no per-user permissions beyond `admin` / `recruiter`. Adding RBAC is a small
   follow-on; the groundwork is in [middleware/auth.ts](backend/src/middleware/auth.ts).
2. **No public apply page.** The problem statement assumes applicants arrive via Umurava's
   existing talent platform, so the recruiter is the only user of this UI. Candidate data
   enters via structured upload, PDFs, CSVs, or the Drive picker.
3. **OCR not included.** PDF parsing uses text extraction; scanned-image PDFs are rejected
   with a clear error. Adding Tesseract/Document AI is a swap in
   `candidateController.extractPdfText()`.
4. **Email delivery.** With no SMTP env vars set, delivery falls back to Ethereal test inboxes
   so demos are safe. Real delivery is one env change away (set `SMTP_HOST/PORT/USER/PASS`).
5. **Gemini rate limits.** A single screening request sends every candidate in one prompt; for
   very large pools (100+) the recruiter should batch or increase model capacity. The `runScreening`
   endpoint accepts an optional `candidateIds` array so batching can be done client-side without
   changes.
6. **AI outputs are stochastic.** Results are seeded with `temperature: 0.1` for near-deterministic
   behavior, but two identical runs may differ slightly. Re-running a screening is idempotent
   (old `ScreeningResult`s for the job are cleared first).
7. **Talent Profile Schema compliance.** Core fields are enforced by the Mongoose schema;
   extensions (AI scores, shortlist flag, outreach state) are added on the `ScreeningResult`
   model, not the `Candidate`, so the canonical profile stays clean.

---

Built for the Umurava AI Hackathon.
