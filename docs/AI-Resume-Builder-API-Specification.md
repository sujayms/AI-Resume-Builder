# AI Resume Builder — REST API Specification

This document defines the complete production-ready REST API built on top of the approved engineering blueprint and PostgreSQL schema. It specifies conventions, auth flow, every endpoint (purpose, method, URL, request/response, validation, errors), pagination/filtering/sorting, rate limiting, versioning, and file/AI endpoints. No implementation code is included — this is a contract, not code.

---

## 1. API Conventions

- **Base URL:** `https://api.airesumebuilder.com/api/v1`
- **Format:** All requests/responses use `application/json`, except file downloads (`application/pdf`).
- **Versioning:** URI-based (`/api/v1/...`). A new major version (`/api/v2`) is introduced only for breaking changes; additive changes (new optional fields, new endpoints) ship within `v1`. Old versions are supported for a documented deprecation window (minimum 6 months) once `v2` ships.
- **Resource naming:** Plural nouns, kebab-case for multi-word resources (`/ai-suggestions`), nested resources reflect ownership (`/resumes/{resumeId}/export`).
- **HTTP methods map to intent:**
  - `GET` — retrieve, no side effects, cacheable.
  - `POST` — create a resource, or trigger a non-idempotent action (e.g., AI generation).
  - `PUT` — full replace of a resource.
  - `PATCH` — partial update (used for most resume edits/autosave).
  - `DELETE` — remove (soft-delete at the service layer, per schema's `deleted_at`).
- **Idempotency:** `PUT`, `PATCH`, `DELETE` are idempotent by design. `POST` endpoints that create AI content are **not** idempotent — repeated calls generate new suggestions and are subject to rate limiting.
- **Timestamps:** ISO 8601, UTC (`2026-07-12T10:15:30Z`).
- **IDs in URLs:** UUIDs for user-facing resources (`users`, `resumes`, tokens), matching the schema's ID strategy.
- **Authentication header:** `Authorization: Bearer <access_token>` on all protected endpoints.
- **Content negotiation:** `Content-Type: application/json` required on all request bodies; `Accept: application/json` assumed by default.

---

## 2. Authentication Flow

1. **Sign up** (`POST /auth/signup`) → creates a `users` row, returns access + refresh tokens (auto-login on signup).
2. **Login** (`POST /auth/login`) → validates credentials, issues a new access token (short-lived, 15 min) and refresh token (long-lived, 7 days, stored hashed in `refresh_tokens`).
3. **Authenticated requests** attach `Authorization: Bearer <access_token>`. The backend validates the JWT signature and expiry on every request via auth middleware.
4. **Token refresh** (`POST /auth/refresh`) → client sends the refresh token (via httpOnly cookie); server validates it against `refresh_tokens.token_hash`, checks `revoked_at IS NULL` and `expires_at > now()`, then issues a new access token and **rotates** the refresh token (old one is revoked, new one issued) — rotation limits the blast radius of a leaked refresh token.
5. **Logout** (`POST /auth/logout`) → sets `revoked_at = now()` on the current refresh token row.
6. **Password reset** → `POST /auth/forgot-password` issues a `password_reset_tokens` row and emails a link; `POST /auth/reset-password` validates the token (`used_at IS NULL`, not expired), updates `password_hash`, marks the token used, and revokes all existing refresh tokens for that user (forces re-login everywhere — standard security practice after a password change).

Access tokens are never stored server-side (stateless, self-contained JWT with `user_id`, `exp`, `iat` claims). Refresh tokens are always validated against the database so they can be revoked.

---

## 3. Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed due to invalid input.",
    "details": [
      { "field": "email", "issue": "must be a valid email address" }
    ]
  }
}
```

`meta` is present only where relevant (e.g., pagination info). `details` is present only for validation-style errors.

---

## 4. Standard Status Codes

| Code | Meaning | Used For |
|---|---|---|
| `200 OK` | Success | Successful `GET`, `PATCH`, `PUT`, `POST` (non-creation actions) |
| `201 Created` | Resource created | Successful `POST` that creates a resource |
| `204 No Content` | Success, empty body | Successful `DELETE` |
| `400 Bad Request` | Malformed request | Invalid JSON, missing required fields |
| `401 Unauthorized` | Auth failure | Missing/invalid/expired access token |
| `403 Forbidden` | Authz failure | Valid token, but not the resource owner |
| `404 Not Found` | Resource missing | Resume/user/template doesn't exist (or isn't visible to this user) |
| `409 Conflict` | State conflict | Duplicate email on signup |
| `422 Unprocessable Entity` | Semantic validation failure | Passes JSON parsing but fails business validation |
| `429 Too Many Requests` | Rate limit exceeded | AI endpoints, login attempts |
| `500 Internal Server Error` | Unhandled server fault | Logged and alerted, generic message returned to client |
| `503 Service Unavailable` | Upstream dependency down | Gemini API unreachable (AI endpoints degrade gracefully) |

**Note on 404 vs 403:** For resource ownership checks (e.g., user A requesting user B's resume), the API returns `404 Not Found` rather than `403 Forbidden`, to avoid confirming the resource's existence to a non-owner (prevents resource enumeration, consistent with the IDOR mitigation from the schema design).

---

## 5. Authentication Endpoints

### `POST /auth/signup`
**Purpose:** Create a new user account and immediately log them in.
**Auth required:** No

**Request body:**
```json
{
  "name": "Aditi Sharma",
  "email": "aditi@example.com",
  "password": "SecurePass123!"
}
```
**Validation rules:**
- `name`: required, string, 2–120 chars.
- `email`: required, valid email format, unique (case-insensitive), max 255 chars.
- `password`: required, min 8 chars, must contain at least one letter and one number.

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Aditi Sharma", "email": "aditi@example.com" },
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```
*(Refresh token is set as an httpOnly, secure cookie — never returned in the JSON body.)*

**Errors:** `409 Conflict` (`EMAIL_ALREADY_EXISTS`), `422 Unprocessable Entity` (weak password).

---

### `POST /auth/login`
**Purpose:** Authenticate an existing user and issue tokens.
**Auth required:** No

**Request body:**
```json
{ "email": "aditi@example.com", "password": "SecurePass123!" }
```
**Response `200 OK`:** Same shape as signup response.
**Errors:** `401 Unauthorized` (`INVALID_CREDENTIALS` — deliberately generic, doesn't reveal whether email exists), `429 Too Many Requests` after repeated failed attempts (brute-force protection).

---

### `POST /auth/refresh`
**Purpose:** Exchange a valid refresh token (from httpOnly cookie) for a new access token, rotating the refresh token.
**Auth required:** Refresh token cookie only (no access token needed — this is how you get a new one).

**Response `200 OK`:**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "expiresIn": 900 } }
```
**Errors:** `401 Unauthorized` (`REFRESH_TOKEN_INVALID_OR_EXPIRED`).

---

### `POST /auth/logout`
**Purpose:** Revoke the current refresh token, ending the session.
**Auth required:** Yes
**Response:** `204 No Content`

---

### `POST /auth/forgot-password`
**Purpose:** Trigger a password reset email.
**Auth required:** No
**Request body:** `{ "email": "aditi@example.com" }`
**Response:** `200 OK` — **always** returns success regardless of whether the email exists, to prevent account enumeration:
```json
{ "success": true, "data": { "message": "If an account exists for this email, a reset link has been sent." } }
```

### `POST /auth/reset-password`
**Purpose:** Complete a password reset using the emailed token.
**Auth required:** No
**Request body:** `{ "token": "raw-reset-token", "newPassword": "NewSecurePass456!" }`
**Response `200 OK`:** confirmation message.
**Errors:** `422 Unprocessable Entity` (`RESET_TOKEN_INVALID_OR_EXPIRED`).

---

## 6. User / Profile Endpoints

### `GET /users/me`
**Purpose:** Fetch the authenticated user's profile (used by Settings page, Section 3.9 of blueprint).
**Auth required:** Yes
**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "Aditi Sharma", "email": "aditi@example.com",
    "emailVerified": true, "createdAt": "2026-01-10T08:00:00Z"
  }
}
```

### `PATCH /users/me`
**Purpose:** Update name and/or email.
**Auth required:** Yes
**Request body (any subset):** `{ "name": "New Name", "email": "new@example.com" }`
**Validation:** same rules as signup; email uniqueness re-checked.
**Response `200 OK`:** updated user object.
**Errors:** `409 Conflict` if new email already taken.

### `POST /users/me/change-password`
**Purpose:** Change password while logged in (distinct from the forgot-password flow — requires current password).
**Auth required:** Yes
**Request body:** `{ "currentPassword": "...", "newPassword": "..." }`
**Response `200 OK`.** Side effect: revokes all other refresh tokens for this user (forces logout on other devices).
**Errors:** `401 Unauthorized` (`CURRENT_PASSWORD_INCORRECT`).

### `DELETE /users/me`
**Purpose:** Soft-delete the account (sets `users.deleted_at`), cascading logical deletion of resumes.
**Auth required:** Yes
**Request body:** `{ "password": "..." }` (re-confirmation required for a destructive action).
**Response:** `204 No Content`.

---

## 7. Template Endpoints

### `GET /templates`
**Purpose:** List all active, ATS-safe templates for the template picker (blueprint Section 3.5).
**Auth required:** Yes
**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "slug": "classic-single-column", "name": "Classic Professional", "isAtsSafe": true }
  ]
}
```
*(No pagination — this is a small, mostly-static list.)*

---

## 8. Resume Endpoints

### `GET /resumes`
**Purpose:** List all of the authenticated user's resumes for the dashboard (blueprint Section 3.2).
**Auth required:** Yes

**Query parameters (filtering, sorting, pagination):**
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 1 | 1-indexed |
| `pageSize` | integer | 20 | max 50 |
| `sortBy` | enum: `updatedAt`, `createdAt`, `title` | `updatedAt` | |
| `sortOrder` | enum: `asc`, `desc` | `desc` | |
| `archived` | boolean | `false` | filter archived vs active resumes |
| `search` | string | — | matches against `title` and `target_role` (case-insensitive `ILIKE`) |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "title": "Backend Internship Resume", "targetRole": "Backend Internship",
      "templateId": 1, "atsScore": 82, "isArchived": false,
      "updatedAt": "2026-07-10T14:22:00Z", "createdAt": "2026-06-01T09:00:00Z"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 4, "totalPages": 1 }
  }
}
```
*(Note: list responses return resume metadata only, not the full `content` JSONB, to keep dashboard payloads light — full content is fetched via the detail endpoint below.)*

---

### `POST /resumes`
**Purpose:** Create a new resume — either blank or duplicated from an existing one (blueprint Section 3.2/3.3).
**Auth required:** Yes

**Request body:**
```json
{
  "title": "Frontend Role Resume",
  "templateId": 1,
  "targetRole": "Frontend Engineer",
  "duplicateFromResumeId": null
}
```
**Validation rules:**
- `title`: required, 1–150 chars.
- `templateId`: required, must reference an existing, active template.
- `targetRole`: optional, max 120 chars.
- `duplicateFromResumeId`: optional UUID; if provided, must reference a resume owned by the requester — its `content` is deep-copied into the new resume.

**Response `201 Created`:** full resume object including `content`.
**Errors:** `404 Not Found` if `duplicateFromResumeId` doesn't belong to the user; `422` if `templateId` invalid/inactive.

---

### `GET /resumes/{resumeId}`
**Purpose:** Fetch a single resume's full content for the editor (blueprint Section 3.4).
**Auth required:** Yes (must own the resume)
**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "title": "...", "templateId": 1, "targetRole": "...",
    "content": { "personalInfo": {...}, "summary": "...", "experience": [...], "education": [...], "projects": [...], "skills": {...}, "certifications": [...], "achievements": [...] },
    "atsScore": 82, "isArchived": false,
    "createdAt": "...", "updatedAt": "..."
  }
}
```
**Errors:** `404 Not Found` (not found OR not owned by requester — see Section 4 note).

---

### `PATCH /resumes/{resumeId}`
**Purpose:** Partial update — used for autosave, title rename, target role change, template switch, and section content edits (blueprint Section 3.4/3.6).
**Auth required:** Yes (owner only)

**Request body (any subset):**
```json
{
  "title": "Updated Title",
  "templateId": 2,
  "content": { "summary": "Updated summary text..." }
}
```
**Validation rules:**
- `content`, if provided, is validated against the fixed resume-content schema (section names, field types, bullet arrays) at the application layer before being written to the JSONB column — matches the schema design's stated validation strategy.
- `templateId`, if provided, must be an existing active template.
- Partial `content` updates are merged (deep-merge) server-side rather than requiring the client to resend the entire content blob on every autosave keystroke-batch — reduces payload size and race-condition risk on rapid successive saves.

**Response `200 OK`:** updated resume object (full, so the frontend can reconcile state after merge).
**Errors:** `422 Unprocessable Entity` with field-level `details` if `content` fails schema validation.

---

### `DELETE /resumes/{resumeId}`
**Purpose:** Soft-delete a resume (sets `deleted_at`), removing it from the dashboard.
**Auth required:** Yes (owner only)
**Response:** `204 No Content`.

---

### `POST /resumes/{resumeId}/archive`
**Purpose:** Archive/unarchive a resume without deleting it (toggle `is_archived`) — separate from delete to keep the two actions unambiguous in the API surface.
**Auth required:** Yes (owner only)
**Request body:** `{ "archived": true }`
**Response `200 OK`:** updated resume object.

---

### `POST /resumes/{resumeId}/duplicate`
**Purpose:** Explicit duplicate action from the dashboard (functionally an alternate entry point to the same logic as `POST /resumes` with `duplicateFromResumeId`, exposed as its own endpoint for a clearer dashboard "Duplicate" button integration).
**Auth required:** Yes (owner only)
**Request body:** `{ "title": "Copy of Backend Internship Resume" }` *(optional override; defaults to `"{original title} (Copy)"`)*
**Response `201 Created`:** the new resume object.

---

## 9. ATS Checker Endpoint

### `POST /resumes/{resumeId}/ats-check`
**Purpose:** Run the rule-based ATS compatibility checklist (blueprint Section 3.8) against the resume's current content and persist the resulting score.
**Auth required:** Yes (owner only)
**Request body:** `{ "jobDescription": "optional pasted JD text for keyword density comparison" }`
**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "atsScore": 78,
    "checklist": [
      { "rule": "CONTACT_INFO_PRESENT", "passed": true },
      { "rule": "SKILLS_SECTION_PRESENT", "passed": true },
      { "rule": "CONSISTENT_DATE_FORMAT", "passed": false, "message": "Some entries use 'Jan 2024' and others use '01/2024'." },
      { "rule": "BULLET_LENGTH", "passed": true }
    ],
    "missingKeywords": ["Docker", "CI/CD"]
  }
}
```
*(`missingKeywords` present only when `jobDescription` was supplied.)* This endpoint also updates `resumes.ats_score` so the cached value shown on the dashboard stays current.

---

## 10. AI Endpoints

All AI endpoints proxy to the Gemini API server-side (blueprint Section 5 — key never reaches the client) and write an audit row to `ai_suggestion_logs`. They are **rate-limited** (Section 12) and return `503 Service Unavailable` with a clear error if the upstream Gemini API is unreachable, rather than a generic `500`, so the frontend can distinguish "AI is temporarily down, core editor still works" from a real server bug.

### `POST /ai/bullet-improve`
**Purpose:** Improve a single bullet point's phrasing, action verbs, and quantification (blueprint Section 3.7).
**Auth required:** Yes

**Request body:**
```json
{
  "resumeId": "uuid",
  "context": { "role": "Software Engineering Intern", "company": "TechCorp" },
  "bulletText": "worked on backend features"
}
```
**Validation:** `bulletText` required, 5–500 chars; `resumeId` must belong to requester (used for audit logging, not required to be currently open in the editor).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "suggestionId": "log-row-id",
    "original": "worked on backend features",
    "suggestion": "Developed and shipped 4 backend REST API features, reducing average response latency by 15%.",
    "disclaimer": "AI-generated — review before use."
  }
}
```
**Errors:** `429 Too Many Requests` (`AI_RATE_LIMIT_EXCEEDED`), `503 Service Unavailable` (`AI_SERVICE_UNAVAILABLE`).

---

### `POST /ai/summary-generate`
**Purpose:** Generate a draft professional summary from the resume's existing experience/skills content.
**Auth required:** Yes
**Request body:** `{ "resumeId": "uuid" }` *(pulls current `content` server-side — no need for the client to resend the whole resume)*
**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "suggestionId": "log-row-id",
    "suggestion": "Motivated final-year Computer Science student with hands-on experience building full-stack web applications...",
    "disclaimer": "AI-generated — review before use."
  }
}
```

---

### `POST /ai/keyword-match`
**Purpose:** Compare resume content against a pasted job description and suggest missing keywords/skills (blueprint Section 3.7, v1.1 feature).
**Auth required:** Yes
**Request body:** `{ "resumeId": "uuid", "jobDescription": "Full JD text..." }`
**Validation:** `jobDescription` required, 50–10,000 chars.
**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "suggestionId": "log-row-id",
    "matchedKeywords": ["Python", "REST APIs", "Git"],
    "missingKeywords": ["Docker", "Kubernetes", "CI/CD"],
    "disclaimer": "Suggestions require your confirmation — do not add skills you don't actually have."
  }
}
```

---

### `POST /ai/suggestions/{suggestionId}/feedback`
**Purpose:** Record whether the user accepted or rejected an AI suggestion (updates `ai_suggestion_logs.was_accepted`) — feeds prompt-quality analytics per the schema design's stated purpose for this table.
**Auth required:** Yes
**Request body:** `{ "accepted": true }`
**Response:** `204 No Content`.

---

## 11. Export / File Download Endpoints

### `POST /resumes/{resumeId}/export/pdf`
**Purpose:** Generate a PDF from the resume's current content + selected template (blueprint Section 3.6). Generation is synchronous for typical resume sizes (target: under 3 seconds per the blueprint's NFRs); returns a short-lived download URL rather than the binary directly, so the same generated file can be re-fetched without re-rendering if the client retries.
**Auth required:** Yes (owner only)
**Response `202 Accepted`** *(chosen over 200, since generation may take a moment and the response is a pointer to the result, not the result itself):*
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "ready",
    "downloadUrl": "https://api.airesumebuilder.com/api/v1/resumes/{resumeId}/export/pdf/{exportId}/download",
    "expiresAt": "2026-07-12T11:00:00Z"
  }
}
```

### `GET /resumes/{resumeId}/export/pdf/{exportId}/download`
**Purpose:** Stream the actual generated PDF binary.
**Auth required:** Yes (owner only)
**Response `200 OK`:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="Aditi_Sharma_Resume.pdf"`, binary body.
**Errors:** `404 Not Found` if `exportId` doesn't exist or has expired (download URLs are short-lived, e.g., 1 hour, and not persisted long-term — resumes can always be re-exported on demand).

---

## 12. Rate Limiting

| Scope | Limit | Applies To |
|---|---|---|
| Global (per user, authenticated) | 300 requests / 5 minutes | All `/api/v1/*` endpoints |
| Login attempts (per IP + email combo) | 5 attempts / 15 minutes | `POST /auth/login` |
| AI endpoints (per user) | 20 requests / hour | `/ai/*` |
| PDF export (per user) | 30 requests / hour | `/resumes/*/export/pdf` |

Rate limit responses use `429 Too Many Requests` with headers:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1752312000
```
AI rate limiting is enforced by querying `ai_suggestion_logs` for `COUNT(*) WHERE user_id = ? AND created_at > now() - interval '1 hour'`, backed by the `idx_ai_logs_user_created` index from the schema design — this is also why that index exists.

---

## 13. Validation & Error Response Details

All `422` responses follow a consistent shape so the frontend can map errors to specific form fields:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "details": [
      { "field": "content.experience[0].bullets[2]", "issue": "exceeds maximum length of 300 characters" },
      { "field": "templateId", "issue": "no active template with this id exists" }
    ]
  }
}
```
JSONPath-style `field` values (e.g., `content.experience[0].bullets[2]`) are used for nested `content` validation errors so the frontend editor can highlight the exact offending bullet.

**Common error codes used throughout the API:**
| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Field-level validation failure |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired token |
| `FORBIDDEN` | 403 | Authenticated but not authorized (rare — see 404-instead-of-403 note) |
| `NOT_FOUND` | 404 | Resource missing or not owned by requester |
| `EMAIL_ALREADY_EXISTS` | 409 | Signup/email-change conflict |
| `AI_RATE_LIMIT_EXCEEDED` | 429 | AI endpoint quota hit |
| `AI_SERVICE_UNAVAILABLE` | 503 | Gemini API unreachable |
| `INTERNAL_ERROR` | 500 | Unexpected server fault |

---

## 14. OpenAPI-Style Summary Table

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/signup` | Register + auto-login | No |
| POST | `/auth/login` | Log in | No |
| POST | `/auth/refresh` | Rotate access token | Refresh cookie |
| POST | `/auth/logout` | Revoke session | Yes |
| POST | `/auth/forgot-password` | Request reset email | No |
| POST | `/auth/reset-password` | Complete reset | No |
| GET | `/users/me` | Get profile | Yes |
| PATCH | `/users/me` | Update profile | Yes |
| POST | `/users/me/change-password` | Change password | Yes |
| DELETE | `/users/me` | Delete account | Yes |
| GET | `/templates` | List templates | Yes |
| GET | `/resumes` | List resumes (paginated/filtered/sorted) | Yes |
| POST | `/resumes` | Create/duplicate resume | Yes |
| GET | `/resumes/{resumeId}` | Get full resume | Yes |
| PATCH | `/resumes/{resumeId}` | Update resume (autosave) | Yes |
| DELETE | `/resumes/{resumeId}` | Soft-delete resume | Yes |
| POST | `/resumes/{resumeId}/archive` | Archive/unarchive | Yes |
| POST | `/resumes/{resumeId}/duplicate` | Duplicate resume | Yes |
| POST | `/resumes/{resumeId}/ats-check` | Run ATS checklist | Yes |
| POST | `/ai/bullet-improve` | AI bullet rewrite | Yes |
| POST | `/ai/summary-generate` | AI summary draft | Yes |
| POST | `/ai/keyword-match` | AI JD keyword match | Yes |
| POST | `/ai/suggestions/{suggestionId}/feedback` | Record accept/reject | Yes |
| POST | `/resumes/{resumeId}/export/pdf` | Trigger PDF generation | Yes |
| GET | `/resumes/{resumeId}/export/pdf/{exportId}/download` | Download PDF binary | Yes |

*(A full OpenAPI 3.0 YAML/JSON document mirroring this table — with complete schemas, examples, and security definitions — would be the natural next artifact once implementation begins, generated/maintained alongside the Flask app via `flask-smorest` or `apispec`, per the blueprint's documentation strategy in Section 9.)*

---

## 15. Design Notes Tying Back to the Blueprint & Schema

- Every endpoint that touches `resumes` scopes its query by the authenticated `user_id`, enforcing the ownership model from the schema's foreign keys at the API layer too (defense in depth, not just a database constraint).
- The `PATCH /resumes/{resumeId}` deep-merge behavior directly supports the blueprint's autosave requirement (Section 1.7 NFRs — "autosave should not block UI") by minimizing payload size on frequent saves.
- AI endpoints' audit logging and rate-limit enforcement are the API-layer half of the `ai_suggestion_logs` table's stated purpose from the schema document — the table exists because these endpoints need it, not independently of them.
- The export flow's two-step (`POST` to generate, `GET` to download) design anticipates the blueprint's noted performance risk (Section 8 — "synchronous PDF generation blocking request threads") by making the response shape already compatible with a future move to async job processing (e.g., a background worker + polling or webhook) without a breaking API change — only the `status` field's possible values would expand (`processing` → `ready`).
