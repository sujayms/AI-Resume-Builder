# AI Resume Builder — Engineering Blueprint

**Stack:** React + Tailwind (Frontend) · Flask (Backend) · PostgreSQL (Database) · JWT (Auth) · Gemini API (AI) · Vercel + Render (Deployment)

---

## 1. Product Requirements Document (PRD)

### 1.1 Problem Statement
Job seekers, especially students and early-career candidates, struggle to create resumes that are simultaneously well-designed, ATS (Applicant Tracking System)-compliant, and content-strong. Most existing tools either focus on visual templates (poor ATS parsing) or plain text editors (no design help). Candidates also lack access to expert-level feedback on phrasing, quantification of achievements, and keyword alignment with job descriptions. This product solves that gap by combining structured resume building with AI-assisted content improvement, all while keeping output ATS-friendly.

### 1.2 Target Users
- College students and new graduates applying for internships/full-time roles.
- Early-to-mid career professionals switching jobs or industries.
- Bootcamp graduates entering tech for the first time.
- (Secondary) Career counselors/mentors helping multiple candidates.

### 1.3 Goals
- Let users build a complete, professional resume in under 15 minutes.
- Ensure every exported resume passes common ATS parsing checks.
- Provide AI-driven suggestions that measurably improve bullet point quality (action verbs, quantification, clarity).
- Support multiple resumes per user (e.g., tailored per job/industry).
- Be a portfolio-quality, production-grade project demonstrating full-stack + AI integration skills.

### 1.4 User Personas

**Persona 1 — Aditi, Final-Year CS Student**
Applying to 30+ SDE internships. Needs to quickly tailor one base resume for different roles (backend, ML, frontend) without starting over each time.

**Persona 2 — Rahul, Bootcamp Graduate**
Career switcher from a non-tech background. Struggles to phrase projects and transferable skills in professional/technical language. Relies heavily on AI suggestions.

**Persona 3 — Meera, Working Professional (3 YOE)**
Wants a polished, ATS-safe resume for a job switch. Values clean templates and quick PDF export over heavy customization.

### 1.5 User Stories
- As a user, I want to sign up and log in securely so my resumes are private and persistent.
- As a user, I want to create a new resume from a blank template or by duplicating an existing one.
- As a user, I want to fill in structured sections (contact info, summary, education, experience, projects, skills, certifications) through a guided editor.
- As a user, I want AI suggestions to rewrite or strengthen my bullet points.
- As a user, I want to see an ATS-compatibility score/checklist before exporting.
- As a user, I want to export my resume as a clean, well-formatted PDF.
- As a user, I want to manage (rename, duplicate, delete, archive) multiple resumes from a dashboard.
- As a user, I want to choose between a few professional templates.
- As a user, I want my data to be safe and only accessible to me.

### 1.6 Functional Requirements
1. User registration/login with JWT-based session management.
2. CRUD operations for resumes (create, read, update, delete, duplicate).
3. Structured resume schema (sections: personal info, summary, education, experience, projects, skills, certifications, achievements).
4. Rich but constrained editor (avoids free-form styling that breaks ATS parsing).
5. AI integration (Gemini API) for: bullet point rewriting, summary generation, keyword/skills suggestions based on a target job description.
6. ATS-friendliness checker (heuristic-based: font/structure rules, missing sections, keyword density, contact info presence).
7. PDF generation/export from structured data (server-side rendering, not screenshot-based).
8. Resume dashboard listing all resumes with metadata (last edited, template used, target role tag).
9. Template selection (at least 2–3 ATS-safe layouts).
10. User profile/settings (change password, update account info, delete account).

### 1.7 Non-Functional Requirements
- **Security:** Passwords hashed (bcrypt/argon2), JWT with short-lived access tokens + refresh tokens, input validation/sanitization, HTTPS everywhere.
- **Performance:** Resume editor autosave should not block UI; PDF generation under ~3 seconds for typical resumes.
- **Scalability:** Stateless backend (horizontally scalable), DB indexed on user_id/resume_id, AI calls rate-limited per user.
- **Availability:** Graceful degradation if AI service is down (core editor/export still works).
- **Maintainability:** Modular backend (service/repository pattern), typed frontend (TypeScript optional but recommended), documented API (OpenAPI/Swagger).
- **Usability:** Mobile-responsive editor; autosave with visible save-status indicator.

### 1.8 Assumptions
- Users have basic resume content ready (education, work history) even if unpolished.
- Gemini API is accessible and within free/paid quota limits during development.
- Initial launch targets English-language resumes only.
- Single-user accounts (no team/org accounts in v1).

### 1.9 Constraints
- Must stay within free/low-cost tiers of Vercel, Render, and Gemini API for a portfolio project.
- Render free tier has cold starts — must be factored into UX (loading states).
- PDF export must not depend on headless-browser screenshotting alone if avoidable, for both performance and ATS text-extractability (prefer HTML-to-PDF with real text layers, e.g., WeasyPrint, or a templated PDF library).

---

## 2. MVP Scope

### Must Have (v1 — Launch Blocking)
- Email/password signup & login with JWT auth.
- Create / edit / delete / list resumes (dashboard).
- Structured resume editor (all core sections).
- At least 2 ATS-friendly templates.
- PDF export with real, selectable text (not an image).
- AI: "Improve this bullet point" and "Generate summary" features.
- Basic ATS compatibility checklist (rule-based, not AI-dependent).
- Responsive UI (desktop-first, usable on mobile).

### Should Have (v1.1 — Soon After Launch)
- Duplicate resume (clone as new version).
- AI: keyword suggestions based on a pasted job description.
- Resume scoring dashboard (completeness %, ATS score).
- Dark mode.
- Autosave with debounce + save-status indicator.

### Nice to Have (v2)
- Multiple template themes with color customization.
- Cover letter generator (AI-assisted).
- Export to DOCX in addition to PDF.
- Resume version history (undo/rollback).
- Public shareable resume link (view-only).

### Future Features (v3+)
- LinkedIn profile import.
- Team/recruiter view for mentors reviewing student resumes.
- Analytics: track which resume version got more interview calls (self-reported).
- Multi-language resume support.
- Browser extension to auto-fill job applications from resume data.

---

## 3. Application Features (Detailed)

### 3.1 Authentication
Users sign up with name, email, and password. Passwords are hashed server-side before storage. On login, the backend issues a short-lived JWT access token and a longer-lived refresh token (httpOnly cookie recommended for refresh token to reduce XSS risk). The frontend attaches the access token to authenticated API calls; when it expires, the frontend silently requests a new one via the refresh endpoint. Logout invalidates the refresh token (token blacklist or rotation).

### 3.2 Dashboard
The landing page after login. Displays a grid/list of all the user's resumes as cards, each showing: resume title, target role/tag (optional), last-edited timestamp, template thumbnail, and quick actions (edit, duplicate, delete, export). A prominent "Create New Resume" button starts the flow, either from a blank template or by choosing an existing resume to duplicate.

### 3.3 Resume Management
Users can rename resumes, duplicate them (useful for tailoring the same base resume to different roles), archive/delete them, and organize them (optionally tag by role, e.g., "Backend Internship", "PM Role"). All actions are reflected instantly in the dashboard with optimistic UI updates.

### 3.4 Resume Editor
A section-based, guided editor rather than a freeform canvas — this is intentional for both ATS-safety and UX simplicity. Sections include: Personal Info (name, email, phone, links), Professional Summary, Work Experience (repeatable entries with role, company, dates, bullet points), Education, Projects (repeatable), Skills (categorized: technical, soft, tools), Certifications, and Achievements. Each section can be reordered, added, or removed. Bullet points are entered as discrete list items (not paragraphs) to enforce ATS-friendly formatting and to allow the AI to target individual bullets for improvement.

### 3.5 Resume Templates
Two to three professionally designed, ATS-safe templates (single-column, standard fonts, no tables/graphics/text-boxes that break ATS parsers). Users pick a template independently of content — switching templates re-renders the same structured data into a different layout, which is only possible because content and presentation are kept separate in the data model.

### 3.6 PDF Export
Triggered from the editor or dashboard. The backend takes the structured resume JSON, renders it into the selected template (HTML/CSS), and converts it into a PDF with a real text layer (e.g., using WeasyPrint or a similar HTML-to-PDF engine) so that ATS systems and copy-paste both work correctly. The user gets a download link/button; large PDFs or slow renders show a loading state.

### 3.7 AI Features
- **Bullet Point Improver:** User selects a bullet point and clicks "Improve with AI." The backend sends the bullet (plus role/context) to the Gemini API with a prompt engineered to strengthen action verbs, add quantifiable impact where plausible, and tighten language. The user sees the suggestion and can accept, edit, or reject it.
- **Summary Generator:** Based on the user's filled-in experience/skills, AI drafts a 2–3 sentence professional summary, which the user can edit.
- **Keyword/JD Matching (v1.1):** User pastes a target job description; AI compares it against the resume and suggests missing keywords/skills to consider adding (never auto-inserts false claims — always requires user confirmation).
- All AI suggestions are clearly marked as "AI-generated — review before use" to set correct user expectations and avoid over-trust.

### 3.8 ATS Compatibility Checker
A rule-based (non-AI) checker that runs on demand or on save, flagging: missing sections (e.g., no skills section), missing contact info, bullet points that are too long, use of tables/images (not applicable since editor is structured), inconsistent date formats, and a rough keyword density check against a pasted job description if provided. Presented as a checklist/score, not a black box.

### 3.9 Settings & Profile
Users can update their name/email, change password, and delete their account (with confirmation and data cleanup). Basic preference toggles (e.g., default template, dark mode) live here too.

---

## 4. User Flow

```
Landing Page
   │  (marketing/value prop, CTA: Sign Up / Login)
   ▼
Sign Up  ──────────────►  Login
   │                         │
   └────────────┬────────────┘
                ▼
            Dashboard
   (list of resumes + "Create New")
                │
                ▼
         Create Resume
   (choose blank / duplicate existing / pick template)
                │
                ▼
          Edit Resume
   (fill sections: info, summary, experience,
    education, projects, skills, certifications)
                │
                ▼
     Generate AI Suggestions
   (improve bullets, generate summary,
    optional JD keyword match)
                │
                ▼
      Review ATS Checklist
   (fix flagged issues, optional)
                │
                ▼
         Download PDF
                │
                ▼
     Manage Existing Resumes
   (back to dashboard: rename, duplicate,
    delete, re-edit, re-export anytime)
```

Each arrow represents a point where the user can also back out (save-and-exit) without losing progress, since autosave persists state continuously.

---

## 5. High-Level Architecture

### Frontend (React + Tailwind, hosted on Vercel)
A single-page application responsible for all UI rendering and client-side state (editor state, dashboard, auth state). Communicates with the backend exclusively via a REST API over HTTPS. Holds the JWT access token in memory (not localStorage, to reduce XSS token-theft risk) and relies on an httpOnly cookie for refresh tokens. Handles optimistic UI updates for dashboard actions and debounced autosave calls from the editor.

### Backend (Flask, hosted on Render)
A stateless REST API organized in layers: routes/controllers (HTTP handling) → services (business logic, including AI orchestration and ATS scoring) → repositories/models (database access via an ORM such as SQLAlchemy). Responsible for authentication (issuing/validating JWTs), resume CRUD, PDF generation, and proxying/orchestrating calls to the Gemini API (so the API key never reaches the client). Includes middleware for auth verification, request validation, rate limiting, and centralized error handling.

### Database (PostgreSQL)
Stores users, resumes (as structured relational tables or a hybrid relational + JSONB approach for flexible section content), and refresh tokens (or a token-blacklist table). A hybrid model is recommended: core entities (users, resumes, resume metadata) are relational; the resume's section content (experience entries, bullet points, etc.) can be stored as JSONB for flexibility while still being queryable, avoiding an overly rigid multi-table schema for every nested resume field.

### Authentication (JWT)
Stateless access tokens (short-lived, e.g., 15 minutes) signed with a server secret, validated on every protected request. Refresh tokens (longer-lived, e.g., 7 days) are stored server-side (or as a rotating token in an httpOnly cookie) to allow revocation on logout or password change. Passwords are never stored in plaintext; hashing uses bcrypt or argon2 with proper salting.

### AI Service (Gemini API)
The backend, not the frontend, calls the Gemini API — this keeps the API key secret and allows for prompt engineering, response validation, and rate limiting to be centralized. Each AI feature (bullet improvement, summary generation, keyword matching) maps to a dedicated backend endpoint with a carefully constructed prompt template. Responses are sanitized/validated before being returned to the client (e.g., stripping any unexpected formatting, enforcing length limits).

### Deployment
- **Frontend:** Deployed on Vercel, connected to the GitHub repo for CI/CD (auto-deploy on push to main, preview deployments for PRs).
- **Backend:** Deployed on Render as a web service, also connected via GitHub for auto-deploy. Environment variables (DB connection string, JWT secret, Gemini API key) stored securely in Render's environment settings, never committed to source control.
- **Database:** Managed PostgreSQL instance (Render PostgreSQL or a managed provider like Supabase/Neon), with automated backups enabled.
- **Config separation:** `.env` files for local dev (gitignored), environment variables for production — never hardcoded secrets.

---

## 6. Folder Structure

### Frontend (`/frontend`)
```
frontend/
├── public/
├── src/
│   ├── api/                  # API client, axios instance, endpoint functions
│   ├── assets/                # images, icons, fonts
│   ├── components/
│   │   ├── common/            # Button, Input, Modal, Loader, etc.
│   │   ├── dashboard/
│   │   ├── editor/
│   │   │   ├── sections/      # ExperienceForm, EducationForm, SkillsForm...
│   │   │   └── ai/            # AISuggestionPanel, BulletImprover
│   │   └── templates/         # Resume template render components
│   ├── context/               # AuthContext, ResumeContext
│   ├── hooks/                 # useAuth, useAutosave, useResume
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── SignUp.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Editor.jsx
│   │   └── Settings.jsx
│   ├── routes/                 # ProtectedRoute, AppRouter
│   ├── styles/                 # Tailwind config, global styles
│   ├── utils/                  # validators, formatters
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── tailwind.config.js
└── package.json
```

### Backend (`/backend`)
```
backend/
├── app/
│   ├── __init__.py              # app factory
│   ├── config.py                # environment-based config classes
│   ├── extensions.py            # db, jwt, cors init
│   ├── models/
│   │   ├── user.py
│   │   ├── resume.py
│   │   └── token.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── resume_routes.py
│   │   ├── ai_routes.py
│   │   └── export_routes.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── resume_service.py
│   │   ├── ai_service.py        # Gemini API orchestration
│   │   ├── pdf_service.py       # HTML -> PDF rendering
│   │   └── ats_checker_service.py
│   ├── schemas/                 # Marshmallow/Pydantic validation schemas
│   ├── templates/                # HTML/Jinja templates for resume rendering
│   ├── middleware/
│   │   ├── auth_middleware.py
│   │   └── error_handler.py
│   └── utils/
├── migrations/                    # Alembic migrations
├── tests/
│   ├── test_auth.py
│   ├── test_resume.py
│   └── test_ai.py
├── .env.example
├── requirements.txt
└── run.py
```

---

## 7. Development Roadmap (Daily Milestones)

**Phase 1 — Foundations**
1. **Day 1:** Repo setup (frontend + backend scaffolds), CI basics, README, folder structure, environment config files.
2. **Day 2:** Database schema design + migrations (users, resumes tables); connect Flask to PostgreSQL via SQLAlchemy.
3. **Day 3:** User signup/login endpoints with password hashing and JWT issuance; write auth unit tests.
4. **Day 4:** Frontend auth pages (Sign Up, Login) wired to backend; protected route handling; token storage strategy.

**Phase 2 — Core Resume CRUD**
5. **Day 5:** Resume model (with JSONB content field) + CRUD API endpoints (create, list, get, update, delete).
6. **Day 6:** Dashboard UI — list resumes as cards, create-new flow, delete/duplicate actions.
7. **Day 7:** Resume editor shell — section navigation, form state management, connect to backend save endpoint.
8. **Day 8:** Build out individual section forms (Experience, Education, Projects, Skills) with add/remove/reorder.
9. **Day 9:** Autosave implementation (debounced save + save-status UI indicator).

**Phase 3 — Templates & Export**
10. **Day 10:** Design and implement Template 1 (HTML/CSS, ATS-safe, single column).
11. **Day 11:** Implement PDF generation service (structured data → rendered HTML → PDF); export endpoint + download button.
12. **Day 12:** Design and implement Template 2; add template-switcher UI.

**Phase 4 — AI Integration**
13. **Day 13:** Backend integration with Gemini API — bullet point improvement endpoint + prompt design.
14. **Day 14:** Frontend AI suggestion panel — "Improve with AI" button, accept/reject suggestion flow.
15. **Day 15:** Summary generator feature (backend + frontend).
16. **Day 16:** ATS compatibility checker (rule-based) — backend logic + frontend checklist UI.

**Phase 5 — Polish & Hardening**
17. **Day 17:** Settings/profile page (update info, change password, delete account).
18. **Day 18:** Responsive design pass (mobile/tablet) across dashboard and editor.
19. **Day 19:** Error handling, loading states, empty states, rate-limiting on AI endpoints.
20. **Day 20:** Security pass — input validation, CORS config, secrets audit, refresh token flow review.

**Phase 6 — Deployment & Launch**
21. **Day 21:** Deploy backend to Render, frontend to Vercel, configure production environment variables.
22. **Day 22:** End-to-end testing in production environment, fix deployment-specific bugs (CORS, cold starts).
23. **Day 23:** Write documentation — README, architecture diagram, API docs (Swagger/OpenAPI).
24. **Day 24:** Final polish — landing page copy/design, demo video/GIFs for GitHub/portfolio, resume/LinkedIn write-up of the project.

*(Should Have / Nice to Have features from Section 2 can be scheduled as additional milestones after Day 24, once the MVP is stable.)*

---

## 8. Risks

### Technical Risks
- PDF rendering fidelity issues across templates (font embedding, page-break handling).
- Gemini API response inconsistency (formatting, occasional irrelevant output) requiring robust prompt engineering and output validation.
- JSONB-based resume content can become schema-inconsistent over time without strict validation (mitigate with schema validation library like Pydantic/Marshmallow on every write).

### Security Risks
- JWT theft via XSS if tokens are mishandled on the frontend (mitigate: short-lived access tokens, httpOnly refresh cookies, strict CSP).
- Insecure direct object references (IDOR) — a user accessing another user's resume by guessing IDs (mitigate: always scope queries by authenticated user_id, never trust client-supplied ownership).
- Leaking the Gemini API key if AI calls are ever made client-side (mitigate: all AI calls go through backend only).
- Insufficient rate limiting on AI endpoints leading to abuse/cost overruns.

### Performance Risks
- Render free-tier cold starts causing slow first-load after inactivity — mitigate with a lightweight health-check ping or clear loading UX messaging.
- Synchronous PDF generation blocking request threads under load — consider async job handling if usage grows.
- Large resume payloads (many entries) slowing down autosave — mitigate with debouncing and partial/delta updates if needed.

### Scalability Concerns
- Single-instance backend won't scale under concurrent load — architecture should remain stateless so it can be horizontally scaled later.
- Database connection pool exhaustion under many concurrent users — configure pool limits appropriately (e.g., via SQLAlchemy engine settings).
- AI API rate limits/cost scaling linearly with user growth — consider caching common suggestions or introducing usage quotas per user.

---

## 9. Best Practices

### Git Workflow
- Trunk-based development with short-lived feature branches merged via Pull Requests into `main`.
- `main` is always deployable; use preview deployments (Vercel PR previews, Render preview environments if available) to validate before merge.
- Protect `main` with required PR reviews (even if self-reviewing solo, use PR descriptions as documentation).

### Branching Strategy
- `main` — production-ready code.
- `develop` (optional for solo projects, useful to simulate real team workflow) — integration branch.
- `feature/<short-description>` — e.g., `feature/resume-editor-autosave`.
- `fix/<short-description>` — for bug fixes.
- `chore/<short-description>` — for tooling/config changes.

### Commit Message Style
Follow **Conventional Commits**:
```
feat: add bullet point AI improvement endpoint
fix: correct JWT expiry validation bug
refactor: extract resume service from route handler
docs: add API documentation for resume endpoints
test: add unit tests for ATS checker service
chore: update dependencies
```

### Coding Standards
- **Backend:** PEP 8 compliance, type hints, Black/Flake8 for formatting/linting, service-layer separation (no business logic in route handlers).
- **Frontend:** ESLint + Prettier, component-per-file, colocate related hooks/components, prefer functional components with hooks, keep components under ~200 lines where reasonable.
- Consistent naming conventions: camelCase (JS/React), snake_case (Python).
- Environment-specific config via `.env` files, never hardcoded values.

### Documentation Strategy
- Root `README.md`: project overview, tech stack, setup instructions, screenshots/demo GIF, architecture diagram.
- `/docs` folder (optional): detailed architecture notes, API reference (auto-generated via Swagger/OpenAPI for Flask), ADRs (Architecture Decision Records) for major decisions (e.g., "why JSONB for resume content").
- Inline docstrings for backend services and complex frontend hooks.
- Keep this blueprint document in the repo (e.g., `/docs/blueprint.md`) as a living reference through development.

---

*End of blueprint. This document is intended to be the reference plan for implementation — no source code has been generated per your instructions.*
