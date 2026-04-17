# POLARIS

POLARIS is a regional intelligence and STAR Program demo platform: a FastAPI backend and React frontend backed by Supabase PostgreSQL, with optional Google Gemini for STARBOT when not in pitch mode.

## Repository layout

| Path | Purpose |
|------|---------|
| `api/` | FastAPI app (`api.main:app`), routers, SQLAlchemy models, templates, static files |
| `frontend/` | React 19 + Vite 7 + Tailwind CSS 4 |
| `db/migrations/` | Ordered SQL migrations for Supabase (run manually) |
| `.cursor/docs/POLARIS_FINAL_EXECUTION_BLUEPRINT.md` | Master blueprint (schema, happy-path demo, environment notes) |

This repo does not include a checked-in `docker-compose.yml` or `Dockerfile`; run the API and frontend locally as below.

## Prerequisites

- **Python 3.11+** (recommended; async FastAPI + SQLAlchemy 2)
- **Node.js 20+** (LTS; matches Vite 7)
- A **Supabase** project (PostgreSQL) with pooler and direct connection strings from the dashboard

## Installation

### Backend

From the **repository root** (so `import api` resolves):

```bash
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **macOS / Linux:** `source .venv/bin/activate`

```bash
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Configuration

### Root `.env`

Copy `.env.example` to `.env` at the project root. Minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | Async SQLAlchemy URL for runtime. Use Supabase **transaction pooler** with the `asyncpg` driver, e.g. `postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `POLARIS_PITCH_MODE` | No | `true` (default for demos) uses canned STARBOT responses and bypasses Gemini |
| `POLARIS_OUTPUT_DIR` | No | Directory for generated downloads (PDS, Excel). Default in code is `/var/polaris/generated`. On Windows use a repo path such as `api/generated` or an absolute path |
| `GOOGLE_GEMINI_API_KEY` | If pitch mode is off | Required when `POLARIS_PITCH_MODE=false` for live Gemini calls |
| `DATABASE_URL_DIRECT` | For migrations only | **Not** read by the app. Use Supabase **direct** connection (e.g. port `5432`) in SQL Editor or `psql` for DDL |

See `.env.example` for commented placeholders.

### Frontend `.env`

Copy `frontend/.env.example` to `frontend/.env` or `frontend/.env.local`:

| Variable | Description |
|----------|-------------|
| `VITE_PITCH_MODE` | Should match demo intent (`true` for deterministic UI behavior) |
| `VITE_API_BASE_URL` | API origin (default in code: `http://localhost:8000`) |

## Database setup

Apply SQL migrations **in order** on a fresh database:

1. `db/migrations/001_init.sql`
2. `db/migrations/002_seed.sql`
3. `db/migrations/003_v34_module4_and_starbot.sql`

Use the Supabase SQL Editor or `psql` with your **direct** connection string (`DATABASE_URL_DIRECT`). Keep the order; later files assume earlier schema.

## Running the FastAPI server

From the **repository root**, with the venv activated:

```bash
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Smoke checks:

- Health: [http://localhost:8000/health](http://localhost:8000/health) — returns `status` and `pitch_mode`
- OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)

Static files are served under `/static` (see `api/static`).

## Running the frontend

```bash
cd frontend
npm run dev
```

Vite defaults to **http://localhost:5173**. Ensure `VITE_API_BASE_URL` matches your API (e.g. `http://localhost:8000`).

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`.

## One-command E2E tests

From `frontend/`, run:

```bash
npm run test:e2e
```

This command uses Playwright `webServer` orchestration to:

1. Start the FastAPI backend at `http://127.0.0.1:8000`
2. Wait for backend health at `http://127.0.0.1:8000/health`
3. Start the Vite frontend at `http://127.0.0.1:5173`
4. Run browser E2E smoke tests and stop managed servers automatically

Additional variants:

- `npm run test:e2e:headed` (headed browser mode)
- `npm run test:e2e:ui` (Playwright interactive UI mode)

Prerequisites and notes:

- Install browsers once: `npx playwright install chromium`
- Backend startup uses `python -m uvicorn ...` from repo root, so ensure Python is installed and your dependencies from `requirements.txt` are available (usually via your `.venv`)
- Keep `.env` at repo root configured, especially `DATABASE_URL`
- If ports `8000` or `5173` are occupied, stop the conflicting process or adjust ports in `frontend/playwright.config.ts`

## Pitch mode vs full mode

| Mode | Backend | Frontend | Behavior |
|------|---------|----------|----------|
| Demo / hackathon | `POLARIS_PITCH_MODE=true` | `VITE_PITCH_MODE=true` | Canned STARBOT replies, mock latency where implemented; no Gemini key needed |
| Full | `POLARIS_PITCH_MODE=false` | `VITE_PITCH_MODE=false` | Live Gemini via `GOOGLE_GEMINI_API_KEY` |

The click-by-click demo script lives in `.cursor/docs/POLARIS_FINAL_EXECUTION_BLUEPRINT.md` (Part C — Happy Path).

## Project current state

- **Backend:** FastAPI with routers for chat (STARBOT), regions, reports, events, registrations, extended profile, and downloads. Async SQLAlchemy sessions via `api.db`; `DATABASE_URL` loaded from repo-root `.env`. Report markdown templates under `api/templates/reports/`.
- **Frontend:** React 19, TanStack Query, Recharts/Leaflet as used in the app, Tailwind 4. API client base URL from `VITE_API_BASE_URL` in `frontend/src/lib/api.ts`.
- **Database:** Supabase Postgres; schema and seeds maintained as SQL files under `db/migrations/` (no Alembic in this repo).

Optional contributor tooling: this workspace is indexed by **GitNexus**; see [AGENTS.md](AGENTS.md) for graph-based exploration and pre-refactor impact checks (`npx gitnexus analyze`, MCP tools).

## Troubleshooting

- **`KeyError` / missing `DATABASE_URL`:** Create `.env` at the repo root with a valid async Supabase pooler URL (`postgresql+asyncpg://...`).
- **Gemini errors when pitch mode is off:** Set `GOOGLE_GEMINI_API_KEY` or turn `POLARIS_PITCH_MODE=true`.
- **Downloads or file generation fail on Windows:** Set `POLARIS_OUTPUT_DIR` to a writable path (e.g. `api/generated`); avoid relying on the Unix default `/var/polaris/generated`.

## Related docs

- [`.cursor/docs/POLARIS_FINAL_EXECUTION_BLUEPRINT.md`](.cursor/docs/POLARIS_FINAL_EXECUTION_BLUEPRINT.md) — schema, features, environment, demo script
- [`frontend/README.md`](frontend/README.md) — Vite + shadcn/ui notes
- [`LICENSE`](LICENSE) — project license
