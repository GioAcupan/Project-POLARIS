# POLARIS System Documentation

## 1) Runtime Surface

- Backend app: `api/main.py` (FastAPI, no global prefix).
- Effective backend base URL in frontend: `VITE_API_BASE_URL` fallback `http://localhost:8000` (`frontend/src/lib/api.ts`).
- Mounted static backend files: `GET /static/{path}` from `api/static`.
- FastAPI default docs surface (enabled): `GET /docs`, `GET /redoc`, `GET /openapi.json`.
- CORS: allow all origins/methods/headers (`api/main.py`).
- Auth: no auth dependency/middleware on API routes.

## 2) Complete API Registry

| Method | Path | Handler | Request Schema | Response Schema |
|---|---|---|---|---|
| GET | `/health` | `api/main.py::health` | None | inline `{status, pitch_mode}` |
| POST | `/chat` | `api/routers/chat.py::chat` | `ChatRequest` | `ChatResponse` |
| GET | `/regions/` | `api/routers/regions.py::list_regions` | query: none | `list[RegionalScoreContext]` (includes v3.5 metrics: `student_pop`, `economic_loss`, `lays_score`) |
| GET | `/regions/dashboard-ai-reports` | `api/routers/regions.py::list_dashboard_ai_reports` | query: `limit>=1` | `DashboardAiReportsResponse` (nested `RegionalScoreContext` includes v3.5 metrics) |
| GET | `/intelligence/national-skill-radar` | `api/routers/intelligence.py::national_skill_radar` | None | `NationalSkillRadarOut` |
| POST | `/reports/generate` | `api/routers/reports.py::generate_report` | `ReportGenerateRequest` | `ReportGenerateResponse` |
| GET | `/events/recommended` | `api/routers/events.py::recommended_events` | query: `deped_id`, `limit(1..50)` | `list[RecommendedEventOut]` |
| POST | `/events/{event_id}/register` | `api/routers/registrations.py::register_for_event` | `RegisterEventRequest` | `RegistrationOut` |
| POST | `/registrations/{reg_id}/verify` | `api/routers/registrations.py::verify_registration` | None | `VerifyResponse` |
| POST | `/registrations/{reg_id}/generate-pds` | `api/routers/registrations.py::generate_pds` | None | `GeneratePDSResponse` |
| PATCH | `/registrations/{reg_id}/status` | `api/routers/registrations.py::patch_registration_status` | `StatusPatchRequest` | `RegistrationOut` |
| GET | `/teachers/{deped_id}/active-registrations` | `api/routers/registrations.py::active_registrations` | path: `deped_id` | `list[ActiveRegistrationOut]` |
| POST | `/teachers/{deped_id}/profile-extended` | `api/routers/profile_extended.py::upsert_profile_extended` | `ProfileExtendedUpsert` | `ProfileExtendedOut` |
| GET | `/downloads/{filename}` | `api/routers/downloads.py::download_pds` | path: `{filename}` (`^\d+_pds\.xlsx$`) | file stream (`FileResponse`) |
| GET | `/static/{path}` | `StaticFiles` mount in `api/main.py` | path | static file |

## 3) Backend File Map Per API

### `/chat`

- Router: `api/routers/chat.py`
- Schemas: `api/schemas/chat.py`
- Intel/service: `api/intel/llm_client.py`
- DB usage: none directly (uses passed `region_context` payload only)

### `/regions/`, `/regions/dashboard-ai-reports`

- Router: `api/routers/regions.py`
- Schema outputs: `api/schemas/chat.py` (`RegionalScoreContext`, `DashboardAiReportsResponse`)
- Model/table: `api/models/regional_score.py` (`regional_scores`)
- Exposed v3.5 additive fields from `regional_scores`: `student_pop`, `economic_loss`, `lays_score`
- Intel/util: `api/intel/region_codes.py`
- DB session: `api/db.py`

### `/intelligence/national-skill-radar`

- Router: `api/routers/intelligence.py`
- Model/table: `api/models/regional_score.py` (`regional_scores`)
- Local response models are inline in router (`SkillRadarAxes`, `NationalSkillRadarOut`)
- DB session: `api/db.py`

### `/reports/generate`

- Router: `api/routers/reports.py`
- Schemas: `api/schemas/reports.py`
- Model/table: `api/models/regional_score.py` (`regional_scores`)
- Intel/util: `api/intel/region_codes.py`, `api/intel/report_bands.py`, `api/intel/scoring.py`, `api/intel/safe_dict.py`
- Templates/content: `api/templates/reports/*.md`, `api/templates/reports/recommendations.py`
- DB session: `api/db.py`

### `/events/recommended`

- Router: `api/routers/events.py`
- Schemas: `api/schemas/events.py`
- Models/tables: `api/models/teacher.py` (`teachers`), `api/models/program.py` (`programs`), `api/models/training_event.py` (`training_events`), `api/tables/nominations.py` (`nominations`)
- Intel/util: `api/intel/ppst_gap.py`
- DB session: `api/db.py`

### `/events/{event_id}/register`, `/registrations/{reg_id}/verify`, `/registrations/{reg_id}/generate-pds`, `/registrations/{reg_id}/status`, `/teachers/{deped_id}/active-registrations`

- Router: `api/routers/registrations.py`
- Schemas: `api/schemas/registrations.py`, `api/schemas/events.py` (`EventSpecificFieldDef`)
- Models/tables: `api/models/event_registration.py` (`event_registrations`), `api/models/training_event.py` (`training_events`), `api/models/teacher.py` (`teachers`), `api/models/profile_extended.py` (`teacher_profile_extended`), `api/tables/nominations.py` (`nominations`)
- Intel/util: `api/intel/form_generator.py`, `api/intel/form_mappings/csc_form_212.py`
- Files/templates/static for generated docs: `api/templates/forms/demo_pds_prefilled.xlsx`, `api/templates/forms/csc_form_212.xlsx`, `api/static/forms/demo_pds_preview.png`
- DB session: `api/db.py`

### `/teachers/{deped_id}/profile-extended`

- Router: `api/routers/profile_extended.py`
- Schemas: `api/schemas/profile_extended.py`
- Models: `api/models/profile_extended.py` (`teacher_profile_extended`), `api/models/teacher.py` (`teachers`)
- Intel/util: `api/intel/profile_completeness.py`
- DB session: `api/db.py`

### `/downloads/{filename}`

- Router: `api/routers/downloads.py`
- Models: `api/models/event_registration.py`, `api/models/teacher.py`
- Reads generated files from `POLARIS_OUTPUT_DIR` (default `/var/polaris/generated`)
- DB session: `api/db.py`

## 4) Frontend -> API Mapping

## Shared client/config

- Main HTTP client: `frontend/src/lib/api.ts` (`apiFetch`, `apiBase`, all exported endpoint functions).
- Env/config docs: `frontend/.env.example` (`VITE_API_BASE_URL`, `VITE_PITCH_MODE`).
- No Vite API proxy in `frontend/vite.config.ts`.

## Callers currently used in UI

| Frontend File | API Function | Method + Path |
|---|---|---|
| `frontend/src/components/starbot/Starbot.jsx` | `chat` | `POST /chat` |
| `frontend/src/hooks/useRegions.ts` -> used by `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/ReportGenerator.jsx` | `getRegions` | `GET /regions/` |
| `frontend/src/hooks/useRegions.ts` -> used by `frontend/src/pages/Dashboard.tsx` | `getDashboardAiReports(5)` | `GET /regions/dashboard-ai-reports?limit=5` |
| `frontend/src/hooks/useNationalRadar.ts` -> used by `frontend/src/pages/Dashboard.tsx` | `getNationalRadar` | `GET /intelligence/national-skill-radar` |
| `frontend/src/pages/ReportGenerator.jsx` | `generateReport` | `POST /reports/generate` |

## API helpers defined but not currently called by frontend components/pages

- `getRecommendedEvents` -> `GET /events/recommended`
- `registerForEvent` -> `POST /events/{event_id}/register`
- `verifyRegistration` -> `POST /registrations/{reg_id}/verify`
- `generatePDS` -> `POST /registrations/{reg_id}/generate-pds`
- `patchStatus` -> `PATCH /registrations/{reg_id}/status`
- `getActiveRegistrations` -> `GET /teachers/{deped_id}/active-registrations`
- `upsertProfileExtended` -> `POST /teachers/{deped_id}/profile-extended`

## Non-backend-network call in frontend

- `frontend/src/components/dashboard/MapCanvas.tsx` calls `fetch("/ph-regions.geojson")` (served from frontend public assets, not FastAPI API base URL).

## 5) Complete Database Schema (from migrations)

Primary migration files:
- `db/migrations/001_init.sql` (base v3.1 objects)
- `db/migrations/003_v34_module4_and_starbot.sql` (v3.4 additive objects)
- `db/migrations/004_v35_impact_metrics.sql` (v3.5 additive `regional_scores` impact metrics)
- `db/migrations/002_seed.sql` (seed data only; no new schema objects)

## Enums

- `subject_area`: `Science`, `Mathematics`, `Both`
- `qualification_level`: `Bachelor`, `Master`, `Doctorate`, `None`
- `nomination_status`: `pending_eligibility`, `eligible`, `ineligible`, `enrolled`
- `traffic_light`: `green`, `yellow`, `red`
- `registration_status`: `draft`, `forms_generated`, `submitted`, `approved`, `attended`, `completed`, `cancelled`

## Tables

### `schools`

- Columns:  
  - `school_id SERIAL PK`
  - `school_name VARCHAR(255) NOT NULL`
  - `region VARCHAR(100) NOT NULL`
  - `division VARCHAR(100) NOT NULL`
  - `psgc_code CHAR(10) NOT NULL`
  - `is_gida BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Indexes: `idx_schools_region`, `idx_schools_division`, `idx_schools_psgc`

### `programs`

- Columns:
  - `id SERIAL PK`
  - `program_name VARCHAR(100) NOT NULL UNIQUE`
  - `subject_area subject_area NOT NULL`
  - `description TEXT`
  - `eligibility_rules JSONB NOT NULL DEFAULT '{}'`
  - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### `teachers`

- Columns:
  - `deped_id VARCHAR(30) PK`
  - `star_id VARCHAR(50) NOT NULL UNIQUE`
  - `first_name VARCHAR(100) NOT NULL`
  - `last_name VARCHAR(100) NOT NULL`
  - `middle_name VARCHAR(100)`
  - `region VARCHAR(100) NOT NULL`
  - `division VARCHAR(100) NOT NULL`
  - `school_id INTEGER NOT NULL FK -> schools.school_id (ON UPDATE CASCADE, ON DELETE RESTRICT)`
  - `psgc_code CHAR(10) NOT NULL`
  - `is_gida BOOLEAN NOT NULL DEFAULT FALSE`
  - `subject_specialization VARCHAR(100) NOT NULL`
  - `subject_area subject_area NOT NULL`
  - `qualification_level qualification_level NOT NULL DEFAULT 'Bachelor'`
  - `position_title VARCHAR(100)`
  - `years_experience SMALLINT NOT NULL DEFAULT 0 CHECK >= 0`
  - `photo_url TEXT`
  - `is_profile_public BOOLEAN NOT NULL DEFAULT FALSE`
  - `work_history JSONB NOT NULL DEFAULT '[]'`
  - `tvi_score SMALLINT NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 4`
  - `tvi_flag_recency BOOLEAN NOT NULL DEFAULT FALSE`
  - `tvi_flag_mismatch BOOLEAN NOT NULL DEFAULT FALSE`
  - `tvi_flag_gida BOOLEAN NOT NULL DEFAULT FALSE`
  - `tvi_flag_outcomes BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Indexes: `idx_teachers_region`, `idx_teachers_division`, `idx_teachers_school_id`, `idx_teachers_subject_area`, `idx_teachers_tvi_score`, `idx_teachers_is_gida`

### `trainings`

- Columns:
  - `id SERIAL PK`
  - `teacher_id VARCHAR(30) NOT NULL FK -> teachers.deped_id (ON DELETE CASCADE)`
  - `program_id INTEGER FK -> programs.id (ON DELETE SET NULL)`
  - `program_name_cache VARCHAR(100)`
  - `region VARCHAR(100) NOT NULL`
  - `division VARCHAR(100) NOT NULL`
  - `module_tag VARCHAR(100)`
  - `completion_date DATE NOT NULL`
  - `ppst_weights JSONB`
  - `is_ppst_tagged BOOLEAN NOT NULL DEFAULT FALSE`
  - `rating SMALLINT CHECK BETWEEN 1 AND 5`
  - `feedback_text TEXT`
  - `feedback_submitted_at TIMESTAMPTZ`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Indexes: `idx_trainings_teacher_id`, `idx_trainings_program_id`, `idx_trainings_region`, `idx_trainings_completion`, `idx_trainings_ppst_tagged`

### `outcomes`

- Columns:
  - `id SERIAL PK`
  - `school_id INTEGER NOT NULL FK -> schools.school_id (ON DELETE CASCADE)`
  - `region VARCHAR(100) NOT NULL`
  - `psgc_code CHAR(10) NOT NULL`
  - `subject subject_area NOT NULL`
  - `nat_score NUMERIC(5,2) NOT NULL CHECK BETWEEN 0 AND 100`
  - `year SMALLINT NOT NULL CHECK BETWEEN 2000 AND 2100`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `UNIQUE (school_id, subject, year)`
- Indexes: `idx_outcomes_school_id`, `idx_outcomes_region`, `idx_outcomes_subject`, `idx_outcomes_year`

### `needs_signals`

- Columns:
  - `id SERIAL PK`
  - `teacher_id VARCHAR(30) NOT NULL FK -> teachers.deped_id (ON DELETE CASCADE)`
  - `region VARCHAR(100) NOT NULL`
  - `division VARCHAR(100) NOT NULL`
  - `raw_text TEXT NOT NULL`
  - `subject_tag VARCHAR(100)`
  - `topic_tag VARCHAR(100)`
  - `context_tag VARCHAR(100)`
  - `is_processed BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Indexes: `idx_needs_region`, `idx_needs_teacher`, `idx_needs_processed`, `idx_needs_created`

### `nominations`

- Columns:
  - `id SERIAL PK`
  - `teacher_id VARCHAR(30) NOT NULL FK -> teachers.deped_id (ON DELETE CASCADE)`
  - `program_id INTEGER NOT NULL FK -> programs.id (ON DELETE CASCADE)`
  - `status nomination_status NOT NULL DEFAULT 'pending_eligibility'`
  - `eligibility_result JSONB`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `UNIQUE (teacher_id, program_id)`
- Indexes: `idx_nominations_teacher`, `idx_nominations_program`, `idx_nominations_status`

### `regional_scores`

- Columns:
  - `region VARCHAR(100) PK`
  - `psgc_code CHAR(10)`
  - `underserved_score NUMERIC(5,2) NOT NULL DEFAULT 0`
  - `supply_subscore NUMERIC(5,2) NOT NULL DEFAULT 0`
  - `impact_subscore NUMERIC(5,2) NOT NULL DEFAULT 0`
  - `demand_subscore NUMERIC(5,2) NOT NULL DEFAULT 0`
  - `teacher_student_ratio NUMERIC(8,4)`
  - `specialization_pct NUMERIC(5,2)`
  - `star_coverage_pct NUMERIC(5,2)`
  - `avg_nat_score NUMERIC(5,2)`
  - `student_pop INTEGER NOT NULL DEFAULT 0` (added by `004_v35_impact_metrics.sql`)
  - `economic_loss NUMERIC(15,2) NOT NULL DEFAULT 0` (added by `004_v35_impact_metrics.sql`)
  - `lays_score NUMERIC(5,2) NOT NULL DEFAULT 0` (added by `004_v35_impact_metrics.sql`)
  - `demand_signal_count INTEGER NOT NULL DEFAULT 0`
  - `ppst_content_knowledge NUMERIC(4,3) NOT NULL DEFAULT 0`
  - `ppst_curriculum_planning NUMERIC(4,3) NOT NULL DEFAULT 0`
  - `ppst_research_based_practice NUMERIC(4,3) NOT NULL DEFAULT 0`
  - `ppst_assessment_literacy NUMERIC(4,3) NOT NULL DEFAULT 0`
  - `ppst_professional_development NUMERIC(4,3) NOT NULL DEFAULT 0`
  - `critical_pings JSONB NOT NULL DEFAULT '[]'`
  - `total_teachers INTEGER NOT NULL DEFAULT 0`
  - `traffic_light traffic_light NOT NULL DEFAULT 'red'`
  - `computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### `teacher_profile_extended`

- Columns:
  - `deped_id VARCHAR(30) PK FK -> teachers.deped_id (ON DELETE CASCADE)`
  - `name_extension VARCHAR(10)`
  - `sex VARCHAR(10) CHECK IN ('Male','Female') when not null`
  - `date_of_birth DATE`
  - `civil_status VARCHAR(20) CHECK IN ('Single','Married','Separated','Widowed') when not null`
  - `place_of_birth VARCHAR(255)`
  - `citizenship VARCHAR(50) DEFAULT 'Filipino'`
  - `height_cm NUMERIC(5,2)`
  - `weight_kg NUMERIC(5,2)`
  - `blood_type VARCHAR(5)`
  - `mobile_number VARCHAR(20)`
  - `telephone_number VARCHAR(20)`
  - `email VARCHAR(100)`
  - `addr_house_no VARCHAR(50)`
  - `addr_street VARCHAR(100)`
  - `addr_subdivision VARCHAR(100)`
  - `addr_barangay VARCHAR(100)`
  - `addr_city VARCHAR(100)`
  - `addr_province VARCHAR(100)`
  - `addr_zip VARCHAR(10)`
  - `completeness_score SMALLINT NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 100`
  - `last_verified_at TIMESTAMPTZ`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Indexes: `idx_teacher_profile_extended_last_verified_at`

### `training_events`

- Columns:
  - `id SERIAL PK`
  - `program_id INT NOT NULL FK -> programs.id (ON DELETE RESTRICT)`
  - `title VARCHAR(255) NOT NULL`
  - `organizer VARCHAR(255) NOT NULL`
  - `venue VARCHAR`
  - `venue_region VARCHAR`
  - `start_date DATE NOT NULL`
  - `end_date DATE NOT NULL`
  - `registration_deadline DATE NOT NULL`
  - `is_star_partnered BOOLEAN NOT NULL DEFAULT FALSE`
  - `funding_source VARCHAR(50)`
  - `required_forms JSONB NOT NULL DEFAULT '["pds"]'`
  - `event_specific_fields JSONB NOT NULL DEFAULT '[]'`
  - `description TEXT`
  - `capacity INT`
  - `slots_remaining INT`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `CHECK (end_date >= start_date)`
- Indexes: `idx_training_events_program_id`, `idx_training_events_start_date`, `idx_training_events_is_star_partnered`, `idx_training_events_registration_deadline`

### `event_registrations`

- Columns:
  - `id SERIAL PK`
  - `teacher_id VARCHAR(30) NOT NULL FK -> teachers.deped_id (ON DELETE CASCADE)`
  - `event_id INT NOT NULL FK -> training_events.id (ON DELETE RESTRICT)`
  - `status registration_status NOT NULL DEFAULT 'draft'`
  - `event_specific_answers JSONB NOT NULL DEFAULT '{}'`
  - `nomination_id INT FK -> nominations.id`
  - `generated_pds_path TEXT`
  - `generated_at TIMESTAMPTZ`
  - `submitted_at TIMESTAMPTZ`
  - `approved_at TIMESTAMPTZ`
  - `attended_at TIMESTAMPTZ`
  - `cancelled_at TIMESTAMPTZ`
  - `next_action VARCHAR(100)`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `UNIQUE (teacher_id, event_id)`
- Indexes: `idx_event_registrations_teacher_id`, `idx_event_registrations_event_id`, `idx_event_registrations_status`

## Views

- `regional_nat_trends`:
  - Source: `outcomes`
  - Columns: `region`, `subject`, `year`, `avg_nat_score` (rounded AVG), `school_count` (COUNT DISTINCT school_id)

## Database objects not present in repo migrations

- No `CREATE FUNCTION` / SQL stored procedures.
- No `CREATE TRIGGER`.
- No `CREATE POLICY` (RLS policies).
- No explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

## 6) API <-> DB Coverage Matrix

| Endpoint | Main DB objects touched |
|---|---|
| `GET /health` | none |
| `POST /chat` | none (context-driven) |
| `GET /regions/` | `regional_scores` (includes v3.5 `student_pop`, `economic_loss`, `lays_score`) |
| `GET /regions/dashboard-ai-reports` | `regional_scores` (same v3.5 metrics via `limited_results`) |
| `GET /intelligence/national-skill-radar` | `regional_scores` |
| `POST /reports/generate` | `regional_scores` |
| `GET /events/recommended` | `teachers`, `training_events`, `programs`, `nominations`, `regional_scores` (via PPST gap helper) |
| `POST /events/{event_id}/register` | `teachers`, `training_events`, `nominations`, `event_registrations` |
| `POST /registrations/{reg_id}/verify` | `event_registrations`, `teacher_profile_extended` |
| `POST /registrations/{reg_id}/generate-pds` | `event_registrations`, `teachers`, `teacher_profile_extended`, `training_events` |
| `PATCH /registrations/{reg_id}/status` | `event_registrations`, `training_events` |
| `GET /teachers/{deped_id}/active-registrations` | `event_registrations`, `training_events` |
| `POST /teachers/{deped_id}/profile-extended` | `teachers`, `teacher_profile_extended` |
| `GET /downloads/{filename}` | `event_registrations`, `teachers` |

## 7) Notes / Gaps

- `db/migrations/002_seed.sql` states v3.4 seed requires running `003_v34_module4_and_starbot.sql` first; if another document says `001 -> 002 -> 003`, that sequence conflicts for v3.4 seed inserts.
- API endpoint inventory is stable (no new route paths), while schema expanded in v3.5 via `db/migrations/004_v35_impact_metrics.sql` and is now surfaced by `/regions/*`.
- Some base schema tables exist but are not directly exposed by current API endpoints (`schools`, `trainings`, `outcomes`, `needs_signals`, `regional_nat_trends`).
