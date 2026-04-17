-- 005_consultant_seed.sql
-- Demo-grade seed for Region VIII + 3 active programs for the Consultant Page.

-- ─── Region VIII demo telemetry ───────────────────────────────────────────────
UPDATE regional_scores
SET
  student_pop                   = 1200000,
  avg_nat_score                 = 41.2,
  supply_subscore               = 52.0,
  impact_subscore               = 48.0,
  demand_subscore               = 63.0,
  underserved_score             = 72.0,
  traffic_light                 = 'red',
  ppst_content_knowledge        = 0.55,
  ppst_curriculum_planning      = 0.48,
  ppst_research_based_practice  = 0.62,
  ppst_assessment_literacy      = 0.42,
  ppst_professional_development = 0.58,
  total_teachers                = 8400,
  teacher_student_ratio         = 40,
  specialization_pct            = 61.0,
  star_coverage_pct             = 34.0,
  demand_signal_count           = 47,
  critical_pings = '[
    {"region":"Region VIII","severity":"CRITICAL","message":"Assessment Literacy at 0.42 — lowest PPST score in region"},
    {"region":"Region VIII","severity":"WARNING","message":"NAT score 41.2% — 18.8 pts below national average"}
  ]'::jsonb,
  -- Pre-compute economic_loss and lays_score so the dashboard impact card matches the consultant page exactly
  economic_loss = ROUND(1200000 * (1 - 41.2/100.0) * 290000 / 1e9, 1),
  lays_score    = ROUND(12 * (41.2/100.0), 1)
WHERE region = 'Region VIII';

-- ─── 3 active programs (idempotent) ──────────────────────────────────────────
INSERT INTO programs (program_name, subject_area, description, eligibility_rules, is_active)
VALUES
  ('ISLA Cohort 12', 'Both',
   'Island Schools Learning Assistance — DOST-SEI mentoring program for underserved GIDA schools. Focuses on Assessment Literacy and Content Knowledge for Science and Math teachers.',
   '{"min_experience_years": 0, "gida_school_required": true}'::jsonb, true),
  ('CBEP Workshop — Science Assessment', 'Science',
   'Competency-Based Education Program workshop targeting Assessment and Reporting (PPST Domain 5). 3-day intensive with partner university trainers.',
   '{"min_experience_years": 1}'::jsonb, true),
  ('STAR Fest Regional Hub', 'Mathematics',
   'Annual STAR celebration and professional learning fair. Teachers demonstrate research-based practices and improvised learning materials.',
   '{"min_experience_years": 0}'::jsonb, true)
ON CONFLICT (program_name) DO UPDATE
  SET description = EXCLUDED.description,
      is_active   = EXCLUDED.is_active;
