# POLARIS — FINAL MVP EXECUTION BLUEPRINT
## v3.1 → v3.4 Cursor-Native Implementation Plan (Supabase Edition)

> **Audience:** You + Cursor Composer.
> **Purpose:** Convert the v3.4 Consolidated Patch into an airtight, click-by-click execution sequence with zero ambiguity.
> **Anchor:** The 18-step Happy Path in §C is the North Star. Every prompt, schema, and audit item below exists to make those 18 steps bulletproof under demo conditions.
> **Mode of operation:** Build and validate in `PITCH_MODE=true` first. Hackathon mode is a follow-up.
> **Database:** Supabase PostgreSQL (cloud-hosted, Singapore region) — replaces the local Docker `db` service from v3.1.

---

## TABLE OF CONTENTS

- **PART A** — Master Schema (Single Source of Truth)
- **PART B** — Feature Delta Map (v3.1 → v3.4)
- **PART C** — Happy Path Demo Script (Click-by-click, technical walkthrough)
- **PART D** — Cursor Composer Golden Prompts (Phase A → D, copy-paste ready)
- **PART E** — Red-Team Stability Audit (Failure modes + preventive code)
- **APPENDIX** — Environment, build commands, smoke tests, collaboration protocol, missing inputs

---

## INFRASTRUCTURE — SUPABASE + ENVIRONMENT SETUP

### Tech Stack

| Component | Technology |
|---|---|
| Database | Supabase PostgreSQL (cloud-hosted, Singapore region) |
| ORM | SQLAlchemy 2.0 (async), connecting via Supabase transaction pooler (port 6543) |
| Backend | FastAPI, Pydantic v2 |
| Frontend | React, Tailwind, Recharts, Leaflet |
| LLM | Gemini (bypassed in PITCH_MODE) |
| Forms | openpyxl |

### Environment Variables

Both teammates create a `.env` file at project root (gitignored):

```env
# ── Supabase ──────────────────────────────────────────────────
# Transaction pooler — used by FastAPI/SQLAlchemy at runtime
DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Direct connection — used for migrations, psql, one-off scripts
DATABASE_URL_DIRECT=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# ── POLARIS ───────────────────────────────────────────────────
POLARIS_PITCH_MODE=true
VITE_PITCH_MODE=true

# ── Gemini (only needed when PITCH_MODE=false) ────────────────
GOOGLE_GEMINI_API_KEY=
```

**Replace** `[PROJECT_REF]` and `[PASSWORD]` with your actual Supabase project reference and DB password from **Supabase Dashboard → Settings → Database → Connection string → URI**.

#### Connection string rules

| Use case | Env var | Port | Why |
|---|---|---|---|
| FastAPI runtime (SQLAlchemy async) | `DATABASE_URL` | 6543 | Transaction pooler — handles connection reuse, prevents exhaustion |
| Migrations / psql / seed scripts | `DATABASE_URL_DIRECT` | 5432 | Direct connection — DDL needs session-level features the pooler strips |
| Supabase Dashboard SQL Editor | n/a | Browser | Quick visual queries, no setup needed |

### `docker-compose.yml`

```yaml
services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    env_file:
      - .env                              # reads DATABASE_URL from .env
    environment:
      POLARIS_PITCH_MODE: ${POLARIS_PITCH_MODE:-true}
    volumes:
      - polaris_generated:/var/polaris/generated

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_PITCH_MODE: ${VITE_PITCH_MODE:-true}

volumes:
  polaris_generated:
```

> **Key change from v3.1:** The `db` service and `pgdata` volume are removed. `api` no longer has `depends_on: [db]`. It reads `DATABASE_URL` from `.env` and connects to Supabase on startup.

### `api/main.py` — Connection String

The SQLAlchemy engine creation must use the `DATABASE_URL` env var (which now points to Supabase):

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,       # detects dead connections (Supabase cold start)
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,          # recycle connections every 5 min
)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

> If the v3.1 code hardcodes `postgresql+asyncpg://polaris:polaris@db:5432/polaris`, replace it with `os.environ["DATABASE_URL"]`. That's the only code change needed — SQLAlchemy doesn't care if Postgres is local or cloud.

---

# PART A — MASTER SCHEMA

> **Purpose:** Eliminate AI drift. Every component, hook, endpoint handler, and Pydantic model must conform to these types verbatim.
> **Location:** Mirror these into `frontend/src/types/polaris.ts` (TypeScript) and `api/schemas/*.py` (Pydantic). Every PR / Cursor Composer call must reference this file.

## A.1 — Core Domain Types

```typescript
// frontend/src/types/polaris.ts
// THE source of truth. Do not redefine these locally in components.

// ─────────────────────────────────────────────────────────────
// Region (unchanged from v3.1; included for completeness)
// ─────────────────────────────────────────────────────────────
export type TrafficLight = "green" | "yellow" | "red";

export interface RegionalScore {
  region: string;                          // e.g. "Region VIII"
  region_code: string;                     // e.g. "R8" (used in filenames)
  underserved_score: number;               // 0–100
  traffic_light: TrafficLight;
  supply_subscore: number;                 // 0–100
  impact_subscore: number;                 // 0–100
  demand_subscore: number;                 // 0–100
  teacher_student_ratio: number;
  specialization_pct: number;
  star_coverage_pct: number;
  avg_nat_score: number;
  // PPST axes (used by STARBOT context + reports)
  ppst_content_knowledge: number;
  ppst_curriculum_planning: number;
  ppst_research_based_practice: number;
  ppst_assessment_literacy: number;
  ppst_professional_development: number;
  // Demand
  demand_signal_count: number;
  // Critical pings (pre-computed)
  critical_pings?: CriticalPing[];
}

export interface CriticalPing {
  region: string;
  severity: "CRITICAL" | "WARNING" | "GAP";
  message: string;
}

// ─────────────────────────────────────────────────────────────
// STARBOT (simplified — query-only)
// ─────────────────────────────────────────────────────────────
export interface ChatRequest {
  message: string;                         // max 500 chars
  region_context: RegionalScore | null;
}

export interface ChatResponse {
  response: string;                        // markdown-formatted
  sources: string[];                       // e.g. ["POLARIS regional_scores — Region VIII"]
}

// ─────────────────────────────────────────────────────────────
// Report Generator
// ─────────────────────────────────────────────────────────────
export type ReportType =
  | "quarterly_performance"
  | "intervention_priority"
  | "executive_summary";

export interface ReportGenerateRequest {
  region: string;                          // must match RegionalScore.region
  report_type: ReportType;
}

export interface ReportGenerateResponse {
  markdown: string;
  filename: string;                        // e.g. "Quarterly_Report_R8.md"
  generated_at: string;                    // ISO 8601
}

// ─────────────────────────────────────────────────────────────
// Profile Extended (Tier 1)
// ─────────────────────────────────────────────────────────────
export type Sex = "Male" | "Female";
export type CivilStatus = "Single" | "Married" | "Separated" | "Widowed";

export interface ProfileExtended {
  deped_id: string;
  // Identity
  name_extension: string | null;           // "JR.", "SR.", "III"
  sex: Sex | null;
  date_of_birth: string | null;            // ISO date
  civil_status: CivilStatus | null;
  // Unmapped Tier 1 (collected, not yet written to PDS)
  place_of_birth: string | null;
  citizenship: string | null;              // default "Filipino"
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  // Contact
  mobile_number: string | null;
  telephone_number: string | null;
  email: string | null;
  // Permanent Address (7 structured fields)
  addr_house_no: string | null;
  addr_street: string | null;
  addr_subdivision: string | null;
  addr_barangay: string | null;
  addr_city: string | null;
  addr_province: string | null;
  addr_zip: string | null;                 // 4 digits
  // Metadata
  completeness_score: number;              // 0–100, motivational
  last_verified_at: string | null;
  updated_at: string;
}

export type ProfileExtendedUpsert = Omit<
  ProfileExtended,
  "deped_id" | "completeness_score" | "last_verified_at" | "updated_at"
>;

// The 9 fields that gate sign-up (must all be non-null)
export const REQUIRED_FOR_SIGNUP: (keyof ProfileExtended)[] = [
  "sex", "date_of_birth", "civil_status",
  "mobile_number", "email",
  "addr_barangay", "addr_city", "addr_province", "addr_zip",
];

// ─────────────────────────────────────────────────────────────
// Training Events
// ─────────────────────────────────────────────────────────────
export type EventSpecificFieldType = "text" | "select";

export interface EventSpecificFieldDef {
  key: string;
  label: string;
  type: EventSpecificFieldType;
  required: boolean;
  max_length?: number;                     // for type=text
  options?: string[];                      // for type=select
}

export type FormKey = "pds" | "authority_to_travel" | "csc_form_6" | "school_clearance";

export interface TrainingEvent {
  id: number;
  program_id: number;
  program_name: string;                    // joined from programs
  subject_area: string;                    // joined from programs

  title: string;
  organizer: string;
  venue: string | null;
  venue_region: string | null;
  start_date: string;                      // ISO date
  end_date: string;                        // ISO date
  registration_deadline: string;           // ISO date

  is_star_partnered: boolean;
  funding_source: string | null;
  required_forms: FormKey[];
  event_specific_fields: EventSpecificFieldDef[];

  description: string | null;
  capacity: number | null;
  slots_remaining: number | null;
}

export interface RecommendedEvent extends TrainingEvent {
  reason_chip: string;                     // e.g. "Closes your Assessment Literacy gap"
  is_eligible: boolean;                    // teacher has eligible nomination
  nomination_id: number | null;
}

// ─────────────────────────────────────────────────────────────
// Event Registrations + Status Machine
// ─────────────────────────────────────────────────────────────
export type RegistrationStatus =
  | "draft"
  | "forms_generated"
  | "submitted"
  | "approved"
  | "attended"
  | "completed"
  | "cancelled";

export interface EventRegistration {
  id: number;
  teacher_id: string;
  event_id: number;
  status: RegistrationStatus;
  event_specific_answers: Record<string, string>;
  nomination_id: number | null;
  generated_pds_path: string | null;
  generated_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  next_action: string;
  created_at: string;
  updated_at: string;
}

// Joined view used by Home tab tracking
export interface ActiveRegistration {
  id: number;
  status: RegistrationStatus;
  next_action: string;
  event: Pick<TrainingEvent,
    "id" | "title" | "organizer" | "venue" | "start_date" | "end_date">;
  submitted_at: string | null;
  approved_at: string | null;
  generated_at: string | null;
}

// ─────────────────────────────────────────────────────────────
// Sign-Up Flow Requests / Responses
// ─────────────────────────────────────────────────────────────
export interface RegisterEventRequest {
  deped_id: string;
  event_specific_answers: Record<string, string>;
}

export interface VerifyResponse {
  verified_at: string;
}

export interface GeneratePDSResponse {
  download_url: string;                    // /downloads/{reg_id}_pds.xlsx
  preview_image_url: string;               // /static/forms/demo_pds_preview.png
  generated_at: string;
  registration: EventRegistration;
}

export interface StatusPatchRequest {
  status: RegistrationStatus;
}

// ─────────────────────────────────────────────────────────────
// Allowed status transitions (enforce both client + server side)
// ─────────────────────────────────────────────────────────────
export const ALLOWED_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  draft:           ["forms_generated", "cancelled"],
  forms_generated: ["submitted", "cancelled"],
  submitted:       ["approved", "cancelled"],
  approved:        ["attended", "cancelled"],
  attended:        ["completed"],
  completed:       [],
  cancelled:       [],
};
```

## A.2 — Pydantic Mirror (Backend)

> **Rule:** Every TS interface above has a 1:1 Pydantic v2 model. Field names match exactly. Use `Literal` for the enums (`Sex`, `CivilStatus`, `RegistrationStatus`, `ReportType`).

| TS Interface | Pydantic File | Class Name |
|---|---|---|
| `ChatRequest`/`ChatResponse` | `api/schemas/chat.py` | `ChatRequest`, `ChatResponse` |
| `ReportGenerateRequest`/`Response` | `api/schemas/reports.py` | `ReportGenerateRequest`, `ReportGenerateResponse` |
| `ProfileExtendedUpsert` | `api/schemas/profile_extended.py` | `ProfileExtendedUpsert` |
| `TrainingEvent`, `RecommendedEvent` | `api/schemas/events.py` | `TrainingEventOut`, `RecommendedEventOut` |
| `EventRegistration`, `ActiveRegistration` | `api/schemas/registrations.py` | `RegistrationOut`, `ActiveRegistrationOut` |
| `RegisterEventRequest` | `api/schemas/registrations.py` | `RegisterEventRequest` |
| `GeneratePDSResponse` | `api/schemas/registrations.py` | `GeneratePDSResponse` |

## A.3 — `next_action` Computation Table

Server-side, recomputed on every status transition. Frontend never invents this string.

| Status | `next_action` |
|---|---|
| `draft` | `"Complete sign-up to generate your forms"` |
| `forms_generated` | `"Get school head signature on your PDS"` |
| `submitted` | `"Waiting for division approval"` |
| `approved` | `"Prepare for {event_title} on {start_date}"` |
| `attended` | `"Upload your certificate of appearance"` |
| `completed` | `"All done"` |
| `cancelled` | `"Cancelled"` |

## A.4 — PITCH_MODE Contract

| Layer | Var | Type | Default | Read where |
|---|---|---|---|---|
| Backend | `POLARIS_PITCH_MODE` | `"true"`/`"false"` string | `"false"` | `api/main.py` startup → `app.state.pitch_mode: bool` |
| Frontend | `VITE_PITCH_MODE` | `"true"`/`"false"` string | `"false"` | `import.meta.env.VITE_PITCH_MODE === 'true'` |

**Affects:** `POST /chat`, `POST /reports/generate`, `POST /registrations/{id}/generate-pds`
**Does NOT affect:** `POST /extract/document`, `POST /admin/process-*`, any read endpoint

---

# PART B — FEATURE DELTA MAP (v3.1 → v3.4)

> **Read this as a build manifest.** Anything not listed here is **untouched**.

## B.1 — Database Layer

| # | Change | Type | File |
|---|---|---|---|
| DB1 | New ENUM `registration_status` (7 values) | ADD | `db/migrations/003_v34.sql` |
| DB2 | New table `teacher_profile_extended` (19 cols + metadata) | ADD | `003_v34.sql` |
| DB3 | New table `training_events` | ADD | `003_v34.sql` |
| DB4 | New table `event_registrations` (UNIQUE on teacher_id+event_id) | ADD | `003_v34.sql` |
| DB5 | Seed: extend `DEMO-001` profile to 100% complete | EDIT | `002_seed.sql` |
| DB6 | Seed: 1 eligible ISLA nomination for `DEMO-001` | EDIT | `002_seed.sql` |
| DB7 | Seed: 4 `training_events` rows | EDIT | `002_seed.sql` |
| DB8 | Seed: 2 in-flight `event_registrations` for `DEMO-001` (CBEP submitted, STAR Fellowship approved) | EDIT | `002_seed.sql` |

**Untouched:** all v3.1 tables (`schools`, `programs`, `teachers`, `trainings`, `outcomes`, `needs_signals`, `nominations`, `regional_scores`).

## B.2 — Backend (Python / FastAPI)

| # | Change | Type | File |
|---|---|---|---|
| BE1 | `chat.py`: remove draft routing, add `PITCH_RESPONSES` dict, drop `mode` field | REWRITE | `api/routers/chat.py` |
| BE2 | New router `reports.py` with `POST /reports/generate` | ADD | `api/routers/reports.py` |
| BE3 | New router `events.py` with `GET /events/recommended` | ADD | `api/routers/events.py` |
| BE4 | New router `registrations.py` (5 endpoints) | ADD | `api/routers/registrations.py` |
| BE5 | New router `downloads.py` with `GET /downloads/{filename}` (regex allowlist `^\d+_pds\.xlsx$`) | ADD | `api/routers/downloads.py` |
| BE6 | New router `profile_extended.py` with `POST /teachers/{id}/profile-extended` | ADD | `api/routers/profile_extended.py` |
| BE7 | `main.py`: read `POLARIS_PITCH_MODE`, mount static, register new routers | EDIT | `api/main.py` |
| BE8 | Pydantic models per A.2 | ADD | `api/schemas/*.py` |
| BE9 | SQLAlchemy ORM models for 3 new tables | ADD | `api/models/profile_extended.py`, `training_event.py`, `event_registration.py` |
| BE10 | `profile_completeness.py`: `compute_completeness()`, `is_signup_eligible()` | ADD | `api/intel/profile_completeness.py` |
| BE11 | `report_bands.py`: numeric → band-label thresholds | ADD | `api/intel/report_bands.py` |
| BE12 | 3 report templates + recommendations module | ADD | `api/templates/reports/` |
| BE13 | Form generator (`openpyxl`) + cell mapping resolver | ADD | `api/intel/form_generator.py`, `api/intel/form_mappings/csc_form_212.py` |
| BE14 | Pre-baked demo assets committed to repo | ADD | `api/templates/forms/csc_form_212.xlsx`, `demo_pds_prefilled.xlsx`, `demo_pds_preview.png` |
| BE15 | `requirements.txt`: `+openpyxl==3.1.2` | EDIT | `requirements.txt` |

**Untouched:** `regions.py`, `teachers.py`, `trainings.py`, `intelligence.py`, `upload.py`, `extract.py`, `admin.py`, `llm_client.py`, `scoring.py`.

## B.3 — Frontend (React / Vite)

### B.3.1 — Coordinator Dashboard

| # | Change | Type | File |
|---|---|---|---|
| FE1 | `Sidebar.jsx`: enable `FileText` icon, route to `/reports` | EDIT | `src/components/dashboard/Sidebar.jsx` |
| FE2 | `Starbot.jsx`: remove draft-mode UI; add suggestion chips; remove `mode` from request | EDIT | `src/components/starbot/Starbot.jsx` |
| FE3 | New `StreamingResponse.jsx` (fake stream at ~30 chars/s) | ADD | `src/components/starbot/StreamingResponse.jsx` |
| FE4 | New page `ReportGenerator.jsx` at route `/reports` | ADD | `src/pages/ReportGenerator.jsx` |
| FE5 | New components: `ReportConfigPanel`, `ReportPreviewPanel`, `ReportTypeCard` | ADD | `src/components/reports/` |
| FE6 | Router: register `/reports` route in app shell | EDIT | `src/App.jsx` (or wherever router lives) |

### B.3.2 — Teacher App (POLARIS-ME)

| # | Change | Type | File |
|---|---|---|---|
| FE7 | Home tab: restructure — tracking on top, Skill Radar middle | REWRITE | `src/pages/teacher/HomeTab.jsx` (or equivalent) |
| FE8 | New `ActiveRegistrationsList.jsx` + `ActiveRegistrationCard.jsx` | ADD | `src/components/teacher/` |
| FE9 | New hook `useActiveRegistrations.js` | ADD | `src/hooks/useActiveRegistrations.js` |
| FE10 | Training tab Recommended view: data source → `/events/recommended`, CTA → "Sign Up"/"Check Eligibility" | EDIT | `src/components/teacher/RecommendedView.jsx` (or equivalent) |
| FE11 | New hook `useRecommendedEvents.js` | ADD | `src/hooks/useRecommendedEvents.js` |
| FE12 | New `EventCard.jsx` | ADD | `src/components/teacher/EventCard.jsx` |
| FE13 | New `Onboarding.jsx` (3-step) | ADD | `src/pages/teacher/Onboarding.jsx` |
| FE14 | New `SignUpFlow.jsx` (modal: profile preview + event-specific Qs + forms checklist) | ADD | `src/pages/teacher/SignUpFlow.jsx` |
| FE15 | New `VerifyInfo.jsx` (read-only grouped display + checkbox) | ADD | `src/pages/teacher/VerifyInfo.jsx` |
| FE16 | New `SignUpSuccess.jsx` (PNG preview + download) | ADD | `src/pages/teacher/SignUpSuccess.jsx` |
| FE17 | New `EventSpecificFields.jsx` (renders `event_specific_fields` JSONB schema) | ADD | `src/components/teacher/EventSpecificFields.jsx` |
| FE18 | New `ProfileInfoPreview.jsx` (grayed-out Tier 1 grid) | ADD | `src/components/teacher/ProfileInfoPreview.jsx` |
| FE19 | Login flow gate: if `is_signup_eligible(profile) === false` on first load → redirect to Onboarding | EDIT | `src/pages/TeacherApp.jsx` |
| FE20 | `.env`: add `VITE_PITCH_MODE` | EDIT | `frontend/.env` |

**Untouched:** Map canvas, lens selector, intelligence column, regional health card, detail views, profile sections A–D, settings, photo-to-form, eligibility engine, training history view.

## B.4 — Demo Assets (One-Time Bake)

| # | Asset | How |
|---|---|---|
| AS1 | `csc_form_212.xlsx` | Download from CSC website (Revised 2025), pin in repo |
| AS2 | `demo_pds_prefilled.xlsx` | Manually fill template with Sir Renato's seed values, save (do NOT Save As) |
| AS3 | `demo_pds_preview.png` | Screenshot Page 1 of filled file, crop to ~600px wide |

---

# PART C — HAPPY PATH DEMO SCRIPT (CLICK-BY-CLICK TECHNICAL WALKTHROUGH)

> **Watch this while demoing.** Every line is a state assertion. If any line doesn't match what's on screen, the demo is broken — stop and fix BEFORE recording.
> **Mode:** All steps below assume `PITCH_MODE=true`. The teardown after recording removes the flag for hackathon day.
> **Target runtime:** Under 90 seconds, end-to-end.

## SEGMENT 1 — Coordinator Dashboard (Maricris) [~45s]

### Step 1 — Cold Open: Dashboard Loads
- **URL:** `/`
- **Trigger:** Browser navigation
- **API calls:** `GET /regions/` + `GET /intelligence/national-skill-radar` (parallel, React Query)
- **Expected DOM after mount (~400ms):**
  - Sidebar: 3 icons visible — `LayoutDashboard` (active), `Users`, `FileText` (now enabled, no "Coming soon" tooltip)
  - Panel 1: PPST radar pentagon with teal + gold polygons rendered
  - Panel 1: Critical Pings feed shows ≥3 cards, sorted CRITICAL → WARNING → GAP
  - Panel 2: Leaflet map with all 17 region polygons colored under Overall lens
  - Panel 3: National Baseline Card with donut chart (3 segments) + 2×2 factor grid
- **Animation:** Panels fade in (Tailwind `animate-in fade-in duration-300`)
- **Failure mode:** If radar shows only one polygon, the `target` object is missing → check intelligence endpoint

### Step 2 — Click Critical Ping "Region VIII — Score: 42"
- **Trigger:** Click on the topmost CRITICAL ping card in Panel 1
- **State change:** `dashboardStore.activeRegion = "Region VIII"`
- **Expected sequence:**
  1. Map fly-to animation (Leaflet `flyTo`, ~800ms ease-in-out) to Region VIII centroid
  2. Region VIII polygon highlighted with stroke
  3. Panel 3 swaps from `NationalBaselineCard` → `RegionalHealthCard` (Framer Motion fade)
  4. Header strip renders: "Region VIII" + red traffic-light pill + score "42"
  5. Key Insight sentence renders **instantly** (rule-based, no API)
- **Expected text:** Key Insight references the worst factor (likely specialization or supply)
- **Failure mode:** Key Insight says "undefined" → `computeKeyInsight()` is reading wrong field path

### Step 3 — Tab 1: Summary (default)
- **Trigger:** None (default tab)
- **Expected DOM:** 4 Core Factors as a vertical labeled list, each with:
  - Raw value
  - National comparison arrow (`↓ 12% below national`)
  - YoY trend indicator (▲ ▼ —)

### Step 4 — Switch Map to Supply Lens
- **Trigger:** Click `Supply` in lens selector (Panel 2 top)
- **State change:** `dashboardStore.activeLens = "supply"`
- **Expected:** Map polygons recolor instantly (no network call — uses cached `GET /regions/`)
- **Region VIII still selected.** Panel 3 unchanged. Legend updates to "Supply Score (0–100)".

### Step 5 — Switch Map to Demand Lens
- **Trigger:** Click `Demand`
- **State change:** `activeLens = "demand"`
- **Expected:**
  - Map recolors with **inverted semantics** (high = red)
  - Legend text reads `"Red = High Unmet Demand"` in **red text** (`text-red-600`)
- **Failure mode:** If legend stays neutral color, the `activeLens === 'demand'` conditional in `LensSelector.jsx` is broken

### Step 6 — Detail Tab → Demand View
- **Trigger:** In Panel 3 Regional Health Card, click `Detail` tab → `Demand` button
- **API call:** `GET /regions/Region VIII/demand-signals` (or pulled from cached row)
- **Expected:** Horizontal Recharts BarChart, top training topics for Region VIII, sorted descending

### Step 7 — Detail Tab → Impact View
- **Trigger:** Click `Impact` button
- **Expected:** Recharts `ComposedChart` — bars (training counts) + line (NAT score) + scatter markers

### Step 8 — Open STARBOT, Click Suggestion Chip
- **Trigger:** Click STARBOT icon (lower-right floating)
- **Expected:** Chat box expands. Empty state shows two pill chips beneath input.
- **Trigger:** Click `💡 Biggest PPST gap here?`
- **Wire path:**
  ```
  Frontend: send "Which PPST domain has the biggest gap in this region?"
            with region_context = full Region VIII row from cache
  Backend (PITCH_MODE=true):
    1. Lowercase + strip incoming message
    2. Lookup in PITCH_RESPONSES dict — exact match
    3. Substitute fields from region_context
    4. await asyncio.sleep(0.6)
    5. Return { response, sources: ["POLARIS regional_scores — Region VIII"] }
  Frontend:
    1. StreamingResponse component receives full text
    2. setInterval, +3 chars / 15ms (~200 chars/sec, feels like fast typing)
    3. Cursor blink at end during stream
    4. Citation line renders below after stream completes
    5. Copy button visible
  ```
- **Expected text snippet:** "...the biggest gap is in **Assessment Literacy**, currently at 0.42 against a target of 0.80..."
- **Failure mode:** If response is the generic fallback, the `region_context` is null OR the chip strings don't exact-match the dict keys (case sensitivity, trailing whitespace)

### Step 9 — Close STARBOT, Click Reports Sidebar Icon
- **Trigger:** Dismiss STARBOT (× or click outside) → click `FileText` icon in sidebar
- **Navigation:** `/` → `/reports` (React Router NavLink)
- **Expected on Report Generator page:**
  - Page heading "REPORT GENERATOR" in display weight
  - "← Back to Dashboard" link above heading
  - Left column: Region dropdown **already defaulted to Region VIII** (carried from `dashboardStore.activeRegion`)
  - Left column: Three report type cards. **Quarterly Performance Report selected by default** (solid blue bg)
  - Right column: Filename placeholder + "FOR REVIEW — AI-GENERATED DRAFT" pink pill + empty preview area with placeholder text "Select a region and report type, then click Generate to preview your report."
- **Failure mode:** Region dropdown defaulting to first region in list → `dashboardStore.activeRegion` is null on this page → check that the store is global, not page-scoped

### Step 10 — Click Generate Report → Click Finalize and Export
- **Trigger:** Click `GENERATE REPORT` button
- **State:** Button shows spinner + text "Generating..." + disabled
- **API call:** `POST /reports/generate` body `{ region: "Region VIII", report_type: "quarterly_performance" }`
- **Backend (PITCH_MODE=true):**
  1. Load `api/templates/reports/quarterly_performance.md`
  2. Fetch `regional_scores` row for Region VIII
  3. Compute bands via `report_bands.py`
  4. Compute `key_insight` (reuse Regional Health Card logic)
  5. Pick `recommendations_block` from `recommendations.py` based on weakest factor
  6. `template.format_map(values)` → markdown
  7. `await asyncio.sleep(1.2)` (visible loading state)
  8. Return `{ markdown, filename: "Quarterly_Report_R8.md", generated_at }`
- **Expected after ~1.5s:**
  - Preview area fills with rendered markdown (monospace `<pre>`)
  - Filename updates from placeholder → `Quarterly_Report_R8.md`
  - Button returns to enabled state
- **Trigger:** Click `FINALIZE AND EXPORT` button (bottom-right)
- **Action:** `navigator.clipboard.writeText(markdown)` → toast `"Report copied to clipboard."`
- **Failure mode:** Clipboard API fails on insecure context (HTTP) → demo MUST be on HTTPS or `localhost`

## SEGMENT 2 — Teacher App (Sir Renato) [~45s]

### Step 11 — Navigate to POLARIS-ME, Login
- **URL:** `/teacher`
- **Login:** `deped_id = DEMO-001`, OTP = `123456` (hardcoded in pitch mode)
- **Post-login route check:**
  - Frontend calls `GET /teachers/DEMO-001/profile-extended`
  - `is_signup_eligible(profile)` → `true` (seeded at 100% complete)
  - Skip onboarding → land directly on `/teacher/home`
- **Failure mode:** If onboarding fires, the seed is broken → re-run `002_seed.sql`

### Step 12 — Home Tab Loads (Tracking on Top!)
- **API calls:** `GET /teachers/DEMO-001/active-registrations` + `GET /teachers/DEMO-001/profile` + `GET /teachers/DEMO-001/trainings` + `GET /intelligence/national-skill-radar`
- **Expected layout (top to bottom):**
  1. Header: "Kumusta, Renato!"
  2. **MY ACTIVE REGISTRATIONS** section (uppercase tracking-wider)
     - 2 cards stacked:
       - **CBEP Math Facilitators Workshop** — blue `submitted` pill — next action "Waiting for division approval" — `[Mark as Approved]` button
       - **STAR Fellowship Orientation 2026** — green `approved` pill — next action "Prepare for STAR Fellowship Orientation 2026 on {date}" — no button
  3. **SKILL RADAR** (pentagon, teal + gold)
  4. Training Nudge Card
  5. Needs Signal CTA
- **Failure mode:** Tracking section appears below Skill Radar → wrong order in `HomeTab.jsx`

### Step 13 — Tap CBEP Card → Detail Modal
- **Trigger:** Tap the CBEP card (NOT the button)
- **Expected:** Modal opens with full registration details + "Re-download PDS" link
- **Trigger:** Close modal

### Step 14 — Switch to Tab 3 Training → Recommended View
- **Trigger:** Tap `Training` in bottom nav → ensure `Recommended` pill-switcher selected
- **API call:** `GET /events/recommended?deped_id=DEMO-001&limit=10`
- **Expected ranking:** ISLA Cohort 12 at the top (program matches teacher's largest PPST gap axis)
- **Each card shows:**
  - Title bold
  - `ISLA` program badge
  - `STAR DOST` organizer
  - Dates + venue ("Tacloban City")
  - Subject area pill
  - Reason chip: e.g., `"Closes your Assessment Literacy gap"`
  - **Blue `Sign Up` button** (because `is_eligible: true` from seeded nomination)
  - **Red `Closes in 7 days` badge** (deadline within 7 days)
- **Failure mode:** Button says "Check Eligibility" → seeded nomination is missing or status ≠ 'eligible' → re-check seed §B.1 DB6

### Step 15 — Tap Sign Up → Sign-Up Flow Modal
- **Entry guards:**
  1. Card's `is_eligible === true` ✓
  2. `is_signup_eligible(profile) === true` ✓
- **Expected modal (full-screen, single scroll):**
  - Header: `× Sign up for ISLA Cohort 12`
  - Section 1: **📋 USING YOUR PROFILE INFO** — 7 grayed-out rows, lock icon at right of each
  - Section 2: **✍️ EVENT-SPECIFIC QUESTIONS** — 3 inputs from seed (`dietary_restrictions` text, `room_sharing` select Yes/No, `transportation` text/select)
  - Section 3: **📎 FORMS THAT WILL BE GENERATED**
    - ✓ Personal Data Sheet (CSC Form 212)
    - ○ Authority to Travel (coming soon)
    - ○ CSC Form 6 — Leave (coming soon)
- **Action during demo:** Type filler answers in the 3 event-specific fields (or pre-populate via form state for speed)
- **Trigger:** Click `CONTINUE TO VERIFY →`
- **API call:** `POST /events/123/register` body `{ deped_id, event_specific_answers }`
  - 200 → row created with `status='draft'`, `nomination_id` set
  - Frontend advances to Verify step

### Step 16 — Verify Step → Generate My PDS
- **Expected screen:** Read-only field grid grouped into:
  - PERSONAL INFORMATION (Full name, DOB, Sex, Civil status)
  - CONTACT (Mobile, Email)
  - PERMANENT ADDRESS (assembled into 4-line block)
  - EMPLOYMENT (Position, School)
- **Mandatory checkbox:** `☐ I confirm this information is accurate and up to date.`
- **Trigger:** Tap checkbox → `[GENERATE MY PDS]` button enables
- **Trigger:** Tap `GENERATE MY PDS`
- **API call sequence (sequential, not parallel):**
  1. `POST /registrations/{reg_id}/verify` → sets `last_verified_at = NOW()`
  2. On 200 → immediately `POST /registrations/{reg_id}/generate-pds`
- **Backend (PITCH_MODE=true):**
  1. Verify `last_verified_at` is within 1 hour ✓ (just set)
  2. `await asyncio.sleep(1.2)`
  3. `shutil.copy("api/templates/forms/demo_pds_prefilled.xlsx", f"{OUTPUT_DIR}/{reg_id}_pds.xlsx")`
  4. UPDATE `event_registrations` SET `status='forms_generated'`, `generated_pds_path`, `generated_at`, `next_action`
  5. Return `{ download_url, preview_image_url, generated_at, registration }`

### Step 17 — Success Screen → Download
- **Expected:**
  - Large checkmark + heading "You're signed up!"
  - Subtext "Your Personal Data Sheet is ready."
  - **Inline PNG preview** (`<img src="/static/forms/demo_pds_preview.png">`) — `rounded-lg border shadow-sm w-full max-w-md`
  - Caption "↓ Showing first page"
  - Filename row: `📊 Renato_DelaCruz_PDS.xlsx`
  - **`[DOWNLOAD EXCEL FILE]`** primary button
  - "NEXT STEPS" numbered list (4 items, includes legal-size paper note)
  - `[Back to Home]` link
- **Trigger:** Click DOWNLOAD EXCEL FILE → browser triggers download from `/downloads/{reg_id}_pds.xlsx`
- **File opens in Excel/Sheets/Files** depending on device
- **Failure mode:** PNG doesn't render → static mount missing in `main.py` → check `app.mount("/static", StaticFiles(directory="api/static"))`

### Step 18 — Back to Home → Three Tracking Cards
- **Trigger:** Tap `Back to Home`
- **Navigation:** `/teacher/home`
- **Expected:** `MY ACTIVE REGISTRATIONS` now shows **THREE** cards:
  1. **ISLA Cohort 12** (NEW) — amber `forms_generated` pill — "Get school head signature on your PDS" — `[Mark as Submitted]` button
  2. CBEP — submitted (existing)
  3. STAR Fellowship — approved (existing)
- **Card order:** by `start_date ASC`, limit 3
- **Failure mode:** ISLA card doesn't appear → React Query cache stale → ensure mutation invalidates `useActiveRegistrations` query key

### Demo Closer (no click — just narration)
> "End-to-end loop. From AI-detected critical region, to data-driven report, to teacher empowerment, to a printable government form. POLARIS closes the loop."

---

# PART D — CURSOR COMPOSER GOLDEN PROMPTS

> **How to use:** Each prompt is self-contained. Open Cursor Composer, paste, and let it work. Always have `POLARIS_FINAL_EXECUTION_BLUEPRINT.md` open in the editor as additional context, and reference Part A explicitly with `@POLARIS_FINAL_EXECUTION_BLUEPRINT.md` in the prompt.
> **Order:** Strict. Phase A → B → C → D. Do not skip ahead. Each phase has a verification step before moving on.

---

## PHASE A — FOUNDATION (No UI work yet)

### 🟦 PROMPT A.1 — Database Migration

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create the v3.4 database migration file at db/migrations/003_v34_module4_and_starbot.sql.

Requirements (from Part B §B.1, items DB1–DB4):

1. CREATE TYPE registration_status as an ENUM with these 7 values in this order:
   'draft', 'forms_generated', 'submitted', 'approved', 'attended', 'completed', 'cancelled'

2. CREATE TABLE teacher_profile_extended with this exact schema:
   - deped_id VARCHAR(30) PRIMARY KEY REFERENCES teachers(deped_id) ON DELETE CASCADE
   - name_extension VARCHAR(10) NULL
   - sex VARCHAR(10) CHECK (sex IS NULL OR sex IN ('Male', 'Female'))
   - date_of_birth DATE NULL
   - civil_status VARCHAR(20) CHECK (civil_status IS NULL OR civil_status IN ('Single', 'Married', 'Separated', 'Widowed'))
   - place_of_birth VARCHAR(255), citizenship VARCHAR(50) DEFAULT 'Filipino'
   - height_cm NUMERIC(5,2), weight_kg NUMERIC(5,2), blood_type VARCHAR(5)
   - mobile_number VARCHAR(20), telephone_number VARCHAR(20), email VARCHAR(100)
   - 7 address fields: addr_house_no VARCHAR(50), addr_street VARCHAR(100), addr_subdivision VARCHAR(100), addr_barangay VARCHAR(100), addr_city VARCHAR(100), addr_province VARCHAR(100), addr_zip VARCHAR(10)
   - completeness_score SMALLINT NOT NULL DEFAULT 0 CHECK (BETWEEN 0 AND 100)
   - last_verified_at TIMESTAMPTZ
   - updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - INDEX on last_verified_at

3. CREATE TABLE training_events:
   - id SERIAL PRIMARY KEY
   - program_id INT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT
   - title, organizer VARCHAR(255) NOT NULL
   - venue, venue_region VARCHAR
   - start_date, end_date DATE NOT NULL with CHECK end_date >= start_date
   - registration_deadline DATE NOT NULL
   - is_star_partnered BOOL NOT NULL DEFAULT FALSE
   - funding_source VARCHAR(50)
   - required_forms JSONB NOT NULL DEFAULT '["pds"]'
   - event_specific_fields JSONB NOT NULL DEFAULT '[]'
   - description TEXT, capacity INT, slots_remaining INT
   - created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - INDEXES on program_id, start_date, is_star_partnered, registration_deadline

4. CREATE TABLE event_registrations:
   - id SERIAL PRIMARY KEY
   - teacher_id VARCHAR(30) NOT NULL REFERENCES teachers(deped_id) ON DELETE CASCADE
   - event_id INT NOT NULL REFERENCES training_events(id) ON DELETE RESTRICT
   - status registration_status NOT NULL DEFAULT 'draft'
   - event_specific_answers JSONB NOT NULL DEFAULT '{}'
   - nomination_id INT REFERENCES nominations(id)
   - generated_pds_path TEXT
   - generated_at, submitted_at, approved_at, attended_at, cancelled_at TIMESTAMPTZ
   - next_action VARCHAR(100)
   - created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - UNIQUE (teacher_id, event_id)
   - INDEXES on teacher_id, event_id, status

The migration must be additive only — do not drop or alter any v3.1 tables. After creating, output a verification snippet showing what `\dt` should reveal.
```

### 🟦 PROMPT A.2 — Seed Data Extension

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Extend db/migrations/002_seed.sql with v3.4 seed data per Part B §B.1 items DB5–DB8 and Part C Step 12 (the Home tab tracking demo state).

Add the following INSERT blocks AFTER the existing v3.1 seed inserts:

1. ONE row in teacher_profile_extended for deped_id='DEMO-001':
   - name_extension NULL
   - sex 'Male', date_of_birth '1982-03-15', civil_status 'Married'
   - place_of_birth 'Tacloban City, Leyte', citizenship 'Filipino'
   - height_cm 168, weight_kg 70, blood_type 'O+'
   - mobile_number '09171234567', telephone_number NULL, email 'renato.delacruz@deped.gov.ph'
   - addr_house_no 'Lot 4 Block 12', addr_street 'Mabini Street', addr_subdivision 'Phase 2 Subd. San Jose', addr_barangay 'Brgy. San Jose', addr_city 'Tacloban City', addr_province 'Leyte', addr_zip '6500'
   - completeness_score 100, last_verified_at NOW() - INTERVAL '2 hours'

2. ONE row in nominations for DEMO-001 + the ISLA program with status='eligible' and a passing eligibility_result jsonb:
   INSERT INTO nominations (teacher_id, program_id, status, eligibility_result)
   SELECT 'DEMO-001', id, 'eligible',
     '{"passed": ["min_years_experience","required_subject_area","required_qualification"], "failed": [], "summary": "Eligible for ISLA"}'::jsonb
   FROM programs WHERE program_name = 'ISLA';

3. FOUR rows in training_events. All is_star_partnered=TRUE. Use these specs:
   - #1 ISLA Cohort 12: Inquiry-Based Physics, organizer 'STAR DOST', venue 'Tacloban City', venue_region 'Region VIII', start +14d, end +16d, deadline +7d. event_specific_fields with 3 entries: dietary_restrictions (text, optional, max 200), room_sharing (select Yes/No, required), transportation (select 'Self-arranged'/'Organizer-provided', required)
   - #2 CBEP Math Facilitators Workshop, organizer 'PNU', venue 'Cebu City', start +30d, end +31d, deadline +20d
   - #3 STAR Fellowship Orientation 2026, organizer 'STAR DOST', venue 'Manila', start +45d, end +47d, deadline +30d
   - #4 MTU Rural Outreach Preview, organizer 'SEAMEO INNOTECH', venue 'Davao', start +60d, end +61d, deadline +45d

   Use CURRENT_DATE + INTERVAL 'N days' for relative dates so seed stays valid over time.

4. TWO event_registrations rows for DEMO-001 (NOT for the ISLA event — that one happens during demo):
   - Registration A: event_id of CBEP, status='submitted', submitted_at = NOW() - 3 days, next_action = 'Waiting for division approval'
   - Registration B: event_id of STAR Fellowship, status='approved', approved_at = NOW() - 1 day, next_action = 'Prepare for STAR Fellowship Orientation 2026 on {start_date}' (substitute actual date)

Use CTEs or subqueries to look up program_id and event_id rather than hardcoding integers. The seed must be idempotent within a fresh DB but doesn't need to handle re-runs.
```

### 🟦 PROMPT A.3 — Pre-Baked Demo Assets Placeholder

```
Create the directory api/templates/forms/ and add a README.md in it documenting the three required pre-baked assets that must be manually placed there before the demo:

1. csc_form_212.xlsx — Official CSC PDS template (Revised 2025), pinned version. Download from CSC website.
2. demo_pds_prefilled.xlsx — Manually filled with Sir Renato's seed values per the cell mapping in api/intel/form_mappings/csc_form_212.py
3. demo_pds_preview.png — Screenshot of Page 1 of the filled file, ~600px wide

Also create api/static/forms/ as an empty directory with a .gitkeep file. The demo_pds_preview.png will be served from here via FastAPI StaticFiles mount.

Document in the README that the .xlsx files are tracked via Git LFS if they exceed 1MB, and that re-baking is required whenever seed data or template version changes (add a `make refresh-demo-assets` target placeholder in the README — actual implementation is post-MVP).
```

### ✅ PHASE A VERIFICATION
```bash
# Migrations run against Supabase (NOT Docker)
source .env

# 1. Run migrations against the DIRECT connection (port 5432)
psql "$DATABASE_URL_DIRECT" -f db/migrations/003_v34_module4_and_starbot.sql

# 2. Verify tables exist
psql "$DATABASE_URL_DIRECT" -c "\dt teacher_profile_extended"
psql "$DATABASE_URL_DIRECT" -c "\dt training_events"
psql "$DATABASE_URL_DIRECT" -c "\dt event_registrations"

# 3. Verify enum
psql "$DATABASE_URL_DIRECT" -c "SELECT unnest(enum_range(NULL::registration_status))"

# 4. Verify seed
psql "$DATABASE_URL_DIRECT" -c "SELECT deped_id, completeness_score FROM teacher_profile_extended"
psql "$DATABASE_URL_DIRECT" -c "SELECT id, title, is_star_partnered FROM training_events"
psql "$DATABASE_URL_DIRECT" -c "SELECT teacher_id, status FROM event_registrations"
# Expect: 1 profile row (100%), 4 events, 2 registrations

# Alternative: If psql isn't installed locally, paste each migration file
# into the Supabase Dashboard → SQL Editor → New Query and run there.
```

---

## PHASE B — BACKEND ENDPOINTS

### 🟦 PROMPT B.1 — Pydantic Schemas

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create all Pydantic v2 schema files for v3.4 endpoints. Reference Part A §A.1 for the canonical TypeScript interfaces — every Pydantic model must mirror its TS counterpart field-for-field.

Files to create:

1. api/schemas/chat.py
   - ChatRequest: message (str, max_length=500, required), region_context (Dict[str, Any] | None)
   - ChatResponse: response (str), sources (List[str])
   - REMOVE any 'mode' field that may exist from v3.1.

2. api/schemas/reports.py
   - ReportType = Literal["quarterly_performance", "intervention_priority", "executive_summary"]
   - ReportGenerateRequest: region (str), report_type (ReportType)
   - ReportGenerateResponse: markdown (str), filename (str), generated_at (datetime)

3. api/schemas/profile_extended.py — full ProfileExtendedUpsert per Part A §A.1
   - Use Literal["Male", "Female"] for sex
   - Use Literal["Single", "Married", "Separated", "Widowed"] for civil_status
   - Use EmailStr for email
   - Use Field(pattern=r"^\d{4}$") for addr_zip
   - Add a @field_validator for mobile_number and telephone_number that strips non-digit chars (keep '+'), returns None if empty
   - Add ge=50, le=250 for height_cm; ge=20, le=300 for weight_kg

4. api/schemas/events.py
   - FormKey = Literal["pds", "authority_to_travel", "csc_form_6", "school_clearance"]
   - EventSpecificFieldType = Literal["text", "select"]
   - EventSpecificFieldDef BaseModel
   - TrainingEventOut + RecommendedEventOut (extends TrainingEventOut with reason_chip, is_eligible, nomination_id)

5. api/schemas/registrations.py
   - RegistrationStatus = Literal["draft", "forms_generated", "submitted", "approved", "attended", "completed", "cancelled"]
   - RegisterEventRequest: deped_id (str), event_specific_answers (Dict[str, str])
   - RegistrationOut: full row representation
   - ActiveRegistrationOut: nested event sub-object with id/title/organizer/venue/start_date/end_date
   - VerifyResponse: verified_at (datetime)
   - GeneratePDSResponse: download_url, preview_image_url, generated_at, registration (RegistrationOut)
   - StatusPatchRequest: status (RegistrationStatus)

Use Pydantic v2 syntax throughout (BaseModel, Field, field_validator, ConfigDict for orm_mode replacement).
```

### 🟦 PROMPT B.2 — Profile Completeness Helper

```
Create api/intel/profile_completeness.py per Part A §A.1 and v3.4 §6.2:

1. Module-level constants:
   - TIER_1_MAPPED_FIELDS = list of 14 field names that have PDS cell mappings
   - TIER_1_UNMAPPED_FIELDS = list of 5 field names without cell mappings yet (place_of_birth, citizenship, height_cm, weight_kg, blood_type)
   - ALL_TIER_1_FIELDS = concatenation (19 total)
   - REQUIRED_FOR_SIGNUP = set of the 9 fields that gate sign-up: sex, date_of_birth, civil_status, mobile_number, email, addr_barangay, addr_city, addr_province, addr_zip

2. Two functions:
   - compute_completeness(profile) -> int : returns 0-100 percentage of ALL_TIER_1_FIELDS that are non-null/non-empty. Round to nearest int.
   - is_signup_eligible(profile) -> bool : True iff every field in REQUIRED_FOR_SIGNUP is non-null/non-empty on the profile.

Both functions must use getattr with a default of None, treating both None and empty string as "not filled". They must work with both SQLAlchemy ORM objects and Pydantic models.
```

### 🟦 PROMPT B.3 — Simplify STARBOT Chat Router

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Rewrite api/routers/chat.py for v3.4 STARBOT (query-only, no draft routing).

Reference: Part A §A.1 (ChatRequest/ChatResponse), Part C Step 8 (the wire path), Part E §E.1 (failure modes).

Requirements:

1. Single endpoint: POST /chat
   Body: ChatRequest from api/schemas/chat.py
   Response: ChatResponse

2. Module-level PITCH_RESPONSES dict with EXACTLY two keys:
   - "which ppst domain has the biggest gap in this region?"
   - "how does this region compare to the national average?"
   Each value is a dict with a 'template' string containing {placeholder} fields that map to columns on the regional_scores row.

   Use these EXACT templates:

   PPST gap template:
   "Looking at the PPST skill profile for {region}, the biggest gap is in **Assessment Literacy**, currently at {assessment_val} against a target of 0.80. This is {gap} points below target — the widest gap across all five PPST domains. Curriculum Planning and Content Knowledge are closer to target, while Research-Based Practice sits in the middle at {research_val}."

   National comparison template:
   "{region} has an Underserved Score of {score}/100, which places it in the **{traffic_light} zone**. The national average across all 17 regions is approximately 65/100. Teacher-to-student ratio in {region} is {ratio}, and STAR Program coverage sits at {coverage}%. The most pressing factor is the specialization match rate at {spec}%."

3. Handler logic:
   a. Read app.state.pitch_mode (set in main.py at startup)
   b. If region_context is None: return ChatResponse(response="Please select a region on the map first, then ask me about it.", sources=[])
   c. If pitch_mode is True:
      - Normalize message: message.strip().lower()
      - Lookup in PITCH_RESPONSES
      - If hit: substitute fields from region_context using .format() with rounded numerics:
        * assessment_val = round(region_context['ppst_assessment_literacy'], 2)
        * gap = round(0.80 - region_context['ppst_assessment_literacy'], 2)
        * research_val = round(region_context['ppst_research_based_practice'], 2)
        * score = round(region_context['underserved_score'])
        * traffic_light = region_context['traffic_light']
        * ratio = region_context['teacher_student_ratio']
        * coverage = round(region_context['star_coverage_pct'])
        * spec = round(region_context['specialization_pct'])
      - If miss: return generic fallback "I'm currently showing a curated preview of my capabilities. Try one of the suggested questions below, or come back after hackathon day for the full experience."
      - await asyncio.sleep(0.6) before returning
      - Sources = [f"POLARIS regional_scores — {region_context['region']}"]
   d. If pitch_mode is False:
      - Call GeminiClient.complete() with a STARBOT_QUERY system prompt (define a placeholder; full hardening lives in polaris_starbot_roadmap.md)
      - Strip any [Source:...] patterns from the LLM response (defensive — see Part E §E.1)
      - Append the citation deterministically in code

4. Be defensive against missing keys in region_context — wrap field access in try/except KeyError and fall back to the generic fallback string if a substitution fails.

5. NO 'mode' field anywhere. NO intent classification. NO draft routing. One job.
```

### 🟦 PROMPT B.4 — Report Generator Endpoint + Templates

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create the Report Generator backend per Part A §A.1, Part B §B.2 BE2/BE11/BE12, and Part C Step 10.

Files to create:

1. api/intel/report_bands.py
   Module with band-classification functions. Each takes a numeric value, returns one of: "Above target", "On target", "Needs improvement", "Below target". Functions:
   - supply_band(teacher_student_ratio) — lower is better; thresholds 25, 30, 35
   - spec_band(specialization_pct) — higher is better; thresholds 70, 60, 50
   - coverage_band(star_coverage_pct) — higher is better; thresholds 60, 45, 30
   - nat_band(avg_nat_score) — higher is better; thresholds 70, 60, 50
   - demand_band(demand_subscore) — higher = more unmet demand = worse; thresholds 30, 50, 70 (inverted)
   Pick concrete sane thresholds; ranges above are starting points.

2. api/templates/reports/quarterly_performance.md
   Markdown template, ~500 words, with these {placeholder} fields:
   {region}, {quarter}, {year}, {generated_date}, {underserved_score}, {severity_phrase}, {key_insight}, {teacher_student_ratio}, {supply_band}, {specialization_pct}, {spec_band}, {supply_subscore}, {star_coverage_pct}, {coverage_band}, {avg_nat_score}, {nat_band}, {impact_subscore}, {demand_subscore}, {demand_band}, {demand_signal_count}, {recommendations_block}, {computed_at}
   Sections: Header, Executive Summary, Performance Metrics (Supply/Impact/Demand subsections), Strategic Recommendations, Footer disclaimer that this is an AI-generated draft.

3. api/templates/reports/intervention_priority.md
   ~250 words, urgent tone. Same field universe but tighter. Include {region}, {underserved_score}, {key_insight}, weakest factor, {recommendations_block}.

4. api/templates/reports/executive_summary.md
   ~150 words, concise. {region}, {underserved_score}, {traffic_light}, 1-sentence diagnosis, 1-line recommendation.

5. api/templates/reports/recommendations.py
   Python module exporting a function pick_recommendations(weakest_factor: str, region: str) -> str
   Returns a markdown-formatted bullet list of 3 hand-picked recommendations.
   Cases: "supply", "impact", "demand". Each case returns 3 specific actionable bullets relevant to that weakness.

6. api/routers/reports.py
   POST /reports/generate
   Logic:
   a. Validate report_type via Pydantic Literal
   b. Fetch regional_scores row by region; if not found → 404
   c. Load template file from api/templates/reports/{report_type}.md
   d. Compute derived values:
      - severity_phrase: based on traffic_light (red→"critical gaps requiring immediate intervention", yellow→"moderate gaps that warrant attention", green→"generally healthy conditions with targeted opportunities")
      - All band labels via report_bands.py
      - key_insight: reuse compute_key_insight() logic from existing Regional Health Card code (import from wherever it lives in v3.1 — likely api/intel/scoring.py or a new helper). If it doesn't exist as a Python function yet, port the JS logic from the frontend into Python.
      - Identify weakest factor (compare normalized supply_subscore, impact_subscore, demand_subscore — lowest wins; for demand higher=worse so invert)
      - recommendations_block: call pick_recommendations(weakest_factor, region)
      - quarter, year: derive from current date
      - generated_date, computed_at: ISO format strings
   e. PITCH_MODE branch: skip Gemini, render with template.format_map(values_dict). await asyncio.sleep(1.2)
   f. Hackathon mode branch: same template, but call Gemini to fill ONLY {recommendations_block} and {key_insight}, then substitute numerics deterministically. Implementation can be a TODO with the deterministic path as fallback.
   g. Build filename: f"{ReportType.title().replace('_', '')}_{region_code}.md" where region_code is mapped from full region name (e.g., "Region VIII" → "R8"). Add a region_code lookup helper if it doesn't exist.
   h. Return ReportGenerateResponse

   Errors: 404 region not found, 422 unknown report_type (caught by Pydantic), 500 template render failure

Register the router in api/main.py.
```

### 🟦 PROMPT B.5 — Events + Registrations Routers

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create the events and registrations routers per Part A §A.1 (RecommendedEvent, EventRegistration, ALLOWED_TRANSITIONS), Part B §B.2 BE3/BE4, and Part C Steps 14–18.

Files:

1. api/models/training_event.py — SQLAlchemy ORM model for training_events
2. api/models/event_registration.py — SQLAlchemy ORM model for event_registrations
3. api/models/profile_extended.py — SQLAlchemy ORM model for teacher_profile_extended

4. api/routers/events.py
   GET /events/recommended?deped_id={deped_id}&limit=10
   Logic:
   a. Validate teacher exists; 404 if not
   b. Query training_events WHERE is_star_partnered = TRUE AND registration_deadline > NOW() + INTERVAL '3 days' AND start_date > NOW()
   c. Join with programs to get program_name, subject_area
   d. Compute ranking:
      1st priority: events whose programs.subject_area matches the teacher's largest PPST skill gap axis (use existing TVI/scoring helpers from v3.1)
      2nd priority: events matching teacher.subject_specialization
      3rd priority: all others
      Within each tier, sort by start_date ASC
   e. For each event, compute is_eligible: check if teacher has a nomination for event.program_id with status='eligible'. Include the nomination_id.
   f. Compute reason_chip per event:
      - If matches PPST gap → f"Closes your {gap_axis_name} gap"
      - Elif matches specialization → "Matches your specialization"
      - Else → "STAR-partnered"
   g. Return list of RecommendedEventOut, limited to `limit`
   Use a single query with subqueries/joins where possible. Eager-load relationships.

5. api/routers/registrations.py
   Implement these endpoints:

   a. POST /events/{event_id}/register
      - Body: RegisterEventRequest (deped_id, event_specific_answers)
      - Gate check: query nomination for (deped_id, event.program_id, status='eligible'). If none → 403
      - Validate event_specific_answers against event.event_specific_fields schema. Required fields must be present. Type-check text vs select. → 422 if invalid
      - Check duplicate: if (deped_id, event_id) row exists in event_registrations → 409
      - INSERT row with status='draft', nomination_id set to the eligible nomination's id, next_action="Complete sign-up to generate your forms"
      - Return RegistrationOut

   b. POST /registrations/{reg_id}/verify
      - Body: empty
      - Lookup registration; 404 if not found
      - UPDATE teacher_profile_extended SET last_verified_at = NOW() WHERE deped_id = registration.teacher_id
      - Return VerifyResponse

   c. POST /registrations/{reg_id}/generate-pds
      - Body: empty
      - Lookup registration with joined teacher + profile_extended + school
      - Verify last_verified_at IS NOT NULL AND NOW() - last_verified_at < INTERVAL '1 hour'. If not → 428
      - PITCH_MODE branch:
        * await asyncio.sleep(1.2)
        * shutil.copy("api/templates/forms/demo_pds_prefilled.xlsx", f"{OUTPUT_DIR}/{reg_id}_pds.xlsx") — only if file doesn't already exist
        * (proceed to DB update)
      - Hackathon branch:
        * Call generate_pds_xlsx(reg_id, joined_context) from api/intel/form_generator.py (created in Prompt B.6)
      - UPDATE event_registrations SET status='forms_generated', generated_pds_path, generated_at=NOW(), next_action='Get school head signature on your PDS' WHERE id=reg_id
      - Return GeneratePDSResponse with download_url f"/downloads/{reg_id}_pds.xlsx", preview_image_url "/static/forms/demo_pds_preview.png", generated_at, registration

   d. PATCH /registrations/{reg_id}/status
      - Body: StatusPatchRequest
      - Lookup registration; 404 if not found
      - Validate transition against ALLOWED_TRANSITIONS dict (mirror the dict from Part A §A.1). 422 if invalid.
      - UPDATE row: set status, set the appropriate timestamp column (submitted_at, approved_at, attended_at, cancelled_at), recompute next_action via a helper function compute_next_action(status, event)
      - Return updated RegistrationOut

   e. GET /teachers/{deped_id}/active-registrations
      - Query event_registrations WHERE teacher_id=deped_id AND status IN ('forms_generated', 'submitted', 'approved')
      - Join training_events for display fields
      - ORDER BY event.start_date ASC LIMIT 3
      - Return list of ActiveRegistrationOut

OUTPUT_DIR is a module-level constant; use "/var/polaris/generated" but create a helper that ensures the dir exists at module load via os.makedirs(OUTPUT_DIR, exist_ok=True).

Register both routers in api/main.py.
```

### 🟦 PROMPT B.6 — Form Generator + Cell Mapping Stub

```
Create the PDS form generator infrastructure per Part B §B.2 BE13 and v3.4 §5.4.

Files:

1. api/intel/form_mappings/csc_form_212.py
   - CSC_FORM_212_CELL_MAPPING: nested dict {sheet_name: {cell_address: source_spec}}
   - source_spec is either:
     * "constant:VALUE" — write the literal VALUE
     * dotted path like "profile.surname" or "teacher.deped_id" — resolve from joined context
   - Use the discovered cell mapping from v3.4 §5.4.2 (Sheet C1, Page 1):
     D10=teacher.last_name, D11=teacher.first_name, O11=profile.name_extension, D12=teacher.middle_name, D13=profile.date_of_birth, D16=profile.sex, D17=profile.civil_status, D34=teacher.deped_id, I26=profile.addr_house_no, L26=profile.addr_street, I27=profile.addr_subdivision, L27=profile.addr_barangay, I30=profile.addr_city, L30=profile.addr_province, I31=profile.addr_zip, I32=profile.telephone_number, I33=profile.mobile_number, I34=profile.email
   - CIVIL_STATUS_VALUES = ("Single", "Married", "Separated", "Widowed")
   - SEX_VALUES = ("Male", "Female")
   - validate_enum_value(field: str, value: str) — raises if value not in lookup
   - resolve_source(source: str, context: dict) -> Any — handles "constant:" prefix and dotted paths
   - _format_value(val) — type-aware formatter:
     * date → "dd/mm/yyyy" string
     * None → "" (empty string, not literal "None")
     * float → str with reasonable precision
     * everything else → str
   - audit_mapping_against_template(path: str) -> dict — diagnostic helper that:
     * Opens the .xlsx via openpyxl
     * For each sheet+cell in the mapping, checks the sheet exists, the cell is unmerged or is the anchor of its merged range
     * Returns dict of warnings keyed by f"{sheet}!{cell}"; empty dict = clean

2. api/intel/form_generator.py
   - Module constants: PDS_TEMPLATE_PATH, OUTPUT_DIR
   - os.makedirs(OUTPUT_DIR, exist_ok=True) at module load
   - async def generate_pds_xlsx(registration_id: int, context: dict) -> str
     * shutil.copy template → output_path (NEVER mutate template in-place)
     * load_workbook(output_path)
     * For each sheet+cell in CSC_FORM_212_CELL_MAPPING:
       - If sheet not in wb.sheetnames → log warning, skip
       - For each cell, try resolve_source + _format_value, catch any Exception, log, continue (one bad cell shouldn't kill the form)
     * wb.save(output_path)
     * Return output_path

Add openpyxl==3.1.2 to requirements.txt.

Note: This file is a stub for hackathon mode. PITCH_MODE bypasses it entirely. The audit step must be run manually before flipping PITCH_MODE off.
```

### 🟦 PROMPT B.7 — Profile Extended + Downloads Routers + main.py Wiring

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create the remaining backend pieces per Part B §B.2 BE5/BE6/BE7.

Files:

1. api/routers/profile_extended.py
   POST /teachers/{deped_id}/profile-extended
   - Body: ProfileExtendedUpsert
   - Verify teacher exists; 404 if not
   - UPSERT into teacher_profile_extended (INSERT ... ON CONFLICT (deped_id) DO UPDATE)
   - Recompute completeness_score via compute_completeness()
   - Do NOT touch last_verified_at — that's only set by /verify
   - Return the full row

2. api/routers/downloads.py
   GET /downloads/{filename}
   - Validate filename matches regex r"^\d+_pds\.xlsx$" — 404 if not
   - Build full path: f"{OUTPUT_DIR}/{filename}"
   - If file doesn't exist → 404
   - Return FileResponse with media_type "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" and Content-Disposition with a friendly filename like "Renato_DelaCruz_PDS.xlsx" (for pitch mode just hardcode this; for hackathon mode look up teacher name from the registration row)

3. Update api/main.py:
   - Read POLARIS_PITCH_MODE env var at startup, store as bool on app.state.pitch_mode
   - Mount StaticFiles at "/static" pointing to "api/static" directory
   - Register all new routers: chat (rewritten), reports, events, registrations, profile_extended, downloads
   - Ensure CORS already set up from v3.1 includes the new endpoints (it should — CORS is router-agnostic)
   - Add startup log: f"POLARIS pitch_mode={app.state.pitch_mode}"

Verify with curl after this prompt:
- POST /chat with both suggestion-chip strings (PITCH_MODE=true) → expect canned templates filled with region values
- POST /reports/generate for each report_type × Region VIII → expect 3 different markdown outputs
- POST /events/123/register without an eligible nomination → expect 403
- GET /teachers/DEMO-001/active-registrations → expect 2 rows (CBEP, STAR Fellowship)
```

### ✅ PHASE B VERIFICATION

```bash
# No db service to start — Supabase is always on. Just start api.
docker compose up -d api
docker compose logs api | grep pitch_mode
# Confirm: "POLARIS pitch_mode=True"
# Confirm: no DB connection errors in logs (SQLAlchemy connects to Supabase)

# Smoke tests (unchanged — they hit localhost:8000 regardless of where the DB lives)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Which PPST domain has the biggest gap in this region?","region_context":{"region":"Region VIII","ppst_assessment_literacy":0.42,"ppst_research_based_practice":0.61}}'
# Expect: canned response mentioning "0.42 against a target of 0.80"

curl -X POST http://localhost:8000/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"region":"Region VIII","report_type":"quarterly_performance"}'
# Expect: { markdown: "**QUARTERLY PERFORMANCE REPORT**...", filename: "Quarterly_Report_R8.md", ... }

curl http://localhost:8000/teachers/DEMO-001/active-registrations
# Expect: array of 2 ActiveRegistrationOut

curl -X POST http://localhost:8000/events/{ISLA_event_id}/register \
  -H "Content-Type: application/json" \
  -d '{"deped_id":"DEMO-001","event_specific_answers":{"dietary_restrictions":"None","room_sharing":"Yes","transportation":"Self-arranged"}}'
# Expect: 200 with new registration row, status=draft
```

---

## PHASE C — FRONTEND

### 🟦 PROMPT C.1 — TypeScript Types File

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Create frontend/src/types/polaris.ts containing the EXACT contents of Part A §A.1 — every TypeScript interface, type alias, and constant.

This file is the source of truth for all v3.4 frontend code. Every component, hook, and API call must import its types from here. Do not redefine these locally.

Also create frontend/src/lib/api.ts (if it doesn't exist) with typed wrapper functions:
- chat(req: ChatRequest): Promise<ChatResponse>
- generateReport(req: ReportGenerateRequest): Promise<ReportGenerateResponse>
- getRecommendedEvents(depedId: string): Promise<RecommendedEvent[]>
- registerForEvent(eventId: number, req: RegisterEventRequest): Promise<EventRegistration>
- verifyRegistration(regId: number): Promise<VerifyResponse>
- generatePDS(regId: number): Promise<GeneratePDSResponse>
- patchStatus(regId: number, status: RegistrationStatus): Promise<EventRegistration>
- getActiveRegistrations(depedId: string): Promise<ActiveRegistration[]>
- upsertProfileExtended(depedId: string, profile: ProfileExtendedUpsert): Promise<ProfileExtended>

Use the existing fetch/axios setup from v3.1. Throw on non-2xx, parse the {detail} error shape.
```

### 🟦 PROMPT C.2 — Sidebar + Reports Route Registration

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Two small edits to enable the Reports page:

1. frontend/src/components/dashboard/Sidebar.jsx
   - Find the FileText icon (currently disabled, "Coming soon" tooltip per v3.1 §4.1)
   - Replace the disabled stub with a NavLink to "/reports"
   - Active state: when location.pathname starts with "/reports"
   - Tooltip: "Report Generator"
   - Same icon (lucide-react FileText)
   - Keep the other two icons (LayoutDashboard, Users) untouched

2. frontend/src/App.jsx (or wherever the React Router routes are defined)
   - Add a new route: <Route path="/reports" element={<ReportGenerator />} />
   - Import: import ReportGenerator from "@/pages/ReportGenerator"
   - Place this route INSIDE the same layout that wraps Dashboard so the sidebar persists
```

### 🟦 PROMPT C.3 — STARBOT Update + Fake Streaming

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Update STARBOT for v3.4 per Part C Step 8 and Part B §B.3.1 FE2/FE3.

1. Create frontend/src/components/starbot/StreamingResponse.jsx:

```jsx
import { useState, useEffect } from "react";

export default function StreamingResponse({ fullText }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!fullText) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [fullText]);

  const isStreaming = displayed.length < (fullText?.length ?? 0);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {displayed}
      {isStreaming && <span className="animate-pulse ml-0.5">▊</span>}
    </div>
  );
}
```

2. Update frontend/src/components/starbot/Starbot.jsx:
   - REMOVE any 'mode' field from the chat request payload
   - REMOVE any UI affordance for "Draft a memo" or draft mode
   - When the chat panel is empty (no messages), render TWO suggestion chips below the input field:
     Chip 1: "💡 Biggest PPST gap here?"     → onClick sends EXACT string "Which PPST domain has the biggest gap in this region?"
     Chip 2: "📊 How does this region compare nationally?"  → onClick sends EXACT string "How does this region compare to the national average?"
     Style: pill buttons (rounded-full bg-slate-100 hover:bg-slate-200 text-sm px-3 py-1.5)
     IMPORTANT: the strings sent to backend must match the PITCH_RESPONSES dict keys EXACTLY (lowercase comparison happens server-side).
   - Hide chips after first message; show again on conversation reset
   - Use StreamingResponse to render assistant messages (not user messages — those render plain)
   - Below each assistant message, render a small muted citation line: "[Source: " + sources.join(", ") + "]" if sources.length > 0
   - Add a Copy button next to each assistant message: navigator.clipboard.writeText(message.response)
   - region_context is pulled from the dashboardStore: if activeRegion is set, find the row in cached regions and pass it; else null
   - Dragging behavior, minimize, lower-right anchor — preserve from v3.1
   - DO NOT animate the bot icon (per v3.4 §4.2.1)
```

### 🟦 PROMPT C.4 — Report Generator Page

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Build the Report Generator page per Part A §A.1 (ReportGenerateRequest/Response), Part B §B.3.1 FE4/FE5, and Part C Steps 9–10.

Files to create:

1. frontend/src/pages/ReportGenerator.jsx — page shell, two-column layout
2. frontend/src/components/reports/ReportConfigPanel.jsx — left column
3. frontend/src/components/reports/ReportPreviewPanel.jsx — right column
4. frontend/src/components/reports/ReportTypeCard.jsx — selectable radio-card

Layout (full width, below the existing left sidebar — sidebar persists):
- Page header strip: "REPORT GENERATOR" in display font weight, "← Back to Dashboard" link above
- Two-column grid: left ~33%, right ~67%, gap-6, p-8

LEFT COLUMN (ReportConfigPanel):
- "Select Region" label + dropdown
  * Pre-populated from cached useRegions() (React Query, GET /regions/)
  * Default value: dashboardStore.activeRegion if set, else first region in list
  * Use a native <select> or shadcn Select component
- "Report Type" label + 3 ReportTypeCard components stacked vertically with gap-3
- ReportTypeCard props: { value, title, subtitle, selected, onClick }
  * Selected: bg-blue-600 text-white
  * Unselected: bg-blue-50 text-slate-900 hover:bg-blue-100
  * rounded-xl px-4 py-3 cursor-pointer transition-colors
- The 3 cards:
  1. value="quarterly_performance" title="Quarterly Performance Report" subtitle=`Comprehensive Q${currentQuarter} ${currentYear} Analysis`
  2. value="intervention_priority" title="Intervention Priority Memo" subtitle="Urgent Action Recommendations"
  3. value="executive_summary" title="Executive Summary" subtitle="Quick Overview Brief"
- Default selected: "quarterly_performance"
- Bottom: GENERATE REPORT button — w-full bg-blue-600 text-white py-3 rounded-lg font-semibold
  * Disabled while in flight (isPending)
  * Loading state: spinner + "Generating..." text

RIGHT COLUMN (ReportPreviewPanel):
- Top row: document icon + filename text. Filename is either the placeholder "Quarterly_Report.md" or the actual filename from the response.
- Pink/red pill badge: "FOR REVIEW — AI-GENERATED DRAFT" (bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-semibold)
- Preview area: <pre className="bg-slate-50 border rounded-lg p-6 overflow-auto max-h-[60vh] text-sm font-mono whitespace-pre-wrap">
  * Empty state (before generation): "Select a region and report type, then click Generate to preview your report." in muted text
  * Filled state: the markdown string from the response, rendered as plain monospace pre (NOT as parsed markdown — we want the raw markdown visible to demo the AI output)
- Bottom: FINALIZE AND EXPORT button — primary blue, bottom-right
  * onClick: navigator.clipboard.writeText(markdown) then show toast "Report copied to clipboard."
  * Use shadcn toast or sonner if available, else a simple inline toast component

State management:
- Use React useState locally — no global state needed
- selectedRegion (string), selectedReportType (ReportType), markdown (string|null), filename (string|null), isGenerating (boolean)
- On Generate click: call api.generateReport({region, report_type}). On success: set markdown + filename. On error: toast the error.detail.

Use React Query mutation if the rest of the codebase uses it; otherwise plain async/await.

IMPORTANT: This page MUST read activeRegion from the global dashboardStore on mount. If the user came from clicking a Critical Ping, the dropdown defaults to that region (per Part C Step 9).
```

### 🟦 PROMPT C.5 — Onboarding Flow (3-Step)

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Build the teacher onboarding flow per Part A §A.1 (ProfileExtendedUpsert, REQUIRED_FOR_SIGNUP), Part B §B.3.2 FE13/FE19, and v3.4 §5.5.

Create frontend/src/pages/teacher/Onboarding.jsx:

3 steps with progress indicator "Step N of 3":

STEP 1 — Personal Basics (6 fields):
- name_extension (text, optional, placeholder "e.g. JR., SR., III")
- sex (single-select Male/Female) — REQUIRED
- date_of_birth (date input) — REQUIRED
- civil_status (single-select Single/Married/Separated/Widowed) — REQUIRED
- place_of_birth (text, optional)
- citizenship (text, default "Filipino", optional)

STEP 2 — Physical Details (3 fields, all optional):
- height_cm (number)
- weight_kg (number)
- blood_type (single-select with "I don't know" option)

STEP 3 — Contact and Address (10 fields):
Contact subsection:
- mobile_number (tel input) — REQUIRED
- telephone_number (tel input, optional)
- email (email input) — REQUIRED

Permanent Address subsection (subheading "Permanent Address"):
- addr_house_no (text)
- addr_street (text)
- addr_subdivision (text)
- addr_barangay (text) — REQUIRED
- addr_city (text) — REQUIRED
- addr_province (text) — REQUIRED
- addr_zip (text, 4-digit numeric, pattern \d{4}) — REQUIRED

Behavior:
- Each step has Back (left) and Next (right) buttons. Back disabled on Step 1.
- Next validates required fields on the current step. If any required field is empty, show inline red error and prevent advance.
- Bottom of each step: muted text "You can update this later in Profile settings."
- On Step 3 completion: POST /teachers/{deped_id}/profile-extended with the assembled ProfileExtendedUpsert
- On success: navigate to Tab 1 Home with toast "Welcome to POLARIS! You're {N}% profile-complete."
- On error: toast error.detail, stay on Step 3

After Step 3 success but before navigating Home, show ONE final info screen:
- Heading "You're all set! 🎉"
- "POLARIS Basic Profile: {N}% complete"
- A locked section labeled "AVAILABLE IN PRODUCTION" with two items:
  * 🔒 Government IDs (GSIS, PhilHealth, TIN) — "Needed for leave and travel forms."
  * 🔒 Full PDS (work history, family, eligibilities) — "Needed for ranking and promotion forms."
- Footer: "These will be available in the production release with end-to-end encryption."
- Single button: [Continue to Home]

This screen is part of the demo narrative — DO NOT skip it.

State management: useReducer for the form state across steps. Local state, no global store needed.

Update frontend/src/pages/TeacherApp.jsx:
- On login success, fetch GET /teachers/{deped_id}/profile-extended (catch 404 → empty profile)
- If profile is null OR is_signup_eligible(profile) === false → navigate to /teacher/onboarding
- Else → /teacher/home
- Implement is_signup_eligible client-side using REQUIRED_FOR_SIGNUP from polaris.ts (mirror of backend)
```

### 🟦 PROMPT C.6 — Home Tab Restructure + ActiveRegistrationCard

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Restructure the teacher Home tab per Part A §A.1 (ActiveRegistration, ALLOWED_TRANSITIONS), Part B §B.3.2 FE7/FE8/FE9, and Part C Steps 12/13/18.

Files:

1. frontend/src/hooks/useActiveRegistrations.js — React Query hook
   - Key: ['active-registrations', depedId]
   - Fetcher: api.getActiveRegistrations(depedId)
   - staleTime: 30s

2. frontend/src/components/teacher/ActiveRegistrationCard.jsx
   Props: { registration: ActiveRegistration, onMutate: () => void }
   Renders:
   - Event title (font-bold text-base)
   - Dates + venue, one line (text-sm text-slate-600)
   - Status pill (small rounded-full px-2 py-0.5 text-xs):
     * forms_generated → bg-amber-100 text-amber-800
     * submitted → bg-blue-100 text-blue-800
     * approved → bg-green-100 text-green-800
   - next_action sentence (text-sm text-slate-700)
   - Action button (depends on status):
     * forms_generated → "Mark as Submitted" → PATCH status to "submitted"
     * submitted → "Mark as Approved" → PATCH status to "approved"
     * approved → no button
   - Card click (NOT button click) → opens detail modal with full registration info + "Re-download PDS" link (window.open(`/downloads/${registration.id}_pds.xlsx`))
   - On successful PATCH: invalidate the ['active-registrations'] query key

   Use stopPropagation on the action button so card click and button click don't conflict.

3. frontend/src/components/teacher/ActiveRegistrationsList.jsx
   - Calls useActiveRegistrations(depedId)
   - Heading: "MY ACTIVE REGISTRATIONS" (text-xs font-semibold uppercase tracking-wider text-slate-500)
   - Loading: 2 skeleton cards
   - Empty: "No active registrations. Explore recommended trainings →" with a link to /teacher/training
   - Filled: stack of ActiveRegistrationCard, gap-3

4. Restructure frontend/src/pages/teacher/HomeTab.jsx (or wherever Home renders):
   Order from top to bottom:
   1. Header "Kumusta, {teacher.first_name}!"
   2. <ActiveRegistrationsList depedId={teacher.deped_id} />   ← TOP OF FOLD, must be first
   3. Skill Radar pentagon (preserved from v3.1)
   4. Training Nudge Card (preserved from v3.1)
   5. Needs Signal CTA (preserved from v3.1)

The order is critical for the demo. Tracking at the top, every other v3.1 element pushed below.
```

### 🟦 PROMPT C.7 — Training Tab Recommended View Update

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Update the Training tab Recommended view per Part B §B.3.2 FE10/FE11/FE12 and Part C Step 14.

Files:

1. frontend/src/hooks/useRecommendedEvents.js — React Query hook
   - Key: ['recommended-events', depedId]
   - Fetcher: api.getRecommendedEvents(depedId)

2. frontend/src/components/teacher/EventCard.jsx
   Props: { event: RecommendedEvent }
   Renders (in order):
   - Title (font-bold)
   - Row of small badges: program_name pill (e.g. "ISLA"), organizer text muted
   - Dates + venue line
   - subject_area pill
   - reason_chip (small italic muted text or rounded badge)
   - Deadline indicator: if registration_deadline within 7 days → red badge "Closes in N days"
   - CTA button at bottom:
     * is_eligible === true → primary blue "Sign Up" → onClick: opens SignUpFlow modal with this event
     * is_eligible === false → outline secondary "Check Eligibility" → onClick: navigates to /teacher/profile?section=E

3. Update frontend/src/components/teacher/RecommendedView.jsx (or wherever Recommended renders):
   - Replace the v3.1 data source (programs) with useRecommendedEvents
   - Render a stack of EventCard
   - Loading: 3 skeleton cards
   - Empty: "No recommended events right now. Check back soon — new STAR-partnered events are added weekly."
   - The "My History" view is UNCHANGED — preserve v3.1 implementation

4. SignUpFlow modal trigger:
   - When user taps "Sign Up", check is_signup_eligible(profile) client-side first
   - If false → block with toast "Complete your basic profile to sign up for events. This takes about 2 minutes and only needs to be done once." + button "Complete Profile" routing to /teacher/onboarding
   - If true → open <SignUpFlow event={event} /> as a full-screen modal (created in next prompt)
```

### 🟦 PROMPT C.8 — Sign-Up Flow + Verify + Success

```
@POLARIS_FINAL_EXECUTION_BLUEPRINT.md

Build the 3-screen sign-up flow per Part A §A.1 (RegisterEventRequest, GeneratePDSResponse), Part B §B.3.2 FE14–FE18, Part C Steps 15–17, and v3.4 §5.3.

This is a single-flow user reducer state machine — use useReducer with states: 'signup', 'verify', 'generating', 'success', 'error'.

Files:

1. frontend/src/components/teacher/ProfileInfoPreview.jsx
   Props: { profile: ProfileExtended, teacher: Teacher }
   Renders the grayed-out Tier 1 grid: Name, DepEd ID, School, Position, Mobile, Email, Address (assembled from 7 fields into 2-line block "Brgy. {barangay}, {city} / {province} {zip}").
   Style: bg-slate-50 text-slate-700 each row, lock icon (lucide Lock) on the right of each row, rounded-lg p-4
   Bottom: "Edit profile →" link routing to /teacher/profile (Tier 1 editor section)

2. frontend/src/components/teacher/EventSpecificFields.jsx
   Props: { fields: EventSpecificFieldDef[], values: Record<string,string>, onChange: (key, val) => void, errors: Record<string,string> }
   For each field, render based on type:
   - "text" → <input type="text" maxLength={field.max_length}>
   - "select" → <select> with options
   Required fields show red asterisk after label. Errors render below in red text.
   If fields array is empty, render nothing (the entire section is hidden upstream).

3. frontend/src/pages/teacher/SignUpFlow.jsx — the main controller
   Props: { event: RecommendedEvent, onClose: () => void }
   State: useReducer
   - Phase: 'signup' | 'verify' | 'generating' | 'success' | 'error'
   - registrationId: number | null
   - eventSpecificAnswers: Record<string,string>
   - errors: Record<string,string>
   - generateResult: GeneratePDSResponse | null

   Renders different views per phase.

4. SIGNUP PHASE (full-screen modal, single scrollable view, NOT a wizard):
   Header: × icon (top-left, onClick=onClose) + title "Sign up for {event.title}"
   Section 1: 📋 USING YOUR PROFILE INFO
     Subtitle: "This information is from your POLARIS profile. We'll use it to fill out your forms automatically."
     <ProfileInfoPreview ... />
   Section 2: ✍️ EVENT-SPECIFIC QUESTIONS
     (Hide this entire section if event.event_specific_fields is empty)
     Subtitle: "These are only for this event and won't be saved to your profile."
     <EventSpecificFields ... />
   Section 3: 📎 FORMS THAT WILL BE GENERATED
     Subtitle hidden
     Stack of rows:
       - For each form key in event.required_forms:
         * "pds" → ✓ (green check) "Personal Data Sheet (CSC Form 212)"
         * "authority_to_travel" → ○ (empty circle) "Authority to Travel" + grey "(coming soon)" badge
         * "csc_form_6" → ○ "CSC Form 6 — Leave Application" + "(coming soon)"
         * "school_clearance" → ○ "School Clearance" + "(coming soon)"
     DO NOT hide the coming-soon items — they're part of the demo narrative
   Bottom: full-width primary button "CONTINUE TO VERIFY →"
     onClick:
       a. Validate all required event_specific_fields. If any missing → set errors, scroll to first, return.
       b. Call api.registerForEvent(event.id, { deped_id, event_specific_answers })
       c. On 200 → setRegistrationId, transition phase to 'verify'
       d. On 403 → toast "You need an eligible nomination to sign up." + close modal + navigate to /teacher/profile?section=E
       e. On 409 → toast "You're already registered for this event." + close modal + navigate to /teacher/home
       f. On 422 → set errors from response, stay on signup phase

5. VERIFY PHASE (replaces the modal content, looks like a full-screen sub-page):
   Header: ← back arrow (transitions back to 'signup') + title "Verify Your Information"
   Body:
     Subtitle: "Please confirm these details are correct before we generate your Personal Data Sheet."
     4 grouped sections, each with a top divider and uppercase section heading:
       PERSONAL INFORMATION: Full name, Date of birth, Sex, Civil status
       CONTACT INFORMATION: Mobile, Email
       PERMANENT ADDRESS: assembled into a 4-line address block from the 7 structured fields
       EMPLOYMENT: Position, School
     All fields are read-only display rows, label on left, value on right
   Mandatory checkbox at the bottom: "☐ I confirm this information is accurate and up to date."
   Buttons:
     - "[GENERATE MY PDS]" — disabled until checkbox is checked
       onClick:
         a. Transition phase to 'generating'
         b. Call api.verifyRegistration(registrationId)
         c. On success → call api.generatePDS(registrationId)
         d. On generate success → setGenerateResult, transition to 'success'
         e. On any error → toast error.detail, stay on verify phase
     - "[Edit profile instead]" — secondary link, navigates to /teacher/profile (Tier 1 editor). Registration stays in 'draft' status — it'll appear in Home tracking with the appropriate next_action.

6. GENERATING PHASE:
   Show a centered spinner + "Generating your Personal Data Sheet..." text. The 1.2s sleep is server-side. Frontend just waits.

7. SUCCESS PHASE:
   Centered layout:
   - Large green checkmark icon (lucide CheckCircle2, h-16 w-16 text-green-600)
   - Heading "You're signed up!" (text-2xl font-bold)
   - Subtext "Your Personal Data Sheet is ready."
   - PNG preview card:
     <img src={generateResult.preview_image_url} className="rounded-lg border border-slate-200 shadow-sm w-full max-w-md mx-auto" alt="PDS preview" />
     Caption below: "↓ Showing first page" (text-xs text-slate-500 text-center)
   - Filename row: 📊 icon + "Renato_DelaCruz_PDS.xlsx" (or compute from teacher name)
   - Primary button: "[DOWNLOAD EXCEL FILE]"
     onClick: window.location.href = generateResult.download_url   (triggers browser download)
   - "NEXT STEPS" heading + numbered list:
     1. Open the file in Excel or LibreOffice (works on phone too)
     2. Print on legal-size paper (8.5 × 14 inches)
     3. Get your school head's signature
     4. Submit to your division HR office
   - Footer text: "We'll track your progress in the Home tab. Just tap 'Mark as Submitted' when you drop off forms."
   - Secondary button: "[Back to Home]" → navigate to /teacher/home, close modal, invalidate ['active-registrations'] query

CRITICAL: The state machine MUST prevent skipping verify. Generate is only callable from 'verify' phase, only after the checkbox is true. There is no way to reach 'success' without going through 'verify'.

Use a single useReducer to enforce this. Do NOT split state across multiple useStates.
```

### ✅ PHASE C VERIFICATION
```bash
# Build frontend with PITCH_MODE
VITE_PITCH_MODE=true docker compose up -d frontend
# Open browser to http://localhost:5173 (or your Vite port)
# Walk through Part C — Happy Path Demo Script — manually
# Expected: zero React errors in console, zero failed network requests, all 18 steps work
```

---

## PHASE D — VALIDATION & POLISH

### 🟦 PROMPT D.1 — Final Audit Script

```
Create scripts/audit_demo_readiness.py — a one-shot Python script that verifies the demo is ready to record.

DB connection: Use `os.environ["DATABASE_URL_DIRECT"]` (Supabase direct connection, port 5432):
```python
import os
conn = psycopg2.connect(os.environ["DATABASE_URL_DIRECT"])
```

Checks:

1. DB connectivity + seed presence:
   - SELECT count(*) FROM teacher_profile_extended WHERE deped_id='DEMO-001' → expect 1
   - SELECT completeness_score FROM teacher_profile_extended WHERE deped_id='DEMO-001' → expect 100
   - SELECT count(*) FROM nominations WHERE teacher_id='DEMO-001' AND status='eligible' → expect ≥1
   - SELECT count(*) FROM training_events WHERE is_star_partnered=TRUE → expect ≥4
   - SELECT count(*) FROM event_registrations WHERE teacher_id='DEMO-001' AND status IN ('submitted','approved') → expect 2

2. File presence:
   - api/templates/forms/csc_form_212.xlsx exists
   - api/templates/forms/demo_pds_prefilled.xlsx exists
   - api/templates/forms/demo_pds_preview.png exists OR api/static/forms/demo_pds_preview.png

3. Endpoint smoke (require requests library):
   - GET /regions/ → 200, len ≥ 17
   - POST /chat with the PPST gap chip string + a fake region_context → 200, response contains "Assessment Literacy"
   - POST /reports/generate {region: "Region VIII", report_type: "quarterly_performance"} → 200, markdown contains "Region VIII"
   - GET /teachers/DEMO-001/active-registrations → 200, length 2
   - GET /events/recommended?deped_id=DEMO-001 → 200, length ≥ 1, top result has is_eligible=true

4. PITCH_MODE flag check:
   - Read POLARIS_PITCH_MODE env var
   - Print "✓ PITCH_MODE=true (recording-ready)" or "⚠ PITCH_MODE=false (live LLM mode)"

Output format: pretty checklist with ✓ / ✗ marks. Exit code 0 if all pass, 1 otherwise.

Run from project root: `python scripts/audit_demo_readiness.py`
```

### 🟦 PROMPT D.2 — Demo Reset Script

```
Create scripts/reset_demo_state.sql — a SQL script that resets the database to the exact state needed for recording the demo.

Specifically:
1. DELETE any event_registrations for DEMO-001 with event_id matching the ISLA Cohort 12 event (the demo flow creates this row in real-time; reset removes any prior runs)
2. UPDATE teacher_profile_extended SET last_verified_at = NOW() - INTERVAL '2 hours' WHERE deped_id='DEMO-001' (so verify isn't stale)
3. Verify the 2 baseline registrations (CBEP submitted, STAR Fellowship approved) are still present; if not, INSERT them
4. SELECT a final summary row showing: profile completeness, eligible nomination count, baseline registration count

Make this script idempotent — running it 10 times produces the same end state.

Add a Make target:
make demo-reset:
\tpsql "$(DATABASE_URL_DIRECT)" < scripts/reset_demo_state.sql
\tdocker compose restart api
```

---

# PART E — RED-TEAM STABILITY AUDIT

> **Mindset:** Every line below is a failure mode that has bitten someone before. Each has a preventive code snippet or assertion that MUST be in the codebase before recording.

## E.1 — STARBOT Failure Modes

### 🔴 E.1.1 — Suggestion chip string drift
**Risk:** Frontend chip sends `"Which PPST domain has the biggest gap in this region?"` (with capital W) but `PITCH_RESPONSES` key is the lowercase version. Without normalization, falls through to generic fallback.
**Fix:** ✅ Server-side normalize: `message.strip().lower()` BEFORE dict lookup. Already in Prompt B.3.
**Test:** Send the chip string with `"  Which PPST DOMAIN..."` → expect canned response, not fallback.

### 🔴 E.1.2 — Null `region_context`
**Risk:** User opens STARBOT before clicking any region. `region_context: null`. The chip click triggers, dict lookup hits, but `.format()` crashes on `KeyError`.
**Fix:** ✅ Early return when `region_context is None`:
```python
if region_context is None:
    return ChatResponse(
        response="Please select a region on the map first, then ask me about it.",
        sources=[]
    )
```

### 🔴 E.1.3 — Missing field on `region_context`
**Risk:** Backend assumes `region_context['ppst_assessment_literacy']` is present, but the cached frontend row is missing it (e.g., `GET /regions/` doesn't return PPST axes — only the underserved score view).
**Fix:** ✅ Wrap field substitution in try/except KeyError, fall back to generic. Audit `GET /regions/` response shape — must include all PPST columns. Add an assertion in `regions.py` router.
```python
try:
    response_text = template.format(...)
except (KeyError, ValueError):
    response_text = GENERIC_FALLBACK
```

### 🔴 E.1.4 — Streaming flicker on re-render
**Risk:** `StreamingResponse` re-renders mid-stream when parent re-renders, restarts the streaming animation, makes the bot look broken.
**Fix:** ✅ Use the `useEffect` dependency `[fullText]` only — not `[message]` or `[response]`. Each unique `fullText` triggers exactly one streaming run. Memoize the parent `<StreamingResponse fullText={msg.response} />` if needed.

## E.2 — Report Generator Failure Modes

### 🔴 E.2.1 — Missing template file
**Risk:** PROMPT B.4 doesn't actually create the markdown files (Cursor sometimes generates the router but skips the templates).
**Fix:** Audit step in Prompt D.1 checks file existence. Backend startup logs a warning if any template file is missing.
```python
# api/main.py startup
TEMPLATES = ["quarterly_performance.md", "intervention_priority.md", "executive_summary.md"]
for t in TEMPLATES:
    path = f"api/templates/reports/{t}"
    if not os.path.exists(path):
        logger.warning(f"Missing report template: {path}")
```

### 🔴 E.2.2 — `format_map` KeyError
**Risk:** Template has `{some_field}` that the values dict doesn't supply. `format_map` raises KeyError.
**Fix:** ✅ Use a defaultdict-style formatter that returns the literal `{key}` for missing values:
```python
class SafeDict(dict):
    def __missing__(self, key):
        return f"[MISSING: {key}]"

markdown = template.format_map(SafeDict(values_dict))
```
This makes missing fields visible in the output rather than crashing — easier to spot and fix during dev.

### 🔴 E.2.3 — Region code mapping gap
**Risk:** Filename uses `region_code` (e.g., "R8") but the mapping `Region VIII → R8` doesn't exist for all 17 regions.
**Fix:** Maintain a constant map in `api/intel/region_codes.py`:
```python
REGION_CODE_MAP = {
    "Region I": "R1", "Region II": "R2", "Region III": "R3",
    "Region IV-A": "R4A", "Region IV-B": "R4B", "Region V": "R5",
    "Region VI": "R6", "Region VII": "R7", "Region VIII": "R8",
    "Region IX": "R9", "Region X": "R10", "Region XI": "R11",
    "Region XII": "R12", "Region XIII": "R13",
    "NCR": "NCR", "CAR": "CAR", "BARMM": "BARMM",
}
def region_code(region: str) -> str:
    return REGION_CODE_MAP.get(region, region.replace(" ", "_"))
```

### 🔴 E.2.4 — Clipboard API silent failure
**Risk:** `navigator.clipboard.writeText()` throws on non-HTTPS contexts (any HTTP localhost variant other than `localhost`/`127.0.0.1`). Toast says success but clipboard is empty.
**Fix:** ✅ Wrap in try/catch, fall back to `document.execCommand('copy')` via a hidden textarea, only show "Copied" toast on actual success. ALSO: ensure demo runs on `localhost:5173` (Vite default) NOT `192.168.x.x`.

```jsx
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard.");
  } catch (e) {
    // Fallback for non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast.success("Report copied to clipboard.");
  }
}
```

## E.3 — Sign-Up Flow Failure Modes

### 🔴 E.3.1 — State machine bypass
**Risk:** Multiple `useState` hooks for `phase`, `verified`, `generating` — race conditions allow Generate to fire without Verify.
**Fix:** ✅ MANDATORY: single `useReducer`. The reducer is the only way to transition state. Generate action is rejected from any state other than `'verify'` with checkbox checked.

```jsx
function signupReducer(state, action) {
  switch (action.type) {
    case 'GO_VERIFY':
      if (state.phase !== 'signup') return state;
      return { ...state, phase: 'verify', registrationId: action.id };
    case 'TOGGLE_CONFIRM':
      if (state.phase !== 'verify') return state;
      return { ...state, confirmed: !state.confirmed };
    case 'GO_GENERATING':
      if (state.phase !== 'verify' || !state.confirmed) return state;
      return { ...state, phase: 'generating' };
    case 'GO_SUCCESS':
      if (state.phase !== 'generating') return state;
      return { ...state, phase: 'success', generateResult: action.result };
    case 'BACK_TO_SIGNUP':
      return { ...state, phase: 'signup' };
    default: return state;
  }
}
```

### 🔴 E.3.2 — React Query stale cache after generation
**Risk:** Step 18 expects 3 cards in active registrations. But after generate-pds, the Home tab still shows 2 because React Query cached the old response.
**Fix:** ✅ On successful `GO_SUCCESS`, call:
```js
queryClient.invalidateQueries({ queryKey: ['active-registrations', depedId] });
```
Also invalidate when the user clicks "Back to Home" as belt-and-suspenders.

### 🔴 E.3.3 — PNG preview 404
**Risk:** `preview_image_url` returns `/static/forms/demo_pds_preview.png` but the static mount is missing or the file is in the wrong directory.
**Fix:** ✅ Three layers:
1. `api/main.py`: `app.mount("/static", StaticFiles(directory="api/static"), name="static")`
2. Place the PNG at `api/static/forms/demo_pds_preview.png` (NOT `api/templates/forms/`)
3. Optional: symlink from templates dir if you want one source of truth
4. Smoke test: `curl -I http://localhost:8000/static/forms/demo_pds_preview.png` → expect 200

### 🔴 E.3.4 — Download URL CORS
**Risk:** Frontend on `:5173`, backend on `:8000`, browser blocks the download as cross-origin attachment.
**Fix:** ✅ Use `window.location.href = url` (full navigation) NOT `fetch(url)` for the download. Browsers always allow user-initiated navigation. Already specified in Prompt C.8.

### 🔴 E.3.5 — `OUTPUT_DIR` doesn't exist
**Risk:** `/var/polaris/generated` doesn't exist on first deploy. `shutil.copy` raises `FileNotFoundError`.
**Fix:** ✅ Two layers:
1. `api/intel/form_generator.py`: `os.makedirs(OUTPUT_DIR, exist_ok=True)` at module load
2. Docker volume mount in `docker-compose.yml`:
```yaml
api:
  volumes:
    - polaris_generated:/var/polaris/generated
volumes:
  polaris_generated:
```

## E.4 — Dashboard / Demo Continuity Failure Modes

### 🔴 E.4.1 — `activeRegion` lost on page navigation
**Risk:** Clicking "Reports" sidebar icon navigates to `/reports`. The page mounts. `dashboardStore.activeRegion` is reset (because the store was page-scoped, not global) → dropdown defaults to first region, breaking Step 9.
**Fix:** ✅ Ensure `dashboardStore.js` is a Zustand/Context global, NOT a `useState` inside Dashboard.jsx. The store persists across route changes within the SPA.
**Test:** Click Critical Ping (Region VIII) → click Reports sidebar → assert dropdown shows "Region VIII".

### 🔴 E.4.2 — Sidebar layout breaks on Reports page
**Risk:** Reports page is wrapped in its own layout, sidebar disappears, navigating "Back to Dashboard" requires a full reload.
**Fix:** ✅ React Router structure:
```jsx
<Routes>
  <Route element={<DashboardLayout />}>  {/* sidebar persists here */}
    <Route path="/" element={<Dashboard />} />
    <Route path="/reports" element={<ReportGenerator />} />
    <Route path="/teachers-directory" element={<Teachers />} />
  </Route>
  <Route path="/teacher/*" element={<TeacherApp />} />
</Routes>
```

### 🔴 E.4.3 — Map doesn't refly to Region VIII after clicking ping a second time
**Risk:** Idempotent state — clicking the same ping twice does nothing because `activeRegion` is already set.
**Fix:** Force the fly-to via a separate state token:
```js
const { setActiveRegion, triggerFlyTo } = useDashboardStore();
onClick={() => {
  setActiveRegion(ping.region);
  triggerFlyTo(); // increments a counter that MapCanvas watches via useEffect
}}
```

## E.5 — Backend Resilience

### 🔴 E.5.1 — `last_verified_at` race
**Risk:** The 1-hour freshness check is timezone-naive. Server timezone vs DB timezone mismatch makes it always-stale or always-fresh.
**Fix:** ✅ Use timezone-aware datetimes throughout. Postgres TIMESTAMPTZ + Python `datetime.now(timezone.utc)`. Compare only UTC.

### 🔴 E.5.2 — Pydantic strict mode rejects existing data
**Risk:** Pydantic v2 strict mode refuses to coerce. ORM row has `civil_status='Married'` (str) → Literal accepts. But `addr_zip='6500 '` (trailing space) → pattern fails.
**Fix:** ✅ At ORM-to-Pydantic boundary, strip whitespace via a model_validator. Or use `field_validator(mode='before')` to clean.

### 🔴 E.5.3 — Concurrent register attempts
**Risk:** Double-click on Sign Up creates two `event_registrations` rows. UNIQUE constraint catches one but the user sees a 500 instead of 409.
**Fix:** ✅ Catch `IntegrityError` in the register handler, return 409 with friendly message.

### 🔴 E.5.4 — Status PATCH allows illegal transitions
**Risk:** Frontend bug sends PATCH `status='completed'` from `forms_generated`. Backend updates blindly.
**Fix:** ✅ Server-side enforcement of `ALLOWED_TRANSITIONS` dict (mirror of Part A §A.1). Reject 422 if transition not allowed. NEVER trust the client.

## E.6 — Demo-Day Operational

### 🔴 E.6.1 — Forgot to set `PITCH_MODE` on the demo machine
**Risk:** Recording day, you spin up the stack with `docker compose up`, both env vars default to `false`, STARBOT calls real Gemini, hangs for 30s, demo blows up.
**Fix:** ✅ Hard-code a pre-flight check at the top of `api/main.py`:
```python
@app.on_event("startup")
async def startup_banner():
    mode = "🎬 PITCH MODE (canned responses)" if app.state.pitch_mode else "🚨 LIVE LLM MODE"
    print("=" * 60)
    print(f"POLARIS API STARTING — {mode}")
    print("=" * 60)
```
And a Makefile target `make demo-up` that explicitly exports both env vars.

### 🔴 E.6.2 — Browser cache stale between runs
**Risk:** Run demo, refresh, repeat → React Query cache, browser HTTP cache, service workers all conspire to show stale data.
**Fix:** ✅ Before recording, hard-reload (Cmd+Shift+R) AND run `make demo-reset` (Prompt D.2) to wipe transient DB state.

### 🔴 E.6.3 — Network requests visible in dev tools during recording
**Risk:** You forget to close DevTools, the recording shows the network panel mid-demo.
**Fix:** Pre-recording checklist: close DevTools, hide bookmarks bar, full-screen the browser, set 1080p resolution.

## E.7 — Supabase-Specific Failure Modes

### 🔴 E.7.1 — Supabase connection refused on cold start
**Risk:** Supabase free-tier projects pause after 1 week of inactivity. First request after a pause takes 10–15 seconds while the project resumes. During a demo cold start, FastAPI's first DB query times out, API returns 500.
**Fix:** Hit the Supabase Dashboard 5 minutes before recording — any Dashboard visit wakes the project. Add to the pre-recording checklist.
**Also:** Set SQLAlchemy `pool_pre_ping=True` so stale connections are detected and recycled:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # detects dead connections
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,          # recycle connections every 5 min
)
```

### 🔴 E.7.2 — Transaction pooler rejects DDL
**Risk:** You accidentally run a migration against `DATABASE_URL` (port 6543, the transaction pooler) instead of `DATABASE_URL_DIRECT` (port 5432). The pooler strips session-level features. `CREATE TYPE` and `CREATE TABLE` may silently fail or behave unpredictably.
**Fix:** Enforce the rule: **migrations always use `DATABASE_URL_DIRECT`**. Add a guard to your migration runner:
```bash
# In Makefile
migrate:
	@echo "Running migrations against DIRECT connection (port 5432)..."
	psql "$(DATABASE_URL_DIRECT)" -f db/migrations/001_init.sql
	psql "$(DATABASE_URL_DIRECT)" -f db/migrations/002_seed.sql
	psql "$(DATABASE_URL_DIRECT)" -f db/migrations/003_v34_module4_and_starbot.sql
```

### 🔴 E.7.3 — Network latency on map/dashboard cold load
**Risk:** v3.1 local Docker DB responds in <5ms. Supabase Singapore from PH adds ~30–60ms per query. The dashboard `GET /regions/` (17 rows) and `GET /intelligence/national-skill-radar` are called on mount. If the combined round-trip exceeds 200ms, the dashboard loads noticeably slower.
**Fix:** This is acceptable for a hackathon. The 30–60ms overhead is invisible to judges. If it bothers you during dev, add `staleTime: 60_000` to your React Query hooks so the dashboard data is fetched once and cached for 60 seconds.

### 🔴 E.7.4 — Both teammates run seed concurrently, duplicate key errors
**Risk:** Person A and Person B both run `002_seed.sql` at the same time. UNIQUE constraints fire, one run fails with duplicate key errors.
**Fix:** Assign migration ownership to one person (Person A). Person B never runs DDL against Supabase. If Person B needs a schema change, they tell Person A. Add `-- MIGRATION OWNER: Person A` as a comment header in each migration file.

---

# APPENDIX

## App.1 — Build Commands

```bash
# First-time setup (once per Supabase project)
source .env
psql "$DATABASE_URL_DIRECT" -f db/migrations/001_init.sql
psql "$DATABASE_URL_DIRECT" -f db/migrations/002_seed.sql
psql "$DATABASE_URL_DIRECT" -f db/migrations/003_v34_module4_and_starbot.sql

# Pitch video build (no db service — Supabase is always on)
# POLARIS_PITCH_MODE and VITE_PITCH_MODE are read from .env via env_file in docker-compose
docker compose up --build

# Hackathon (live LLM) build — only after STARBOT roadmap Phase 1 is done
# Set POLARIS_PITCH_MODE=false and VITE_PITCH_MODE=false in .env first
docker compose up --build

# Reset demo state between recording takes
make demo-reset

# Full audit
python scripts/audit_demo_readiness.py
```

## App.2 — Pre-Recording Checklist

- [ ] Supabase project is AWAKE (visit Dashboard, confirm green status indicator)
- [ ] `psql "$DATABASE_URL_DIRECT" -c "SELECT count(*) FROM regional_scores"` returns 17
- [ ] `make demo-reset` runs cleanly against Supabase (no connection errors)
- [ ] `python scripts/audit_demo_readiness.py` exits 0
- [ ] FastAPI logs show successful DB connection on startup (no "connection refused")
- [ ] Backend logs show `🎬 PITCH MODE`
- [ ] Both teammates have closed any open psql sessions (free-tier has connection limits)
- [ ] `curl /static/forms/demo_pds_preview.png` returns 200
- [ ] Browser at `localhost:5173` (NOT a LAN IP — clipboard API requires this)
- [ ] DevTools closed, bookmarks hidden, full-screen
- [ ] One full Happy Path dry run with no clicks missed
- [ ] Second dry run, this time timed (target: <90s)
- [ ] Voice script ready

## App.3 — Files to Never Touch (Architecture Preservation)

Per the v3.4 patch, these v3.1 files are explicitly **out of scope** for v3.4 changes. If Cursor suggests editing them, push back:

- `db/migrations/001_init.sql` — base schema, additive only via new migration
- `api/intel/scoring.py` — TVI logic, regional score computation
- `api/intel/llm_client.py` — Gemini wrapper (hardening lives in roadmap)
- `api/routers/regions.py` — `GET /regions/` (only audit that PPST fields are returned)
- `api/routers/teachers.py` — except for additive imports
- `api/routers/intelligence.py`
- `api/routers/upload.py`, `extract.py`, `admin.py`
- `frontend/src/components/dashboard/MapCanvas.jsx`
- `frontend/src/components/dashboard/IntelligenceColumn.jsx`
- `frontend/src/components/dashboard/RegionalHealthCard.jsx`
- `frontend/src/components/dashboard/detail-views/*`

## App.4 — Iceboxed Items (Roadmap Awareness)

Per `polaris_starbot_roadmap.md` and v3.4 §7.6, the following are explicitly **NOT** in scope for v3.4 MVP. Do not let Cursor scope-creep into these:

**STARBOT:**
- 2-phase SQL generation architecture
- Conversation history > 4 turns
- Multi-region comparative queries
- RAG over historical reports
- Timeout, retry, circuit breaker (Phase 1 — required for hackathon mode but NOT for pitch video)

**Module 4:**
- Tier 2 fields (gov IDs)
- Tier 3 fields (full PDS — family, work history, etc.)
- Authority to Travel, CSC Form 6, School Clearance generation
- ZIP packet downloads
- Digital signatures
- Notifications (email/push)
- Authentication / RLS
- Signed download URLs with expiry

**Reports:**
- PDF export
- Editable preview
- Report history
- Streaming (intentionally rejected — not chat UX)

## App.5 — Missing Input Flag

**The DOST Hackathon Challenge Statement was not provided in the input set.**

The MVP spec (v3.1 + v3.4 patch) is internally self-consistent and clearly responds to a STAR Program / DOST teacher empowerment framing. The Happy Path tells a complete story without needing the original challenge text. **No blueprint changes are required if the challenge statement is unavailable.**

However, if the challenge statement contains specific evaluation criteria (e.g., "must demonstrate AI explainability", "must include a financial model", "must show inter-region comparison"), those criteria may warrant tweaks to:
- The Key Insight sentence wording (Step 2)
- The recommendations bullets in `recommendations.py`
- An additional STARBOT canned response covering a third theme

If you can share the challenge statement, I'll generate a targeted addendum. Otherwise, proceed with this blueprint as-is.

## App.6 — Collaboration Protocol (Supabase Shared DB)

### Migration ownership
- **Person A** runs all DDL (CREATE, ALTER, seed INSERTs) against Supabase
- **Person B** never touches the schema directly

### Shared DB, separate test space
- Seed a second demo teacher `DEMO-002` for Person B's local testing
- The Happy Path demo recording uses only `DEMO-001`
- `make demo-reset` only clears `DEMO-001` state — it won't break Person B's test data

### Git branching
- Person A: `feat/backend-v34` — all `api/` and `db/` changes
- Person B: `feat/frontend-v34` — all `frontend/` changes
- Merge into `main` after each phase verification passes
- `.env` is in `.gitignore` — never committed

### Communication checkpoints
| Checkpoint | When | What to confirm |
|---|---|---|
| After Phase A | Person A done with migrations + seed | "DB is ready — tables exist, seed verified. You can start hitting endpoints." |
| After Phase B | Person A done with all routers | "All 9 endpoints live. Here are the curl commands that work." Person B starts wiring API calls. |
| After Phase C | Person B done with frontend | "All pages render. Let's do a joint Happy Path walkthrough." |
| Before recording | Both | Run `make demo-reset` + `audit_demo_readiness.py` together on a call |

---

# END OF EXECUTION BLUEPRINT

**Total surface area:** 4 SQL tables, 1 ENUM, 9 backend endpoints, 11 frontend components, 4 hooks, 2 helper modules, 3 templates, 3 demo assets.

**Estimated Cursor execution time:** 4–6 hours of focused Composer-driven work for an experienced operator working in single-prompt-per-phase mode.

**Critical path:** Phase A (DB + seed + assets) → B.1–B.7 (backend) → C.1–C.8 (frontend) → D (validate).

**The North Star:** Part C — 18 steps, under 90 seconds, zero flakes.

*Build it. Test it 5 times. Ship it.*
