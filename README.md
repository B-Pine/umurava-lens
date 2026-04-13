# 🔍 Umurava Lens — AI Talent Intelligence Platform

> AI-powered recruitment screening platform that helps recruiters create job postings, upload candidates, run intelligent AI screening using Google Gemini, and view ranked shortlists with explainable insights.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9-green?logo=mongodb)
![Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?logo=google)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [AI Decision Flow](#-ai-decision-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Screens](#-screens)
- [Deployment](#-deployment)

---

## 🎯 Overview

Umurava Lens is a production-ready SaaS application for recruitment screening. It enables:

- **Job Management** — Create, edit, and manage job postings with AI-configurable weights
- **Candidate Ingestion** — Bulk upload candidates with rich talent profiles
- **AI Screening** — One-click AI-powered candidate evaluation using Google Gemini
- **Ranked Shortlists** — View AI-generated rankings with strengths, gaps, and recommendations
- **Side-by-Side Comparison** — Deep-dive comparison between top candidates

---

## 🏗 Architecture

```
┌────────────────┐        ┌────────────────┐        ┌─────────────┐
│                │  REST  │                │   AI   │             │
│   Next.js App  │◄──────►│  Express API   │◄──────►│ Gemini API  │
│   (Frontend)   │  JSON  │  (Backend)     │  JSON  │  (Google)   │
│                │        │                │        │             │
└────────────────┘        └───────┬────────┘        └─────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │   MongoDB    │
                          │  (Database)  │
                          └──────────────┘
```

### Data Flow

1. Recruiter creates a job with AI weighting configuration
2. Candidates are uploaded (structured JSON or file upload)
3. Recruiter triggers AI screening
4. Backend fetches job + candidates, sends to Gemini with structured prompt
5. Gemini returns scored, ranked results in JSON format
6. Results are stored in MongoDB
7. Frontend displays ranked shortlist with actionable insights

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework with SSR/SSG |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Redux Toolkit** | State management with async thunks |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + TypeScript** | Server runtime |
| **Express 5** | REST API framework |
| **MongoDB + Mongoose 9** | Database & ODM |
| **Google Gemini API** | AI-powered screening |
| **Multer** | File upload handling |

---

## 🧠 AI Decision Flow

### Scoring Dimensions (Configurable per Job)
| Dimension | Default Weight | Description |
|---|---|---|
| Technical Skills | 85% | Verified code & platform proficiency |
| Years of Experience | 40% | Tenure and career progression |
| Education Credentials | 25% | Degrees and institutional quality |
| Past Project Impact | 70% | Portfolio quality and proven outcomes |

### AI Pipeline

```
Job Data + Candidates ─► Preprocessing ─► Gemini Prompt ─► Structured JSON ─► Database
                                              │
                                    ┌─────────┴─────────┐
                                    │  Scoring Logic:    │
                                    │  - Skills Match    │
                                    │  - Experience Fit  │
                                    │  - Project Impact  │
                                    │  - Education       │
                                    │  - Confidence %    │
                                    └────────────────────┘
```

### Output Format
```json
{
  "candidates": [
    {
      "candidateId": "MongoDB ObjectId",
      "score": 98,
      "rank": 1,
      "strengths": ["Specific evidence-based strength"],
      "gaps": ["Specific actionable gap"],
      "summary": "Professional 2-3 sentence assessment",
      "recommendation": "hire | consider | risky",
      "confidence": 96,
      "technicalSkillsScore": 99,
      "experienceScore": 95,
      "educationScore": 98,
      "projectImpactScore": 97
    }
  ]
}
```

### Recommendation Thresholds
- **HIRE** → Score ≥ 85
- **CONSIDER** → Score 70-84
- **RISKY** → Score < 70

### AI Safeguards
- Temperature: `0.1` (near-deterministic)
- Response format: `application/json` (enforced)
- JSON extraction fallback for malformed responses
- Retry support (re-run screening)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas connection string)
- **Google Gemini API Key** – [Get one here](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
cd umurava-lens

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umurava-lens
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=development
```

### Seed the Database (Optional)

Populate the database with sample data:

```bash
cd backend
npm run seed
```

This creates:
- 3 sample jobs (AI Engineer, Backend Lead, Design Director)
- 4 candidates with rich profiles
- Pre-computed screening results

### Run the Application

```bash
# Terminal 1: Start the backend
cd backend
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI screening |
| `NODE_ENV` | No | Environment mode (development/production) |
| `NEXT_PUBLIC_API_URL` | No | Frontend API URL (default: http://localhost:5000/api) |

---

## 📡 API Reference

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs/dashboard/stats` | Dashboard statistics |
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs` | List jobs (with filters/pagination) |
| `GET` | `/api/jobs/:id` | Get job by ID |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |

**Query Parameters (GET /api/jobs):**
- `status` — Filter by status (active/draft/closed)
- `experienceLevel` — Filter by experience level
- `sort` — Sort order (applicants)
- `page` — Page number
- `limit` — Items per page

### Candidates

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/candidates/upload` | Upload candidates (JSON array) |
| `GET` | `/api/candidates` | List candidates |
| `GET` | `/api/candidates/:id` | Get candidate by ID |

**Upload Body:**
```json
{
  "jobId": "optional_mongodb_id",
  "candidates": [
    {
      "fullName": "Sarah Kalsi",
      "email": "sarah@email.com",
      "currentTitle": "Principal Scientist",
      "currentCompany": "DeepTech AI",
      "skills": ["Python", "PyTorch"],
      "yearsOfExperience": 12,
      "education": [{ "degree": "PhD CS", "institution": "Stanford", "year": 2014 }],
      "experience": [{ "title": "Principal Scientist", "company": "DeepTech AI", "startDate": "2021", "endDate": "Present", "description": "Leading LLM products." }],
      "projects": [{ "name": "LLM Platform", "description": "End-to-end LLM deployment", "technologies": ["Python", "PyTorch"] }]
    }
  ]
}
```

### Screening

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/screening/run` | Run AI screening for a job |
| `GET` | `/api/screening/:jobId` | Get screening results |
| `GET` | `/api/screening/compare` | Compare candidates |

**Run Screening Body:**
```json
{ "jobId": "mongodb_job_id" }
```

**Compare Query:**
```
/api/screening/compare?candidateIds=id1,id2&jobId=jobId
```

---

## 📁 Project Structure

```
umurava-lens/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   └── gemini.ts            # Gemini client singleton
│   │   ├── controllers/
│   │   │   ├── jobController.ts     # Job CRUD + dashboard stats
│   │   │   ├── candidateController.ts # Candidate upload + listing
│   │   │   └── screeningController.ts # AI screening + comparison
│   │   ├── models/
│   │   │   ├── Job.ts               # Job schema (weights, skills, status)
│   │   │   ├── Candidate.ts         # Rich talent profile schema
│   │   │   └── ScreeningResult.ts   # AI evaluation results
│   │   ├── routes/
│   │   │   ├── jobRoutes.ts         # /api/jobs routes
│   │   │   ├── candidateRoutes.ts   # /api/candidates routes
│   │   │   └── screeningRoutes.ts   # /api/screening routes
│   │   ├── services/
│   │   │   └── geminiService.ts     # Gemini AI integration
│   │   ├── index.ts                 # Express server entry
│   │   └── seed.ts                  # Database seeding script
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx   # Main dashboard
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx         # Jobs listing
│   │   │   │   ├── create/page.tsx  # Job creation wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── shortlist/page.tsx  # AI screening results
│   │   │   │       └── compare/page.tsx    # Candidate face-off
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx         # Candidates list
│   │   │   │   └── upload/page.tsx  # Bulk candidate upload
│   │   │   ├── layout.tsx           # Root layout (sidebar + topbar)
│   │   │   ├── globals.css          # Design tokens + styles
│   │   │   └── page.tsx             # Redirect to /dashboard
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   │   └── Topbar.tsx       # Top navigation bar
│   │   │   ├── ui/
│   │   │   │   ├── ScoreBadge.tsx   # Circular score indicator
│   │   │   │   ├── FilterBar.tsx    # Reusable filter component
│   │   │   │   ├── LoadingSkeleton.tsx  # Loading states
│   │   │   │   └── EmptyState.tsx   # Empty data states
│   │   │   ├── jobs/                # (Job-specific components)
│   │   │   ├── candidates/          # (Candidate-specific components)
│   │   │   └── screening/           # (Screening-specific components)
│   │   ├── store/
│   │   │   ├── store.ts             # Redux store configuration
│   │   │   ├── Provider.tsx         # Redux provider wrapper
│   │   │   ├── hooks.ts            # Typed dispatch/selector hooks
│   │   │   ├── jobsSlice.ts        # Jobs state + async thunks
│   │   │   ├── candidatesSlice.ts  # Candidates state
│   │   │   └── screeningSlice.ts   # Screening results state
│   │   └── lib/
│   │       └── api.ts              # Axios instance
│   ├── public/
│   │   └── logo.png                # Umurava Lens logo
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## 🖥 Screens

### 1. Dashboard
Overview of active jobs, screening progress, quick actions, and top talent highlights.

### 2. Jobs Listing
Grid of job cards with status badges, skill tags, applicant counts, and AI screening actions. Includes filters and pagination.

### 3. Job Creation Wizard
Multi-step form with:
- **Step 1**: Core job identity (title, department, description)
- **Step 2**: AI lens calibration (adjustable scoring weights)
- **Step 3**: Mandatory technical stack (skill tags)

### 4. Candidate Upload
Drag-and-drop zone for resume uploads with processing queue, target job selector, and info cards about Neural Data Extraction and Privacy Standards.

### 5. Shortlist Results
Ranked candidate list with:
- Match scores and circular progress badges
- Recommendation badges (Hire/Consider/Risky)
- Expandable strengths and gaps
- AI recommendation summaries
- Re-run screening capability

### 6. Candidate Comparison (Face-Off)
Side-by-side deep comparison showing:
- Core strengths analysis
- Technical proficiency bars
- Gaps & potential risks
- AI final verdict with actionable next steps

---

## 🚢 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Environment
- Set `NEXT_PUBLIC_API_URL` to your production backend URL
- Ensure MongoDB is accessible from the deployment environment
- Set a valid `GEMINI_API_KEY`

---

## 📝 License

This project is built for Umurava as an AI-powered recruitment screening solution.

---

*Built with ❤️ using Next.js, Express, MongoDB, and Google Gemini AI*
