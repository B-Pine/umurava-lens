# Spec Compliance — Umurava AI Hackathon

This document maps each requirement from the Umurava AI Hackathon **Technical Guide** and the
**Talent Profile Schema Specification** to where it is implemented in this repository.

Legend: ✅ Met · 🟡 Partial (noted) · ⛔ Intentionally skipped (noted).

---

## 1. Problem statement coverage

> *"Build a system that understands job requirements, analyzes multiple applicants at once,
> produces a ranked shortlist (Top 10 or Top 20), and clearly explains why candidates were
> shortlisted."*

| Requirement | Status | Where |
|---|---|---|
| Understand job requirements & ideal profile | ✅ | `IJob` model carries title, description, required skills, experience level, `aiWeights`, `passingScore`, `shortlistCap` — all injected into the screening prompt. See [backend/src/models/Job.ts](backend/src/models/Job.ts) + prompt in [backend/src/services/geminiService.ts:149-207](backend/src/services/geminiService.ts) |
| Analyze multiple applicants at once | ✅ | A single Gemini call evaluates the entire candidate pool: `screenCandidates(job, candidates[])` in [geminiService.ts](backend/src/services/geminiService.ts) |
| Ranked shortlist — Top 10 or Top 20 | ✅ | `shortlistCap: 10 \| 20` is a per-job field. Post-processing in [screeningController.runScreening](backend/src/controllers/screeningController.ts) sets `shortlisted = true` for candidates whose `score ≥ passingScore` **and** `rank ≤ shortlistCap` |
| Explain why each candidate was shortlisted | ✅ | Each `ScreeningResult` persists `strengths[]`, `gaps[]`, `summary`, `recommendation`, `confidence`, and four sub-scores (technical / experience / education / project impact) |

---

## 2. Product scope — scenarios

### Scenario 1: Applicants from the Umurava platform

| Requirement | Status | Where |
|---|---|---|
| Accept structured talent profiles (schema-compliant) | ✅ | `POST /api/candidates/upload` accepts JSON arrays; `normalizeCandidate()` enforces schema |
| Analyze all applicants against job criteria | ✅ | `POST /api/screening/run` |
| Score + rank + Top-10/20 shortlist | ✅ | See above |
| Explainable output per candidate | ✅ | Structured strengths/gaps/summary/recommendation |
| Dummy data follows the schema | ✅ | Seed at [backend/src/seed.ts](backend/src/seed.ts) emits profiles with split names, typed skills (enum level + years), typed languages (enum proficiency), structured experience/education/projects, availability object, socialLinks object |

### Scenario 2: Applicants from external sources

| Requirement | Status | Where |
|---|---|---|
| Parse resumes (PDF) | ✅ | `POST /api/candidates/upload/files` → `pdf-parse` → `extractCandidateFromCV()` (Gemini) → `normalizeCandidate()` → Mongo insert. See [candidateController.uploadCandidateFiles](backend/src/controllers/candidateController.ts) |
| CSV / spreadsheet ingestion | ✅ | `POST /api/candidates/upload/csv` with flexible header mapping. Any CSV with columns like `Full Name / Name`, `Email`, `Phone`, `Headline / Title`, `Location`, `Skills` (comma/semicolon list), `LinkedIn`, `GitHub`, `Portfolio` is normalized into the schema |
| Matching + scoring methodology | ✅ | Same screening pipeline as Scenario 1 — ingestion surface is the only difference |
| Resume links (Google Drive) | ✅ | `frontend/src/hooks/useGoogleDrivePicker.ts` + Drive button on `/candidates/upload`; files are pulled client-side and POSTed through `/candidates/upload/files` |

---

## 3. Functional requirements (recruiter UI)

| Requirement | Status | Where |
|---|---|---|
| Job creation and editing | ✅ | `/jobs/create` and `/jobs/[id]/edit` |
| Applicant ingestion (profiles or uploads) | ✅ | `/candidates/upload` with PDF + CSV tabs + Google Drive picker |
| Trigger AI-based screening | ✅ | "Run Screening" on job cards + `/jobs/[id]/shortlist` |
| View ranked shortlists | ✅ | `/jobs/[id]/shortlist` with filters: **Shortlist (Top N)**, Top 10, Top 20, Score ≥ 80, All |
| View AI-generated reasoning per candidate | ✅ | Expand any card to see strengths / gaps / summary / sub-scores + AI recommendation |
| Cross-job shortlist view | ✅ (bonus) | `/shortlisted` — all Top-N candidates across all jobs |
| Candidate side-by-side comparison | ✅ | `/jobs/[id]/compare?candidates=a,b` |

---

## 4. System architecture

> *"Frontend (Next.js) · Backend (Node.js + TypeScript) · AI Layer (Gemini API) · Database (MongoDB)"*

| Layer | Status | Implementation |
|---|---|---|
| Frontend — Next.js | ✅ | Next.js 16 App Router — [frontend/src/app](frontend/src/app) |
| Backend — Node.js + TS | ✅ | Express 5 + TypeScript — [backend/src](backend/src) |
| AI Layer — Gemini | ✅ (mandatory) | `@google/generative-ai` with model `gemini-flash-latest`, temperature 0.1, JSON response mode — [backend/src/services/geminiService.ts](backend/src/services/geminiService.ts) |
| Database — MongoDB | ✅ | Mongoose 9 models in [backend/src/models](backend/src/models); collections: `users`, `jobs`, `candidates`, `screeningresults` |

---

## 5. AI & LLM requirements

### Mandatory

| Requirement | Status | Where |
|---|---|---|
| Gemini API used as underlying LLM | ✅ | [backend/src/config/gemini.ts](backend/src/config/gemini.ts) + [services/geminiService.ts](backend/src/services/geminiService.ts) |
| Intentional, documented prompt engineering | ✅ | Two prompts: `screenCandidates` (rank + draft emails) and `extractCandidateFromCV` (CV → schema). Both are heavily structured, enforce JSON output, and include explicit rules. The AI decision flow is diagrammed in [README.md](README.md#ai-decision-flow) |
| AI outputs clean, structured, recruiter-friendly | ✅ | Gemini returns JSON that is validated and normalized. Every screening result carries 11 structured fields + an email draft. No raw unstructured blobs |

### Recommended

| Capability | Status | Where |
|---|---|---|
| Multi-candidate evaluation in a single prompt | ✅ | One Gemini call evaluates the whole pool |
| Weighted scoring | ✅ | `job.aiWeights` (technical, experience, education, project impact) is injected into the prompt |
| Natural-language explanation per shortlisted candidate | ✅ | `strengths[]`, `gaps[]`, `summary`, `recommendation`, `emailDraft` |

---

## 6. Technology stack

| Encouraged stack | Status | Used |
|---|---|---|
| Language: TypeScript | ✅ | Backend + frontend |
| Frontend: Next.js | ✅ | 16 (App Router) |
| State: Redux + Redux Toolkit | ✅ | [frontend/src/store](frontend/src/store) — `authSlice`, `jobsSlice`, `candidatesSlice`, `screeningSlice` |
| Styling: Tailwind CSS | ✅ | v4 |
| Backend: Node.js | ✅ | Express 5 |
| Database: MongoDB | ✅ | Mongoose 9 |
| AI / LLM: Gemini API | ✅ | Mandatory — `@google/generative-ai` |

All six encouraged technologies are used. No deviation requires justification.

---

## 7. Talent Profile Schema compliance

Every field in the specification is modeled in [backend/src/models/Candidate.ts](backend/src/models/Candidate.ts):

### 7.1 Basic information

| Spec field | Required | Model field | Required in model | Notes |
|---|---|---|---|---|
| First Name | Yes | `firstName` | ✅ | string, trimmed |
| Last Name | Yes | `lastName` | ✅ | string, trimmed |
| Email | Yes | `email` | ✅ | string, lowercased, indexed |
| Headline | Yes | `headline` | ✅ | string |
| Bio | No | `bio` | — | string, default "" |
| Location | Yes | `location` | ✅ | string |

### 7.2 Skills & languages

| Spec | Model |
|---|---|
| `skills: [{ name, level (enum), yearsOfExperience }]` | Matches exactly. Enum: `Beginner\|Intermediate\|Advanced\|Expert` |
| `languages: [{ name, proficiency (enum) }]` | Matches exactly. Enum: `Basic\|Conversational\|Fluent\|Native` |

### 7.3 Work experience

| Spec field | Model field |
|---|---|
| company / role / startDate / endDate / description / technologies[] / isCurrent | All present ✅ |

(The spec uses "Start Date" / "End Date" / "Is Current" casing; we normalize to
`startDate` / `endDate` / `isCurrent` per TypeScript + JSON conventions.)

### 7.4 Education

| Spec field | Model field |
|---|---|
| institution / degree / fieldOfStudy / startYear / endYear | All present ✅ |

### 7.5 Certifications

| Spec field | Model field |
|---|---|
| name / issuer / issueDate | All present ✅ |

### 7.6 Projects

| Spec field | Model field |
|---|---|
| name / description / technologies[] / role / link / startDate / endDate | All present ✅ |

### 7.7 Availability

| Spec field | Model field |
|---|---|
| `status` (Available / Open to Opportunities / Not Available) | Enum-enforced ✅ |
| `type` (Full-time / Part-time / Contract) | Enum-enforced ✅ |
| `startDate` (optional) | Present ✅ |

### 7.8 Social links

| Spec | Model |
|---|---|
| `{ linkedin, github, portfolio, … }` | Present, with `strict: false` on subdoc to permit additional keys as the spec allows ✅ |

### Extensibility

The spec permits additional fields; we add:

- `source` — `'Umurava Platform' \| 'CSV' \| 'PDF' \| 'Google Drive' \| 'Manual'` (audit trail)
- `avatarUrl`, `resumeUrl` — optional asset pointers
- A virtual `fullName` and a virtual `yearsOfExperience` computed from `experience[]`

Core spec fields are **not** modified or removed.

---

## 8. Deployment requirements

| Requirement | Status | Notes |
|---|---|---|
| Deployed and accessible online | 🟡 | Deployment configs are ready ([render.yaml](render.yaml), [vercel.json](frontend/vercel.json), [Procfile](backend/Procfile)) — final URL to be added to `README.md` after deploy |
| Live URL at submission | 🟡 | To be populated before submission |
| Environment variables securely configured | ✅ | Documented in [backend/.env.example](backend/.env.example) + [frontend/.env.example](frontend/.env.example); `.env` is gitignored |
| Basic error handling in production | ✅ | All API controllers wrap in try/catch, return structured `{ error, details? }` responses, and log server-side |

---

## 9. Codebase & documentation standards

| Requirement | Status | Where |
|---|---|---|
| Clean, structured repository | ✅ | Monorepo with clear `backend/` + `frontend/` separation; models / services / controllers / routes / middleware split in backend |
| README with project overview | ✅ | [README.md](README.md) |
| Architecture diagram | ✅ | ASCII diagram in README |
| Setup instructions | ✅ | Full local setup section |
| Environment variables documented | ✅ | Both `.env.example` files + a table in README |
| AI decision flow explanation | ✅ | Dedicated "AI decision flow" section in README |
| Assumptions and limitations | ✅ | "Assumptions and limitations" section in README |
| Code readability | ✅ | TypeScript strict mode in both tsconfigs; both projects type-check clean |

---

## 10. Expected deliverables

| Deliverable | Status | Notes |
|---|---|---|
| Deployed web application | 🟡 | Configs ready; URL pending deploy |
| Functional AI-powered screening logic | ✅ | `POST /api/screening/run` exercises the full pipeline end-to-end |
| Clear recruiter-facing interface | ✅ | `/dashboard`, `/jobs`, `/jobs/[id]/shortlist`, `/jobs/[id]/compare`, `/candidates`, `/candidates/upload`, `/shortlisted` |
| Technical documentation | ✅ | This file + README |
| Google Slides / PowerPoint (≤ 2 slides) | ⛔ | Outside this repo — to be attached with submission |

---

## 11. Review notes — design decisions

Short rationale for every deviation from "minimum viable implementation":

1. **Per-job `shortlistCap` (10 or 20)** instead of a hardcoded global value — the spec
   explicitly says "Top 10 **or** Top 20", implying recruiter choice. We made it a job field.
2. **`emailDraft` baked into the screening step.** The spec requires human-led hiring
   decisions; coupling drafts to the evaluation eliminates a second AI round-trip while still
   giving the recruiter a full review + edit + send loop.
3. **Ethereal SMTP fallback.** A hackathon judge running the app locally should not
   accidentally email real people. Fallback is automatic when any SMTP env var is missing.
4. **Auth is minimal by design.** Single recruiter role, JWT + bcrypt, seeded admin. Full
   multi-tenant RBAC is out of scope for the spec but the middleware groundwork supports it.
5. **No public careers/apply page.** The spec scenarios assume applicants arrive from the
   Umurava platform or external sources the recruiter controls — building a public job board
   is outside the problem statement and would dilute focus from the AI screening quality.
6. **Admin settings page skipped.** Not in the spec's functional requirements. Adding cosmetic
   settings tabs would add surface area without moving judging criteria.

---

## 12. Out-of-spec features (additionals)

Features beyond the minimum spec, included because they strengthen the recruiter workflow:

- **Side-by-side candidate comparison** (`/jobs/[id]/compare`) — deep view for 2+ candidates.
- **Google Drive picker** on the upload page — supports the "resume links" clause of Scenario 2.
- **AI-drafted, recruiter-approved outreach emails** — materially expresses the spec's
  human-in-the-loop requirement.
- **Cross-job `/shortlisted`** view — lets the recruiter see all Top-N talent in one pane.

---

## 13. Quick verification checklist

Run these commands from the repo root to verify compliance locally:

```bash
# Type-check both sides
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit

# Boot
cd ../backend && npm run seed && npm run dev   # :5000
cd ../frontend && npm run dev                   # :3000
```

Then in the UI:

1. Log in at `/login` with the seeded admin.
2. Visit `/jobs/[id]/shortlist` on the "Senior AI Research Engineer" job — verify strengths,
   gaps, sub-scores, and the `OutreachPanel` with a pre-drafted email.
3. Click **Send email** on a shortlisted candidate — check the Ethereal preview URL returned
   in the UI feedback line.
4. Upload a CSV or PDF at `/candidates/upload` — confirm the candidate appears with a
   structured profile matching the Talent Profile Schema.
5. Visit `/shortlisted` — confirm the Top-N candidates from every job appear.

---

*End of compliance document.*
