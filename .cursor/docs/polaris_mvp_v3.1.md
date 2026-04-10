# Project POLARIS — MVP Specification v3.1

**"Guiding Stars to Every Classroom"**

> This document is the single source of truth for building POLARIS. It is written for use with Cursor (Composer and Chat modes). Every section is self-contained, internally consistent, and implementable without external clarification. When a design decision could go multiple ways, this document picks one and commits to it. Do not deviate from the schema, API signatures, or component names defined here unless a section explicitly marks something as flexible.

---

## 0. Document Changelog

### v2 → v3

| # | Fix Applied |
|---|---|
| C1 | Added `region` and `division` as denormalized columns to `needs_signals` and `trainings` |
| C2 | Added `schools` table; changed `teachers.school` (text) to `teachers.school_id` (FK); `outcomes.school_id` now has a valid FK target |
| C3 | Added `programs` table; `nominations.program_id` now has a valid FK target; `trainings.program_id` FK added |
| C4 | Added composite PK and CHECK constraint to `co_training_links` |
| C5 | Replaced `POST /teachers/{deped_id}/feedback` with `POST /trainings/{training_id}/feedback` |
| C6 | Removed STAR Wrapped feature and `html2canvas` from tech stack entirely |
| M1 | Regularized Supply View radar axes to supply-only metrics |
| M2 | Documented Demand lens inverted color semantics in map section and Health Card section |
| M3 | Added `regional_nat_trends` view; changed Impact View time axis from "per quarter" to "per year" |
| M4 | Specified `deped_id` as `VARCHAR(30)` throughout; all FastAPI path parameters typed as `str` |
| M5 | Settings tab retained with minimal stub spec |
| M6 | Replaced "Claude-3-Vision API" with Google Gemini 1.5 Flash (free tier) across all LLM use cases |
| M7 | Added `regional_scores` as a persistent summary table; map endpoint reads from it, not live JOINs |
| M8 | Fixed tab numbering in Module 4 section headers |
| N1 | `trainings.program_id` added as FK to `programs`; `star_program` renamed to `program_name_cache` |
| N2 | `region` and `division` added to `trainings` |
| N3 | TVI score storage clarified: computed field, not user-editable |
| N4 | `outcomes.year` typed as `SMALLINT` |
| N5 | `star_id` is application-generated at insert time, stored as a regular column |

### v3 → v3.1

| # | Change Applied |
|---|---|
| U1 | **Removed `co_training_links` table** and all dependent features (Section E of Teacher Profile, social graph references in architecture) |
| U2 | **Dashboard layout replaced** with a three-panel Bento layout plus a slim left-side navigation bar |
| U3 | **National Skill Gap Radar added** to Dashboard Intelligence Column (Panel 1); data from `GET /intelligence/national-skill-radar` |
| U4 | **AI Critical Pings feed added** to Dashboard Intelligence Column (Panel 1); rule-based alerts from `regional_scores` |
| U5 | **National Baseline Card redesigned** (Panel 3): donut chart for traffic light distribution, 2×2 bento grid for 4-Factor Core |
| U6 | **PPST-aligned radar axes** replace generic axes on both the Dashboard National Skill Gap Radar and the Teacher Skill Radar in POLARIS-ME |
| U7 | **PPST Semantic Engine added** to POLARIS-INTEL (Section 3.3): auto-tags every training record with PPST axis weights via Gemini |
| U8 | **`ppst_weights` JSONB and `is_ppst_tagged` boolean** added to `trainings` table |
| U9 | **`POST /admin/process-ppst-tags`** admin endpoint added |
| U10 | **`GET /intelligence/national-skill-radar`** read endpoint added |
| U11 | **`critical_pings` JSONB column** added to `regional_scores` table |
| U12 | **`work_history` JSONB column** moved from footnote into the `teachers` DDL |

---

## 1. Architecture Overview

POLARIS is a four-component modular system. For the hackathon, all components run on a single machine via Docker Compose. Each component has a clear boundary and can be deployed independently post-hackathon.

```
┌──────────────────────────────────────────────────────────────┐
│                       PROJECT POLARIS                         │
├──────────────────────────────────────────────────────────────┤
│  POLARIS-ME (Mobile Web)       POLARIS-MAP + BOT (Web)        │
│  Teacher Interface             Coordinator Dashboard           │
│  User: Sir Renato              User: Maricris                  │
├──────────────┬───────────────────────────────────────────────┤
│              │         FastAPI Backend (REST / JSON)           │
├──────────────┴───────────────────────────────────────────────┤
│                  POLARIS-INTEL (Intelligence Layer)            │
│   [Underserved Score]  [TVI Flags]  [PPST Semantic Engine]    │
│   [Feedback Aggregation]  [Demand Signal Processing]           │
├──────────────────────────────────────────────────────────────┤
│                  POLARIS-CORE (Data Backbone)                  │
│   PostgreSQL  |  DepEd Employee No. as Primary Key             │
│   PSA PSGC Baseline (pre-populated on init)                    │
│   PPST-tagged training records (ppst_weights per training)     │
└──────────────────────────────────────────────────────────────┘
                               ↑
                  Google Gemini 1.5 Flash API
     (STARBOT + NLP Extraction + Doc Intelligence + PPST Tagging)
```

**Two user personas:**

| Persona | Interface | Primary Goal |
|---|---|---|
| **Sir Renato** — Science/Math teacher, rural region | POLARIS-ME (mobile web) | See his PPST-aligned skill profile, training history, skill gaps, and self-nominate for programs |
| **Maricris** — STAR Program Coordinator, national level | POLARIS-MAP + BOT (desktop web) | Diagnose underserved regions, explore national PPST skill gaps, and draft reports |

---

## 2. Module 1: POLARIS-CORE (Data Backbone)

### 2.1 — Overview

A PostgreSQL database is the single source of truth for all POLARIS data. A FastAPI (Python) backend exposes RESTful JSON endpoints. All intelligence computations in Module 2 write their results back into this database so that the frontend always reads pre-computed values.

### 2.2 — Data Ingestion Strategy

**MVP path (implemented):** CSV/Excel upload with validation UI. Regional coordinators upload spreadsheets. The backend validates, deduplicates (on `deped_id`), and returns a structured error report (e.g., "3 duplicate records found, 7 missing PSGC codes"). This reflects how government data actually moves.

**Proxy baseline (implemented at init):** On first `docker compose up`, a seed script pre-populates `schools`, `regional_scores`, and sparse `teachers` records using PSA PSGC geographic data and DepEd BEIS school/teacher count proxies. The map renders and the dashboard is fully explorable before a single real CSV is uploaded.

**V2 path (not in MVP):** Structured digital intake form mirroring PDS fields; LLM extraction of legacy scanned documents as primary intake.

### 2.3 — Database Schema

> **Implementation rule:** Run all DDL in the order presented below. Foreign key targets are always defined before the tables that reference them. The migration file is `/db/migrations/001_init.sql`. Seed data is in `/db/migrations/002_seed.sql`.

---

#### 2.3.0 — Custom ENUM Types

```sql
CREATE TYPE subject_area AS ENUM ('Science', 'Mathematics', 'Both');
CREATE TYPE qualification_level AS ENUM ('Bachelor', 'Master', 'Doctorate', 'None');
CREATE TYPE nomination_status AS ENUM (
    'pending_eligibility',
    'eligible',
    'ineligible',
    'enrolled'
);
CREATE TYPE traffic_light AS ENUM ('green', 'yellow', 'red');
```

---

#### 2.3.1 — Table: `schools`

The reference table for all school entities. Must be populated before `teachers` or `outcomes`.

```sql
CREATE TABLE schools (
    school_id       SERIAL          PRIMARY KEY,
    school_name     VARCHAR(255)    NOT NULL,
    region          VARCHAR(100)    NOT NULL,
    division        VARCHAR(100)    NOT NULL,
    psgc_code       CHAR(10)        NOT NULL,
    is_gida         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_region   ON schools(region);
CREATE INDEX idx_schools_division ON schools(division);
CREATE INDEX idx_schools_psgc     ON schools(psgc_code);
```

**Seed note:** The init script inserts one row per school from the DepEd BEIS proxy data. `psgc_code` is the 10-digit PSA code. `is_gida` is sourced from the GIDA school list.

---

#### 2.3.2 — Table: `programs`

All STAR capacity-building programs teachers can be nominated for or trained under. Must be populated before `trainings` or `nominations`.

```sql
CREATE TABLE programs (
    id                  SERIAL          PRIMARY KEY,
    program_name        VARCHAR(100)    NOT NULL UNIQUE,
    subject_area        subject_area    NOT NULL,
    description         TEXT,
    eligibility_rules   JSONB           NOT NULL DEFAULT '{}',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

**`eligibility_rules` JSONB schema (enforced in application layer, not DB):**

```json
{
  "min_years_experience": 2,
  "required_qualification": "Bachelor",
  "required_subject_areas": ["Science", "Mathematics"],
  "max_tvi_score": null,
  "min_tvi_score": null,
  "notes": "Open to all active teachers with relevant specialization."
}
```

**Seed data (insert in `002_seed.sql`):**

| program_name | subject_area | min_years_experience |
|---|---|---|
| ISLA | Science | 2 |
| CBEP | Mathematics | 1 |
| STAR Fellowship | Both | 5 |
| Mobile Training Unit | Both | 0 |

---

#### 2.3.3 — Table: `teachers`

The central entity. Every other table links back to this one.

```sql
CREATE TABLE teachers (
    -- Identity
    deped_id                VARCHAR(30)             PRIMARY KEY,
    star_id                 VARCHAR(50)             NOT NULL UNIQUE,
    first_name              VARCHAR(100)            NOT NULL,
    last_name               VARCHAR(100)            NOT NULL,
    middle_name             VARCHAR(100),

    -- Location (geographic hierarchy, fully denormalized for fast filtering)
    region                  VARCHAR(100)            NOT NULL,
    division                VARCHAR(100)            NOT NULL,
    school_id               INTEGER                 NOT NULL
                                REFERENCES schools(school_id)
                                ON UPDATE CASCADE
                                ON DELETE RESTRICT,
    psgc_code               CHAR(10)                NOT NULL,
    is_gida                 BOOLEAN                 NOT NULL DEFAULT FALSE,

    -- Professional profile
    subject_specialization  VARCHAR(100)            NOT NULL,
    subject_area            subject_area            NOT NULL,
    qualification_level     qualification_level     NOT NULL DEFAULT 'Bachelor',
    position_title          VARCHAR(100),
    years_experience        SMALLINT                NOT NULL DEFAULT 0
                                CHECK (years_experience >= 0),

    -- POLARIS-ME display
    photo_url               TEXT,
    is_profile_public       BOOLEAN                 NOT NULL DEFAULT FALSE,
    work_history            JSONB                   NOT NULL DEFAULT '[]',

    -- TVI (Teacher Vulnerability Index) — computed, never user-editable
    tvi_score               SMALLINT                NOT NULL DEFAULT 0
                                CHECK (tvi_score BETWEEN 0 AND 4),
    tvi_flag_recency        BOOLEAN                 NOT NULL DEFAULT FALSE,
    tvi_flag_mismatch       BOOLEAN                 NOT NULL DEFAULT FALSE,
    tvi_flag_gida           BOOLEAN                 NOT NULL DEFAULT FALSE,
    tvi_flag_outcomes       BOOLEAN                 NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_region          ON teachers(region);
CREATE INDEX idx_teachers_division        ON teachers(division);
CREATE INDEX idx_teachers_school_id       ON teachers(school_id);
CREATE INDEX idx_teachers_subject_area    ON teachers(subject_area);
CREATE INDEX idx_teachers_tvi_score       ON teachers(tvi_score);
CREATE INDEX idx_teachers_is_gida         ON teachers(is_gida);
```

**`star_id` generation rule (application layer):** `star_id = deped_id + "-STAR-" + region_code`. Generated at insert time by the FastAPI handler. Example: `"2018-001234-STAR-R4B"`. Never modified after creation.

**TVI recomputation rule:** The four `tvi_flag_*` booleans and `tvi_score` are **read-only from the frontend**. They are recomputed by `POST /admin/recompute-tvi` (triggered after every CSV upload or on a nightly schedule). The `updated_at` timestamp reflects the last recomputation.

**`work_history` JSONB element schema:**
```json
[
  { "position_title": "Teacher I", "school_name": "Leyte NHS", "year_start": 2018, "year_end": 2021 },
  { "position_title": "Teacher II", "school_name": "Tacloban Science HS", "year_start": 2021, "year_end": null }
]
```
`year_end: null` means the teacher is currently in this position.

---

#### 2.3.4 — Table: `trainings`

One row per training event completed by a teacher. Includes PPST axis weights auto-assigned by the PPST Semantic Engine.

```sql
CREATE TABLE trainings (
    id                      SERIAL          PRIMARY KEY,

    -- Relationships
    teacher_id              VARCHAR(30)     NOT NULL
                                REFERENCES teachers(deped_id)
                                ON DELETE CASCADE,
    program_id              INTEGER
                                REFERENCES programs(id)
                                ON DELETE SET NULL,

    -- Denormalized cache (populated at insert from programs.program_name and teacher location)
    program_name_cache      VARCHAR(100),
    region                  VARCHAR(100)    NOT NULL,
    division                VARCHAR(100)    NOT NULL,

    -- Training details
    module_tag              VARCHAR(100),
    completion_date         DATE            NOT NULL,

    -- PPST Semantic Engine output (NULL until processed by POST /admin/process-ppst-tags)
    ppst_weights            JSONB,
    is_ppst_tagged          BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Feedback (nullable until teacher submits via POST /trainings/{id}/feedback)
    rating                  SMALLINT        CHECK (rating BETWEEN 1 AND 5),
    feedback_text           TEXT,
    feedback_submitted_at   TIMESTAMPTZ,

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trainings_teacher_id     ON trainings(teacher_id);
CREATE INDEX idx_trainings_program_id     ON trainings(program_id);
CREATE INDEX idx_trainings_region         ON trainings(region);
CREATE INDEX idx_trainings_completion     ON trainings(completion_date);
CREATE INDEX idx_trainings_ppst_tagged    ON trainings(is_ppst_tagged);
```

**`ppst_weights` JSONB schema** (written by PPST Semantic Engine, see Section 3.3):
```json
{
  "content_knowledge": 0.8,
  "curriculum_planning": 0.3,
  "research_based_practice": 0.6,
  "assessment_literacy": 0.1,
  "professional_development": 0.4
}
```
Each value is a float between 0.0 and 1.0. All five keys must be present. Values are assigned by Gemini and validated before write.

**`program_name_cache`** is populated at insert time from `programs.program_name` and is never updated. It exists so queries can display the program name without a JOIN when `program_id` is NULL (e.g., historically imported data without a matched program).

---

#### 2.3.5 — Table: `outcomes`

National Achievement Test (NAT) scores at the school level.

```sql
CREATE TABLE outcomes (
    id          SERIAL          PRIMARY KEY,
    school_id   INTEGER         NOT NULL
                    REFERENCES schools(school_id)
                    ON DELETE CASCADE,

    -- Denormalized for aggregation queries
    region      VARCHAR(100)    NOT NULL,
    psgc_code   CHAR(10)        NOT NULL,

    subject     subject_area    NOT NULL,
    nat_score   NUMERIC(5,2)    NOT NULL CHECK (nat_score BETWEEN 0 AND 100),
    year        SMALLINT        NOT NULL CHECK (year BETWEEN 2000 AND 2100),

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (school_id, subject, year)
);

CREATE INDEX idx_outcomes_school_id   ON outcomes(school_id);
CREATE INDEX idx_outcomes_region      ON outcomes(region);
CREATE INDEX idx_outcomes_subject     ON outcomes(subject);
CREATE INDEX idx_outcomes_year        ON outcomes(year);
```

---

#### 2.3.6 — Table: `needs_signals`

Free-text training needs submitted by teachers through POLARIS-ME.

```sql
CREATE TABLE needs_signals (
    id              SERIAL          PRIMARY KEY,
    teacher_id      VARCHAR(30)     NOT NULL
                        REFERENCES teachers(deped_id)
                        ON DELETE CASCADE,

    -- Denormalized at insert from teacher record
    region          VARCHAR(100)    NOT NULL,
    division        VARCHAR(100)    NOT NULL,

    -- Content
    raw_text        TEXT            NOT NULL,

    -- LLM-extracted fields (NULL until processed by POST /admin/process-needs-signals)
    subject_tag     VARCHAR(100),
    topic_tag       VARCHAR(100),
    context_tag     VARCHAR(100),

    is_processed    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_needs_region       ON needs_signals(region);
CREATE INDEX idx_needs_teacher      ON needs_signals(teacher_id);
CREATE INDEX idx_needs_processed    ON needs_signals(is_processed);
CREATE INDEX idx_needs_created      ON needs_signals(created_at);
```

**Processing rule:** When a teacher submits via POLARIS-ME, the row is inserted with `is_processed = FALSE`. The background job `POST /admin/process-needs-signals` queries all unprocessed rows, sends each to Gemini with the `CATEGORIZE_NEED` prompt, writes back the three tag fields, and sets `is_processed = TRUE`.

---

#### 2.3.7 — Table: `nominations`

Tracks a teacher's self-nomination for a STAR program and the eligibility check result.

```sql
CREATE TABLE nominations (
    id                  SERIAL              PRIMARY KEY,
    teacher_id          VARCHAR(30)         NOT NULL
                            REFERENCES teachers(deped_id)
                            ON DELETE CASCADE,
    program_id          INTEGER             NOT NULL
                            REFERENCES programs(id)
                            ON DELETE CASCADE,

    status              nomination_status   NOT NULL DEFAULT 'pending_eligibility',
    eligibility_result  JSONB,

    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- One active nomination per teacher per program
    UNIQUE (teacher_id, program_id)
);

CREATE INDEX idx_nominations_teacher ON nominations(teacher_id);
CREATE INDEX idx_nominations_program ON nominations(program_id);
CREATE INDEX idx_nominations_status  ON nominations(status);
```

**`eligibility_result` JSONB schema:**
```json
{
  "passed": ["min_years_experience", "required_subject_area"],
  "failed": ["required_qualification"],
  "summary": "Ineligible: qualification level below Bachelor's degree requirement."
}
```

---

#### 2.3.8 — Table: `regional_scores`

**Pre-aggregated summary table.** The map endpoint reads exclusively from this table. It is never computed live. Rewritten by `POST /admin/recompute-regional-scores` (triggered after every CSV upload and on a nightly schedule).

```sql
CREATE TABLE regional_scores (
    region                  VARCHAR(100)    PRIMARY KEY,
    psgc_code               CHAR(10),

    -- Composite scores (0.00 – 100.00)
    underserved_score       NUMERIC(5,2)    NOT NULL DEFAULT 0,
    supply_subscore         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    impact_subscore         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    demand_subscore         NUMERIC(5,2)    NOT NULL DEFAULT 0,

    -- Raw 4-Factor Core values (used by hover tooltip and Health Card)
    teacher_student_ratio   NUMERIC(8,4),
    specialization_pct      NUMERIC(5,2),
    star_coverage_pct       NUMERIC(5,2),
    avg_nat_score           NUMERIC(5,2),
    demand_signal_count     INTEGER         NOT NULL DEFAULT 0,

    -- PPST axis averages for this region (0.000 – 1.000, derived from trainings.ppst_weights)
    ppst_content_knowledge          NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_curriculum_planning        NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_research_based_practice    NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_assessment_literacy        NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_professional_development   NUMERIC(4,3)    NOT NULL DEFAULT 0,

    -- Rule-based alert pings for the Intelligence Column (Panel 1)
    critical_pings          JSONB           NOT NULL DEFAULT '[]',

    -- Derived
    total_teachers          INTEGER         NOT NULL DEFAULT 0,
    traffic_light           traffic_light   NOT NULL DEFAULT 'red',

    computed_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

**Score computation rules** (implemented in `intel/scoring.py`):

| Factor | Weight | Source |
|---|---|---|
| Teacher-to-student ratio (Science/Math) | 0.30 | `COUNT(teachers) / proxy_student_count` per region |
| Specialization match rate | 0.25 | `COUNT WHERE subject_area matches subject_specialization bucket / total teachers` |
| STAR coverage rate (last 3 years) | 0.25 | `COUNT DISTINCT teacher_id WHERE completion_date >= NOW()-3yrs / total teachers` |
| Average NAT score | 0.20 | `AVG(nat_score) FROM regional_nat_trends WHERE year = MAX(year)` |

Each factor is min-max normalized to 0–100 across all 17 regions before weighting.

**Traffic light thresholds:**
- `green`: `underserved_score >= 70`
- `yellow`: `55 <= underserved_score < 70`
- `red`: `underserved_score < 55`

**Sub-score definitions:**
- `supply_subscore` = `teacher_student_ratio` normalized (60%) + `specialization_pct` normalized (40%)
- `impact_subscore` = `star_coverage_pct` normalized (50%) + `avg_nat_score` normalized (50%)
- `demand_subscore` = `demand_signal_count` normalized to 0–100. **Color semantics are inverted on the map:** higher value = redder = more unmet demand.

**PPST axis averages:** Mean of `ppst_weights[axis]` across all `trainings` records where `is_ppst_tagged = TRUE` and `region = this region`. Updated by `POST /admin/recompute-regional-scores`.

**`critical_pings` JSONB element schema:**
```json
[
  { "level": "CRITICAL", "region": "Region VIII", "message": "Region VIII is in the red zone (Score: 42)", "factor": "underserved_score" },
  { "level": "WARNING",  "region": "Region V",    "message": "Region V — only 31% of teachers teaching within specialization", "factor": "specialization_pct" }
]
```

**Alert generation rules** (evaluated at recompute time, written to `critical_pings`):

| Condition | Level | Message Template |
|---|---|---|
| `underserved_score < 55` | CRITICAL | `"{region} is in the red zone (Score: {score})"` |
| `specialization_pct < 40` | WARNING | `"{region} — only {pct}% of teachers teaching within specialization"` |
| `star_coverage_pct < 30` | WARNING | `"{region} — STAR coverage below 30% ({pct}%)"` |
| `ppst_assessment_literacy < 0.4` | GAP | `"{region} — Assessment Literacy critically low across PPST domains"` |

---

#### 2.3.9 — View: `regional_nat_trends`

Read-only view. Aggregates school-level NAT scores to regional yearly averages. Used by the Impact View chart and by the Underserved Score computation.

```sql
CREATE VIEW regional_nat_trends AS
SELECT
    o.region,
    o.subject,
    o.year,
    ROUND(AVG(o.nat_score), 2)      AS avg_nat_score,
    COUNT(DISTINCT o.school_id)     AS school_count
FROM outcomes o
GROUP BY o.region, o.subject, o.year
ORDER BY o.region, o.subject, o.year;
```

---

### 2.4 — Teacher Vulnerability Index (TVI)

A composite score (0–4) per teacher from four binary flags. Rule-based, not ML. Transparent and auditable.

| Flag | Condition | Source |
|---|---|---|
| `tvi_flag_recency` | No STAR training in the last 5 years (or no training record at all) | `MAX(completion_date) < NOW() - INTERVAL '5 years'` from `trainings` |
| `tvi_flag_mismatch` | Teacher's `subject_area` does not match `subject_specialization` bucket | Application-layer string matching |
| `tvi_flag_gida` | `teachers.is_gida = TRUE` | Direct field read |
| `tvi_flag_outcomes` | Teacher's school's latest NAT score is below the regional average for that subject | JOIN `outcomes` → `regional_nat_trends` |

`tvi_score = CAST(tvi_flag_recency AS INT) + CAST(tvi_flag_mismatch AS INT) + CAST(tvi_flag_gida AS INT) + CAST(tvi_flag_outcomes AS INT)`

**Priority flag:** Teachers with `tvi_score >= 3` are labeled "Priority" in the dashboard. This is the primary intervention targeting signal.

**Recomputation:** Triggered by `POST /admin/recompute-tvi`. Updates all four flag columns, `tvi_score`, and `updated_at` on every `teachers` row. Runs automatically after every CSV upload.

---

### 2.5 — API Endpoints

All endpoints return JSON. All error responses follow the shape `{ "detail": "error message" }`. All `deped_id` path parameters are typed as `str` in FastAPI. Authentication is out of scope for the MVP — all endpoints are open.

#### Data Read Endpoints

```
GET  /regions/
     Returns: List of all 17 region objects from regional_scores.
     Shape: [{
       region, psgc_code,
       underserved_score, supply_subscore, impact_subscore, demand_subscore,
       traffic_light, total_teachers,
       teacher_student_ratio, specialization_pct, star_coverage_pct,
       avg_nat_score, demand_signal_count,
       ppst_content_knowledge, ppst_curriculum_planning,
       ppst_research_based_practice, ppst_assessment_literacy,
       ppst_professional_development,
       critical_pings, computed_at
     }]

GET  /regions/{region_name}/profile
     Returns: Full regional profile for one region.
     Shape: regional_scores row
            + top 10 demand topics from needs_signals (last 90 days)
            + regional_nat_trends for all available years
            + teacher count by TVI bucket: { priority: int, warning: int, ok: int }

GET  /regions/{region_name}/nat-trends
     Returns: Data from regional_nat_trends view for this region.
     Shape: [{ subject, year, avg_nat_score, school_count }]

GET  /regions/{region_name}/demand-topics
     Returns: Top 20 aggregated demand topics for this region (last 90 days, is_processed = TRUE only).
     Shape: [{ topic_tag, subject_tag, demand_count, unique_teachers }]

GET  /intelligence/national-skill-radar
     Returns: National PPST axis averages and static target benchmarks.
     Shape: {
       "current": {
         "content_knowledge": float,
         "curriculum_planning": float,
         "research_based_practice": float,
         "assessment_literacy": float,
         "professional_development": float
       },
       "target": { ...same five keys, static values from intel/skill_targets.py }
     }
     Note: "current" values are the mean of regional_scores.ppst_* across all 17 regions.

GET  /teachers/{deped_id}/profile
     Returns: Full teacher record including school name (JOIN schools),
              training count, latest training date, TVI breakdown, and nominations.
     Shape: teachers row
            + school_name: string
            + training_count: int
            + latest_training_date: date | null
            + nominations: [{ program_id, program_name, status, eligibility_result }]

GET  /teachers/{deped_id}/trainings
     Returns: All training records for this teacher, ordered by completion_date DESC.
     Shape: [{
       id, program_id, program_name_cache, module_tag,
       completion_date, ppst_weights, is_ppst_tagged,
       rating, feedback_text, feedback_submitted_at
     }]

GET  /teachers/{deped_id}/nominations
     Returns: All nominations for this teacher.
     Shape: [{ id, program_id, program_name, status, eligibility_result, created_at }]
```

#### Data Write Endpoints

```
POST /teachers/{deped_id}/need
     Body: { "raw_text": "string (required, max 500 chars)" }
     Action: Inserts into needs_signals. Sets region/division from teachers record.
             Sets is_processed = FALSE.
     Returns: { "id": int }

POST /trainings/{training_id}/feedback
     Body: { "rating": integer (1–5, required), "feedback_text": "string (optional, max 500 chars)" }
     Action: Updates trainings.rating, trainings.feedback_text,
             trainings.feedback_submitted_at = NOW().
     Returns 404 if training_id not found.
     Returns 409 if feedback_submitted_at is already set (already rated).

POST /teachers/{deped_id}/nominate
     Body: { "program_id": integer (required) }
     Action: Fetches teacher record and programs.eligibility_rules.
             Runs rule evaluation in application layer (not LLM).
             Inserts or updates nominations row (ON CONFLICT DO UPDATE).
     Returns: { "status": nomination_status, "eligibility_result": object }

PATCH /teachers/{deped_id}
     Body: { "is_profile_public": bool (optional), "work_history": array (optional) }
     Action: Updates only the provided fields on the teachers row. No other fields
             are patchable via this endpoint.
     Returns: Updated teachers row.

POST /upload/csv
     Body: multipart/form-data with CSV file.
     Action: Validates rows, deduplicates on deped_id, imports to teachers table.
             On success: internally triggers /admin/recompute-tvi and
             /admin/recompute-regional-scores and /admin/process-ppst-tags.
     Returns: { "inserted": int, "updated": int, "errors": [{ "row": int, "message": str }] }

POST /extract/document
     Body: multipart/form-data with image file (JPEG/PNG/PDF page, max 10MB).
     Action: Sends image to Gemini 1.5 Flash Vision API with EXTRACT_DOCUMENT prompt.
             Validates response schema before returning.
     Returns: { "name": str, "deped_id": str, "training_name": str,
                "completion_date": str (YYYY-MM-DD), "issuing_body": str }
     Returns 422 if Gemini output fails schema validation.

POST /chat
     Body: { "message": "string (required)", "region_context": { ...regional_scores row } | null }
     Action: Builds Gemini prompt with message + region_context.
             Uses STARBOT_QUERY or DRAFT_MEMO system prompt depending on message intent.
     Returns: { "response": "string", "sources": ["string"] }
```

#### Admin / Background Job Endpoints

```
POST /admin/recompute-tvi
     Action: Recomputes tvi_flag_recency, tvi_flag_mismatch, tvi_flag_gida,
             tvi_flag_outcomes, and tvi_score for every row in teachers.
             Updates updated_at. Not exposed in any UI.
     Returns: { "updated": int }

POST /admin/recompute-regional-scores
     Action: Recomputes all columns in regional_scores from live data,
             including PPST axis averages from trainings.ppst_weights
             and critical_pings from alert rules.
     Returns: { "regions_updated": int }

POST /admin/process-needs-signals
     Action: Queries needs_signals WHERE is_processed = FALSE.
             Sends each raw_text to Gemini with CATEGORIZE_NEED prompt.
             Writes back subject_tag, topic_tag, context_tag.
             Sets is_processed = TRUE.
     Returns: { "processed": int, "failed": int }

POST /admin/process-ppst-tags
     Action: Queries trainings WHERE is_ppst_tagged = FALSE.
             Sends program_name_cache + module_tag to Gemini with CATEGORIZE_PPST prompt.
             Validates returned ppst_weights JSON (exactly 5 keys, all floats 0.0–1.0).
             Writes back ppst_weights. Sets is_ppst_tagged = TRUE.
             Skips and logs rows where Gemini output fails validation.
     Returns: { "tagged": int, "failed": int }
```

---

## 3. Module 2: POLARIS-INTEL (Intelligence Layer)

### 3.1 — Underserved Score (Regional)

Defined fully in Section 2.3.8 (`regional_scores` table and score computation rules). INTEL is the computation engine; CORE is the storage layer.

The four factors and their weights are the **4-Factor Core** — the consistent data spine that appears across every user-facing surface:

| Factor | Weight | Displayed In |
|---|---|---|
| Teacher-to-student ratio | 0.30 | Map tooltip, Health Card Summary, Supply radar |
| Specialization match rate | 0.25 | Map tooltip, Health Card Summary, Supply radar |
| STAR coverage rate | 0.25 | Map tooltip, Health Card Summary, Impact chart |
| Average NAT score | 0.20 | Map tooltip, Health Card Summary, Impact chart |

### 3.2 — LLM Engine (Single Engine, Multiple Uses)

**Model:** `gemini-1.5-flash` via Google AI Studio API (free tier).
- **Free tier limits:** 15 requests/minute, 1 million tokens/day, 1,500 requests/day. Sufficient for all hackathon and demo traffic.
- **Vision capability:** Yes — handles image/PDF input for document extraction.
- **API client:** One shared `GeminiClient` class in `intel/llm_client.py`. Parameterized by `system_prompt_key` per use case.
- **Upgrade path (state for judges):** The system is model-agnostic at the prompt level. Upgrading to `gemini-1.5-pro`, `gemini-2.0-flash`, or any OpenAI-compatible model requires changing only the `model` string in the client config.

**All LLM use cases handled by one engine:**

| Use Case | Input | Output | System Prompt Key |
|---|---|---|---|
| PDS / certificate extraction | Image bytes (JPEG/PNG) | JSON: name, deped_id, training_name, completion_date, issuing_body | `EXTRACT_DOCUMENT` |
| Needs signal categorization | Free-text string | JSON: subject_tag, topic_tag, context_tag | `CATEGORIZE_NEED` |
| PPST axis tagging | `program_name_cache + module_tag` string | JSON: ppst_weights object (5 keys, float 0.0–1.0 each) | `CATEGORIZE_PPST` |
| Feedback theme extraction | Batch of feedback_text strings | JSON: top 3 themes with frequency counts | `EXTRACT_THEMES` |
| Demand topic extraction | Batch of needs_signal rows per region | JSON: ranked list of topic_tag + count | `EXTRACT_DEMAND_TOPICS` |
| STARBOT query | Natural language + region_context JSON | Human-readable answer with bracketed source citations | `STARBOT_QUERY` |
| Policy memo drafting | Structured template + query results | Formatted text draft, marked [AI-GENERATED DRAFT] | `DRAFT_MEMO` |

**All LLM outputs are validated against their expected schema before being written to the database. If validation fails, the raw response is logged and the operation returns a 422 error.**

### 3.3 — PPST Semantic Engine

**Purpose:** Automatically categorize every training record into the five PPST-aligned competency domains defined by DepEd Order No. 42, s. 2017. This eliminates manual tagging overhead and makes the Skill Radar charts fully automated from existing CSV data.

**The five PPST axes** — these exact key names are used across all code, system prompts, API responses, and database columns:

| Axis Key | Display Label | PPST Reference | Description |
|---|---|---|---|
| `content_knowledge` | Content Knowledge | Domain 1 | Mastery of Science/Math content and its application across curriculum |
| `curriculum_planning` | Curriculum Planning | Domain 4 | Ability to translate curriculum requirements into relevant learning activities |
| `research_based_practice` | Research-Based Practice | Strand 1.2 | Application of research principles to enhance professional and classroom practice |
| `assessment_literacy` | Assessment Literacy | Domain 5 | Use of assessment tools and data to monitor and improve learner progress |
| `professional_development` | Professional Development Goals | Domain 7 | Commitment to personal growth and lifelong learning |

**Processing flow:**
1. A training record is inserted (via CSV upload or Photo-to-Form) with `is_ppst_tagged = FALSE`.
2. `POST /admin/process-ppst-tags` runs (triggered after CSV upload, or nightly schedule).
3. For each untagged training, backend sends `program_name_cache + " — " + module_tag` to Gemini with `CATEGORIZE_PPST` system prompt.
4. Gemini returns JSON with all five axis keys as floats (0.0–1.0).
5. Backend validates: exactly 5 keys present, all values floats in [0.0, 1.0], sum > 0.
6. On pass: writes `ppst_weights`, sets `is_ppst_tagged = TRUE`.
7. On fail: logs raw Gemini response, skips row, increments `failed` counter in response.

**Example CATEGORIZE_PPST input:**
```
"Inquiry-Based Physics Masterclass — Module 3: Experimental Design and Data Analysis"
```

**Example CATEGORIZE_PPST output:**
```json
{
  "content_knowledge": 0.9,
  "curriculum_planning": 0.4,
  "research_based_practice": 0.8,
  "assessment_literacy": 0.5,
  "professional_development": 0.2
}
```

**Teacher Skill Radar computation** (in `intel/scoring.py`, called by `GET /teachers/{deped_id}/trainings` response processing):

For each of the five PPST axes, a teacher's current skill level =  weighted average of `ppst_weights[axis]` across all their PPST-tagged training records, where:
- Trainings completed in the last 3 years: weight = 1.0
- Trainings older than 3 years: weight = 0.5

Result is a float 0.0–1.0, scaled to 0–100 for radar chart display.

**National Skill Gap Radar computation** (feeds `GET /intelligence/national-skill-radar`):

National current average per axis = mean of `regional_scores.ppst_{axis}` across all 17 regions. Target values are static constants in `intel/skill_targets.py`, defined per position_title tier (Teacher I, Teacher II, Teacher III, Master Teacher I).

### 3.4 — Demand Signal Aggregation

Processed needs signals are aggregated via SQL for the Coordinator Dashboard. Powers `GET /regions/{region_name}/demand-topics`:

```sql
SELECT
    ns.region,
    ns.subject_tag,
    ns.topic_tag,
    COUNT(*)                            AS demand_count,
    COUNT(DISTINCT ns.teacher_id)       AS unique_teachers
FROM needs_signals ns
WHERE
    ns.is_processed = TRUE
    AND ns.created_at >= NOW() - INTERVAL '90 days'
    AND ns.region = :region_name
GROUP BY ns.region, ns.subject_tag, ns.topic_tag
ORDER BY demand_count DESC
LIMIT 20;
```

### 3.5 — Training Effectiveness Scoring

Training feedback (`rating` 1–5 + `feedback_text`) is aggregated per program per region. Programs consistently scoring below 3.0 are flagged for curriculum review in the Impact View. Comment themes are extracted in batch via the `EXTRACT_THEMES` use case (nightly). Feeds the scatter marker coloring on the Impact View chart.

**Aggregation query for Impact View scatter markers:**

```sql
SELECT
    t.region,
    t.program_id,
    DATE_TRUNC('year', t.completion_date)   AS year,
    ROUND(AVG(t.rating), 2)                 AS avg_rating,
    COUNT(*)                                AS training_count
FROM trainings t
WHERE t.rating IS NOT NULL
  AND t.region = :region_name
GROUP BY t.region, t.program_id, DATE_TRUNC('year', t.completion_date)
ORDER BY year ASC;
```

---

## 4. Module 3: POLARIS-MAP + BOT (Coordinator Dashboard)

**User:** Maricris — STAR Program Coordinator.

**Design principle:** Three questions, answered in order:
1. **Where should I look?** → Answered by the map (Panel 2) at a glance.
2. **What is happening there?** → Answered by the Regional Health Card (Panel 3).
3. **What do I do about it?** → Answered by STARBOT (floating).

### 4.1 — Layout: Bento Dashboard

The dashboard is a single-page web app (React + Tailwind CSS) with four structural zones. No page reloads. All state is managed via React global state in `store/dashboardStore.js`: `activeRegion` (string | null), `activeLens` (string: 'overall' | 'supply' | 'impact' | 'demand').

```
┌────┬──────────────────────┬─────────────────────────────┐
│    │   Panel 1            │   Panel 3                   │
│    │   Intelligence       │   National Baseline /       │
│ S  │   Column (20%)       │   Regional Health Card (40%)│
│ i  │                      │                             │
│ d  │   [PPST Radar]       │   [Search Bar]              │
│ e  │                      │   [Donut Chart]             │
│ b  │   [AI Pings Feed]    │   [2×2 Factor Grid]         │
│ a  │                      │                             │
│ r  ├──────────────────────┤                             │
│    │   Panel 2            │                             │
│    │   Map Canvas (40%)   │                             │
│    │   [Lens Selector]    │                             │
│    │   [Choropleth Map]   │                             │
│    │                      │                             │
└────┴──────────────────────┴─────────────────────────────┘
                                       ↘ [STARBOT floating]
```

**Left sidebar (~48px wide, fixed):**
- Icon-only vertical navigation bar. Icons with tooltips on hover.
- Three icons: `LayoutDashboard` (Dashboard, active state), `Users` (Teacher Directory — links to a read-only filterable teacher list, MVP-scoped), `FileText` (Reports — visible but disabled, "Coming soon" tooltip).
- A faint 1px vertical divider separates the sidebar from the panel area.

**Lens Selector:**
- Positioned at the top of Panel 2.
- Four-button segmented control: **Overall | Supply | Impact | Demand**.
- One button active at a time. Clicking sets `activeLens` state, recoloring the map polygons instantly.
- No network request on lens switch — all score data is pre-loaded on mount from `GET /regions/`.

**On mount:** Dashboard fetches `GET /regions/` and `GET /intelligence/national-skill-radar` in parallel. Both responses are cached by React Query for the session.

---

### 4.2 — Panel 1: Intelligence Column (20%)

A vertically stacked column with two bento boxes. Positioned left of the map. Loads data from the two parallel mount requests.

#### Bento Box 1 — National Skill Gap Radar

A pentagon-shaped SVG radar chart (Recharts `RadarChart`) visualizing **national** aggregate teacher competency across the five PPST axes.

- **Teal polygon:** National current average per axis (`GET /intelligence/national-skill-radar` → `current` object).
- **Gold polygon:** National target benchmark per axis (`GET /intelligence/national-skill-radar` → `target` object).
- **Axis order (clockwise from top):**
  1. Content Knowledge *(Domain 1)*
  2. Curriculum Planning *(Domain 4)*
  3. Research-Based Practice *(Strand 1.2)*
  4. Assessment Literacy *(Domain 5)*
  5. Professional Development Goals *(Domain 7)*
- **Title:** "National Skill Gap — PPST Domains"
- **Hover on axis label:** Tooltip shows national average value + gap to target (e.g., "Assessment Literacy: 0.52 / Target: 0.80 — Gap: 0.28").

#### Bento Box 2 — AI Critical Pings

A scrollable feed of high-priority, rule-based alerts. Data from `GET /regions/` → `critical_pings` field (pre-computed in `regional_scores`).

**UI behavior:**
- Each ping is a clickable card with a severity badge (CRITICAL / WARNING / GAP) and the alert message.
- Clicking a ping: sets `activeRegion` to that region, triggers the map fly-to animation, opens the Regional Health Card in Panel 3.
- Sort order: CRITICAL first, then WARNING, then GAP.
- If no alerts exist: displays "All regions are within target thresholds."

---

### 4.3 — Panel 2: Geospatial Canvas (40%)

The interactive choropleth map. Built on Leaflet.js with pre-bundled Philippine GeoJSON boundary files for all 17 regions.

**Map behavior:**
- Loads all 17 region polygons on mount. Color data comes from the cached `GET /regions/` response.
- Lens switches recolor all polygons instantly by reading the appropriate score field from cached data.
- Clicking a region: triggers a fly-to zoom animation, sets `activeRegion`, opens the Regional Health Card in Panel 3.

**Lens color mapping:**

| Lens (`activeLens`) | Color Source Field | Color Direction | Map Legend Text |
|---|---|---|---|
| `overall` | `underserved_score` | High = Green, Low = Red | "Underserved Score (0–100)" |
| `supply` | `supply_subscore` | High = Green, Low = Red | "Supply Score (0–100)" |
| `impact` | `impact_subscore` | High = Green, Low = Red | "Impact Score (0–100)" |
| `demand` | `demand_subscore` | **High = Red, Low = Green** | **"Red = High Unmet Demand"** |

**Demand lens inversion is explicit in the UI:** When `activeLens === 'demand'`, the map legend text renders in red and reads `"Red = High Unmet Demand"`. This is the only lens with inverted color semantics.

**Hover tooltip** (appears on mouseover, disappears on mouseout — no buttons, no actions):
- Region name
- Overall Underserved Score (always shown regardless of active lens)
- Active lens sub-score (if `activeLens` is not `'overall'`)
- The 4 Core Factor raw values: `teacher_student_ratio`, `specialization_pct`, `star_coverage_pct`, `avg_nat_score`

---

### 4.4 — Panel 3: Dynamic Workspace (40%)

Controlled by `activeRegion` global state. Switches between National Baseline Card (null) and Regional Health Card (string).

#### National Baseline Card (Default — `activeRegion === null`)

**Search bar (top):** Wide autocomplete input. Typing filters a dropdown of region names. Selecting a region sets `activeRegion` and triggers the fly-to animation on the map.

**Context label:** Large bold heading: `"NATIONAL VIEW"`.

**Distribution donut chart:** A Recharts `PieChart` (donut style, inner radius 60%) showing the count of regions in each traffic light bucket. Three segments: Critical (red), Warning (yellow), Healthy (green). Center label: "17 Regions". Legend below: e.g., `3 Critical | 9 Warning | 5 Healthy`. Data derived from `GET /regions/` → `traffic_light` field.

**2×2 Core Factor Grid:** Four bento boxes showing the **national average** for each of the 4-Factor Core metrics. Values are computed client-side as the mean across all 17 items in the `GET /regions/` response.

| Box Position | Metric | Value Field |
|---|---|---|
| Top-left | Teacher-to-Student Ratio | `teacher_student_ratio` |
| Top-right | Subject Specialization % | `specialization_pct` |
| Bottom-left | STAR Program Coverage % | `star_coverage_pct` |
| Bottom-right | Average NAT Score | `avg_nat_score` |

Each box displays: metric label, national average value (formatted), and a trend indicator (▲ / ▼ / —) for YoY change where data permits.

#### Regional Health Card (`activeRegion !== null`)

Triggered by clicking a map region or selecting from the autocomplete.

**Header strip (always visible):**
- Region name (bold)
- Traffic light status chip (colored pill: green / yellow / red)
- Overall Underserved Score (numeric)
- Dismiss (×) button → sets `activeRegion` to null, returns Panel 3 to National Baseline Card

**Key Insight sentence** (below header — rule-based, not LLM, renders instantly):
Assembled using one of four string templates. Template chosen by identifying which of the 4 factors is furthest below the national average for the selected region. Example:
`"Region VIII has the lowest Science specialization rate nationally (34%) and STAR coverage has declined year-over-year."`

**Two tabs:**

**Tab 1 — Summary (default):**
- Displays the 4 Core Factors as a vertical list of labeled values.
- Each factor: raw value + national average comparison (e.g., `↓ 12% below national`) + trend indicator (▲▼— YoY where data exists).

**Tab 2 — Detail:**
- Three-button view switcher: **Supply | Impact | Demand**.
- Toggles the chart rendered below. Scoped to the active region. Does not affect the map lens.

---

### 4.5 — Detail Visualizations

Rendered inside the Regional Health Card's Detail tab. One chart per view.

#### Supply View — Radar Chart

Four-axis radar chart (Recharts `RadarChart`). All axes are supply-side metrics for the selected region. Data from `GET /regions/{region_name}/profile`.

| Axis | Value Source | Description |
|---|---|---|
| Teacher Density | `teacher_student_ratio` | Teachers per 1,000 students in Science/Math |
| Specialization Rate | `specialization_pct` | % of teachers teaching within declared subject |
| Qualification Rate | Computed from `GET /regions/{region_name}/profile` → teacher qualification breakdown | % of teachers with Master's or Doctorate |
| GIDA Coverage | Computed from teacher records for this region | % of teachers assigned to GIDA-classified schools |

The radar shape reveals whether the supply problem is balanced or lopsided.

#### Impact View — Dual-Axis Combo Chart

Combines three data layers on a shared **year** time axis (Recharts `ComposedChart`). Data from `GET /regions/{region_name}/nat-trends` and the training effectiveness aggregation query.

- **Bars (left Y-axis):** Training volume per year — count of `trainings` records for the region.
- **Line (right Y-axis):** `avg_nat_score` from `regional_nat_trends` (both subjects averaged).
- **Scatter markers on the line:** One dot per year, colored by `avg_rating`: Green ≥ 4.0, Yellow 3.0–3.9, Red < 3.0.

Toggle checkboxes above the chart: show/hide bars, line, and markers independently.

**"Aha" moment:** High training volume (tall bars) + flat NAT score (horizontal line) + red markers = training happened but was ineffective. Visible in seconds.

#### Demand View — Ranked Horizontal Bar Chart

Data from `GET /regions/{region_name}/demand-topics` (last 90 days, `is_processed = TRUE` only).

- Bars sorted by `demand_count` descending.
- Each bar: `topic_tag` label, bar length = `demand_count`, `(N teachers)` count label at right.
- Note below chart: `"Red on the map = high volume here. More bars = more teacher voices."` — reinforces inverted demand lens semantics from the map.

---

### 4.6 — STARBOT (Notion AI–Style Assistant)

**User:** Maricris only. STARBOT is never shown in POLARIS-ME.

#### UI Behavior

- Floating, draggable dialogue box anchored in the lower-right corner by default.
- Minimizable to a small static icon. The icon does not animate.
- Clicking the icon expands the dialogue; a dismiss button collapses it back.
- STARBOT speaks only when spoken to. No notifications, no auto-open.

#### Contextual Awareness

When `activeRegion` is set, the frontend includes the full `regional_scores` row for that region (including all five PPST axis values) as `region_context` in every `POST /chat` request. The coordinator can ask "which PPST domain has the biggest gap here?" without specifying the region.

When `activeRegion` is null, `region_context` is null. STARBOT's system prompt is given all 17 `regional_scores` rows as context for global queries.

#### Capabilities (Planner Only)

- **Natural language queries:** "What's the Assessment Literacy gap in Region IV-B?" → structured answer citing PPST axis values.
- **Prescriptive recommendations:** "Where should we deploy ISLA next quarter?" → ranked regions by Supply sub-score with brief rationale.
- **Report drafting:** "Generate my Q3 report for Region VI" → structured text via `DRAFT_MEMO` prompt, labeled `[AI-GENERATED DRAFT]`.

#### Output Format

- Every response renders with a **Copy** button. One click copies formatted text to clipboard.
- No PDF or DOCX generation.
- All AI-generated drafts labeled: `[FOR REVIEW — AI-GENERATED DRAFT]`.
- Every response includes bracketed source citations: e.g., `[Source: POLARIS Database — computed 2025-07-01]`.

#### Explicit Exclusions (MVP)

- No teacher mode in STARBOT.
- No simulated alert queue or push notifications.
- No animated bot icon.
- No direct file generation.

---

## 5. Module 4: POLARIS-ME (Teacher Interface)

**User:** Sir Renato — Science/Math teacher.

### 5.1 — Design Philosophy

- **Mobile-first:** All views designed for a 390px-wide screen. Desktop layout is a centered single-column, max-width 480px.
- **Two-way data flow:** Teacher inputs (needs signals, feedback, nominations) directly power the Coordinator Dashboard.
- **Visual agency:** Complex data translated into visual metaphors (Skill Radar, Status Chips, Timeline).
- **Progressive disclosure:** Simple Home → deep Profile detail.

### 5.2 — Navigation Structure

Persistent **Bottom Navigation Bar** with four tabs:

| Tab # | Label | Icon (Lucide) | Section |
|---|---|---|---|
| 1 | Home | `Home` | 5.3 |
| 2 | Profile | `User` | 5.4 |
| 3 | Training | `BookOpen` | 5.5 |
| 4 | Settings | `Settings` | 5.6 |

---

### 5.3 — Tab 1: Home (Growth Dashboard)

Landing screen. Data from `GET /teachers/{deped_id}/profile` and `GET /teachers/{deped_id}/trainings` and `GET /intelligence/national-skill-radar` (for target values).

**Skill Radar Pentagon** (centerpiece SVG, Recharts `RadarChart`):

The five axes are identical to the PPST Semantic Engine axes. The same key names are used in the frontend, API, and database schema.

| Axis Label (Display) | Key | PPST Reference |
|---|---|---|
| Content Knowledge | `content_knowledge` | Domain 1 |
| Curriculum Planning | `curriculum_planning` | Domain 4 |
| Research-Based Practice | `research_based_practice` | Strand 1.2 |
| Assessment Literacy | `assessment_literacy` | Domain 5 |
| Professional Development Goals | `professional_development` | Domain 7 |

- **Teal polygon:** Teacher's current skill level per axis. Computed client-side from `GET /teachers/{deped_id}/trainings` → `ppst_weights` field, using the recency-weighted average described in Section 3.3.
- **Gold polygon:** Target skill level for teacher's `position_title`. From `GET /intelligence/national-skill-radar` → `target` object.
- **Tapping an axis label:** Tooltip shows axis description + current value + gap to target.

**Training Nudge Card:**
- "Continue Learning" card showing the single most relevant upcoming STAR program.
- Relevance logic: largest gap axis in Skill Radar cross-referenced with teacher's region demand topics.
- Card shows: program name, subject area, and reason chip (e.g., "Closes your Assessment Literacy gap").
- "Learn More" button navigates to Tab 3 — Training.

**Needs Signal CTA:**
- Prominent "Tell us what you need" button.
- Opens a modal: single `<textarea>` (max 500 chars), character counter, Submit button.
- On submit: `POST /teachers/{deped_id}/need` with `{ "raw_text": "..." }`.
- Success state: "✓ Your voice has been recorded. It will inform STAR program planning."

---

### 5.4 — Tab 2: Profile (Living Digital Portfolio)

Scrollable professional portfolio. Data from `GET /teachers/{deped_id}/profile` and `GET /teachers/{deped_id}/trainings`.

**Section A — Identity Header:**
- Photo (`photo_url`, fallback to initials avatar), Name, Employee Number (masked as `****-***-1234`), Position title, School name, Region.
- "Public / Private" toggle → `PATCH /teachers/{deped_id}` with `{ "is_profile_public": bool }`.

**Section B — Skill Radar Snapshot:**
- Thumbnail, non-interactive version of the Home Skill Radar. Same five PPST axes, same teal/gold polygons. Serves as a visual anchor for the portfolio.

**Section C — Training & Certification Timeline:**
- Vertical timeline, newest first. Each node: `program_name_cache`, `module_tag`, `completion_date`, issuing body.
- **Photo-to-Form Integration:** "Add Certificate" button opens camera/file picker. Image sent to `POST /extract/document`. On success, a pre-filled confirmation form appears. Teacher corrects errors, then submits → inserts new row into `trainings` with `is_ppst_tagged = FALSE`.

**Section D — Work Experience:**
- Editable chronological list from `teachers.work_history` JSONB.
- "Add Position" button opens a small form: `position_title`, `school_name`, `year_start`, `year_end` (nullable = current).
- Saves via `PATCH /teachers/{deped_id}` with updated `work_history` array.

**Section E — Self-Nomination & Eligibility:**
- For each active program in `programs` (from seed data): displays a traffic light status chip based on `nominations.status` if a nomination exists, or "Check Eligibility" if none.
- "Nominate Myself" button: calls `POST /teachers/{deped_id}/nominate` with `{ "program_id": int }`. Displays `eligibility_result` as a human-readable pass/fail checklist.

---

### 5.5 — Tab 3: Training (Explore & History)

Dual-view managed by a top pill-switcher: **Recommended | My History**.

**Recommended View:**
- Ranked list of active STAR programs from `programs` table.
- Each card: program name, `subject_area`, `description`, and a "Reason for Recommendation" chip derived from teacher's TVI flags and largest PPST Skill Radar gap.

**My History View:**
- Flat list of all `trainings` records for this teacher, ordered by `completion_date DESC`.
- Filter by year (dropdown).
- Each item: `program_name_cache`, `module_tag`, `completion_date`, star rating display (or "Not yet rated" if `rating IS NULL`).
- "Rate this" button if `rating IS NULL`: opens inline 1–5 star selector + optional text field → calls `POST /trainings/{training_id}/feedback`.

---

### 5.6 — Tab 4: Settings (Stub)

Minimal settings screen. No new backend endpoints required beyond `PATCH /teachers/{deped_id}`.

- **Account Info:** `deped_id` (masked), name, region, division. Read-only.
- **Profile Visibility:** Toggle → mirrors `teachers.is_profile_public`. Calls `PATCH /teachers/{deped_id}`.
- **Notifications:** Toggle (UI only, always off — "Coming soon" label).
- **Log Out:** Clears local session state, redirects to login screen.

---

### 5.7 — Smart Document Extractor (Photo-to-Form)

**Entry point:** "Add Certificate" button in Profile → Section C.

**Flow:**
1. Teacher taps button → browser file picker / camera opens.
2. Image uploaded to `POST /extract/document` as multipart form data (JPEG/PNG/PDF page, max 10MB).
3. Backend sends image to Gemini 1.5 Flash Vision API with `EXTRACT_DOCUMENT` system prompt.
4. Gemini returns JSON: `{ name, deped_id, training_name, completion_date, issuing_body }`.
5. Backend validates schema. Returns JSON to frontend.
6. Frontend renders pre-filled confirmation form. Teacher corrects any errors.
7. Teacher submits → inserts new row into `trainings` with `is_ppst_tagged = FALSE`. PPST tagging runs on next admin job.

**Error state:** If Gemini returns unparseable output → show: "We couldn't read this document automatically. Please fill in the details manually." Display empty form.

---

### 5.8 — Smart Eligibility Engine

**Entry point:** "Nominate Myself" button in Profile → Section E.

**Flow:**
1. Frontend calls `POST /teachers/{deped_id}/nominate` with `{ "program_id": int }`.
2. Backend fetches teacher record and `programs.eligibility_rules` JSONB.
3. Rule evaluation in application layer (not LLM): each rule key checked against teacher fields.
4. Writes result to `nominations`: `status = eligible | ineligible`, full `eligibility_result` JSON.
5. Frontend displays result as pass/fail checklist. No LLM involved, no waiting.

---

### 5.9 — Technical Implementation Summary

| Component | Technology |
|---|---|
| Framework | React 18 (Vite) + Tailwind CSS |
| Charts | Recharts (`RadarChart`, `BarChart`, `ComposedChart`, `PieChart`) |
| Icons | Lucide React |
| Auth (MVP) | DepEd Employee Number + OTP (simulated — OTP always accepts `123456` in demo mode) |
| Data Fetching | React Query (`@tanstack/react-query`) for caching and loading states |

---

### 5.10 — Explicit Exclusions (MVP)

- Voice journaling / Whisper API integration — cut entirely.
- Direct PDF/DOCX export — cut. "Copy to Clipboard" is the only output path.
- STAR Wrapped / shareable image cards — cut entirely.
- Co-training social graph / peer connections — cut entirely.

---

## 6. Tech Stack

| Component | Technology | Notes |
|---|---|---|
| Database | PostgreSQL 15 | All schema in `/db/migrations/001_init.sql`; seed in `002_seed.sql` |
| Backend API | Python 3.11 + FastAPI | Async handlers; Pydantic v2 for all request/response models |
| ORM | SQLAlchemy 2.0 (async) | All DB access via SQLAlchemy; no raw string queries in handlers |
| Frontend — Dashboard | React 18 + Tailwind CSS | Vite build; desktop-optimized; bento layout |
| Frontend — Teacher UI | React 18 + Tailwind CSS | Same codebase, different route (`/teacher`); mobile-first, max-width 480px |
| Mapping | Leaflet.js + Philippine GeoJSON | All 17 regional boundary files pre-bundled in `/public/geojson/` |
| Data Visualization | Recharts | `RadarChart`, `ComposedChart`, `BarChart`, `PieChart` |
| LLM (all use cases) | Google Gemini 1.5 Flash | Via `google-generativeai` Python SDK; one shared `GeminiClient` class |
| Deployment | Docker Compose (single VM) | Services: `db`, `api`, `frontend` |

**No html2canvas. No Anthropic API. No Ollama. No co-training social graph.**

---

## 7. Project Directory Structure

```
polaris/
├── docker-compose.yml
├── db/
│   └── migrations/
│       ├── 001_init.sql          # ENUMs, all CREATE TABLEs, CREATE VIEW, indexes
│       └── 002_seed.sql          # programs + proxy school/teacher/score baseline data
├── api/
│   ├── main.py                   # FastAPI app entry point; registers all routers
│   ├── models/                   # SQLAlchemy ORM models (one file per table)
│   │   ├── school.py
│   │   ├── program.py
│   │   ├── teacher.py
│   │   ├── training.py
│   │   ├── outcome.py
│   │   ├── needs_signal.py
│   │   ├── nomination.py
│   │   └── regional_score.py
│   ├── schemas/                  # Pydantic v2 request/response schemas
│   │   ├── region.py
│   │   ├── teacher.py
│   │   ├── training.py
│   │   ├── intelligence.py
│   │   └── chat.py
│   ├── routers/
│   │   ├── regions.py            # GET /regions/, GET /regions/{name}/...
│   │   ├── teachers.py           # GET /teachers/{deped_id}/..., PATCH /teachers/{deped_id}
│   │   ├── trainings.py          # POST /trainings/{id}/feedback
│   │   ├── intelligence.py       # GET /intelligence/national-skill-radar
│   │   ├── upload.py             # POST /upload/csv
│   │   ├── extract.py            # POST /extract/document
│   │   ├── chat.py               # POST /chat  (STARBOT)
│   │   └── admin.py              # POST /admin/recompute-*, /admin/process-*
│   └── intel/
│       ├── llm_client.py         # GeminiClient class; all system prompt strings keyed by name
│       ├── scoring.py            # TVI computation, regional score computation, PPST axis averaging
│       └── skill_targets.py      # Static PPST target values per position_title tier
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx          # POLARIS-MAP + BOT root (route: /)
    │   │   └── TeacherApp.jsx         # POLARIS-ME root (route: /teacher)
    │   ├── components/
    │   │   ├── dashboard/
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── IntelligenceColumn.jsx   # Panel 1 wrapper
    │   │   │   ├── NationalSkillRadar.jsx   # PPST pentagon radar
    │   │   │   ├── CriticalPingsFeed.jsx    # AI pings scrollable list
    │   │   │   ├── MapCanvas.jsx            # Panel 2: Leaflet map + lens selector
    │   │   │   ├── LensSelector.jsx
    │   │   │   ├── WorkspacePanel.jsx       # Panel 3: toggles National vs Regional
    │   │   │   ├── NationalBaselineCard.jsx # Donut + 2x2 grid
    │   │   │   ├── RegionalHealthCard.jsx
    │   │   │   └── detail-views/
    │   │   │       ├── SupplyRadar.jsx
    │   │   │       ├── ImpactChart.jsx
    │   │   │       └── DemandBars.jsx
    │   │   ├── starbot/
    │   │   │   └── Starbot.jsx
    │   │   └── teacher/
    │   │       ├── SkillRadar.jsx
    │   │       ├── TrainingTimeline.jsx
    │   │       ├── NominationCard.jsx
    │   │       └── NeedsSignalModal.jsx
    │   ├── hooks/
    │   │   ├── useRegions.js                # React Query: GET /regions/
    │   │   └── useNationalSkillRadar.js     # React Query: GET /intelligence/national-skill-radar
    │   └── store/
    │       └── dashboardStore.js            # activeRegion (string|null), activeLens (string)
    └── public/
        └── geojson/
            └── philippines-regions.geojson
```

---

## 8. Demo Happy Path

The demo must be bulletproof along this exact sequence. Every step must work with seed/mock data. No step requires a live CSV upload or real API key if the seed data is loaded.

1. **Open Dashboard** → Bento layout loads. Map (Panel 2) shows all 17 regions colored under the Overall lens. Panel 1 shows the National Skill Gap Radar with teal and gold polygons, and the AI Critical Pings feed with at least 2 seeded pings.
2. **Click a Critical Ping** (e.g., `"CRITICAL: Region VIII — Score: 42"`) → Map flies to Region VIII. Panel 3 flips to the Regional Health Card. Key Insight sentence renders instantly.
3. **Tab 1 — Summary** (default) → 4 Core Factors display with national comparison arrows.
4. **Switch map to Supply Lens** → Map recolors. Region VIII still selected. Health Card unchanged.
5. **Switch map to Demand Lens** → Map recolors. Legend updates to `"Red = High Unmet Demand"` in red text.
6. **Click Detail tab → Demand View** → Horizontal bar chart renders top training topics for Region VIII.
7. **Click Detail tab → Impact View** → Dual-axis combo chart shows training bars, NAT score line, and colored scatter markers.
8. **Open STARBOT** → Type: `"Which PPST domain has the biggest gap in this region?"` → Response appears, citing PPST axis values from `region_context`, with bracketed source citations.
9. **Type in STARBOT:** `"Draft a deployment memo for ISLA in this region."` → Response appears with `[AI-GENERATED DRAFT]` label and Copy button.
10. **Switch to POLARIS-ME** → Log in as Sir Renato (`deped_id = DEMO-001`, OTP = `123456`).
11. **Home tab** → Skill Radar renders with five PPST axes. Teal (current) and gold (target) polygons visible. Training Nudge Card shows the top gap axis and a recommended program.
12. **Profile tab → Section E** → Tap "Nominate Myself" for ISLA. Eligibility result renders as a pass/fail checklist.
13. **Training tab → My History** → At least one seeded training visible. Tap "Rate this" → Submit 5-star rating → Success state confirms.

---

*End of Project POLARIS MVP Specification v3.1*
