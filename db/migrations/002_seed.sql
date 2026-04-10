-- =============================================================================
-- POLARIS seed data
-- =============================================================================
-- v3.1 baseline: place your INSERTs for schools, programs, teachers, trainings,
--   outcomes, needs_signals, nominations, regional_scores, etc. ABOVE the
--   "v3.4 demo seed" section below.
--
-- v3.4 prerequisites:
--   - Run 003_v34_module4_and_starbot.sql first (registration_status enum,
--     teacher_profile_extended, training_events, event_registrations).
--   - teachers.deped_id = 'DEMO-001' must exist.
--   - programs.program_name must match these lookups (adjust v3.1 or predicates):
--       ISLA            -> ISLA Cohort 12 event
--       CBEP            -> CBEP Math Facilitators Workshop
--       STAR Fellowship -> STAR Fellowship Orientation 2026
--       MTU             -> MTU Rural Outreach Preview
--
-- Idempotent on a fresh DB only; re-running may hit duplicate key errors.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- v3.4 demo seed (Part B §B.1 DB5–DB8, Part C Step 12 baseline)
-- ─────────────────────────────────────────────────────────────────────────────

-- DB5 — teacher_profile_extended (DEMO-001)
INSERT INTO teacher_profile_extended (
  deped_id,
  name_extension,
  sex,
  date_of_birth,
  civil_status,
  place_of_birth,
  citizenship,
  height_cm,
  weight_kg,
  blood_type,
  mobile_number,
  telephone_number,
  email,
  addr_house_no,
  addr_street,
  addr_subdivision,
  addr_barangay,
  addr_city,
  addr_province,
  addr_zip,
  completeness_score,
  last_verified_at
) VALUES (
  'DEMO-001',
  NULL,
  'Male',
  DATE '1982-03-15',
  'Married',
  'Tacloban City, Leyte',
  'Filipino',
  168,
  70,
  'O+',
  '09171234567',
  NULL,
  'renato.delacruz@deped.gov.ph',
  'Lot 4 Block 12',
  'Mabini Street',
  'Phase 2 Subd. San Jose',
  'Brgy. San Jose',
  'Tacloban City',
  'Leyte',
  '6500',
  100,
  NOW() - INTERVAL '2 hours'
);

-- DB6 — eligible ISLA nomination for DEMO-001
INSERT INTO nominations (teacher_id, program_id, status, eligibility_result)
SELECT
  'DEMO-001',
  id,
  'eligible',
  '{"passed": ["min_years_experience","required_subject_area","required_qualification"], "failed": [], "summary": "Eligible for ISLA"}'::jsonb
FROM programs
WHERE program_name = 'ISLA'
LIMIT 1;

-- DB7 — four STAR-partnered training_events (relative dates)
INSERT INTO training_events (
  program_id,
  title,
  organizer,
  venue,
  venue_region,
  start_date,
  end_date,
  registration_deadline,
  is_star_partnered,
  required_forms,
  event_specific_fields
)
SELECT
  id,
  'ISLA Cohort 12: Inquiry-Based Physics',
  'STAR DOST',
  'Tacloban City',
  'Region VIII',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  (CURRENT_DATE + INTERVAL '16 days')::date,
  (CURRENT_DATE + INTERVAL '7 days')::date,
  TRUE,
  '["pds"]'::jsonb,
  '[
    {"key": "dietary_restrictions", "label": "Dietary restrictions", "type": "text", "required": false, "max_length": 200},
    {"key": "room_sharing", "label": "Room sharing", "type": "select", "required": true, "options": ["Yes", "No"]},
    {"key": "transportation", "label": "Transportation", "type": "select", "required": true, "options": ["Self-arranged", "Organizer-provided"]}
  ]'::jsonb
FROM programs
WHERE program_name = 'ISLA'
LIMIT 1;

INSERT INTO training_events (
  program_id,
  title,
  organizer,
  venue,
  venue_region,
  start_date,
  end_date,
  registration_deadline,
  is_star_partnered,
  required_forms,
  event_specific_fields
)
SELECT
  id,
  'CBEP Math Facilitators Workshop',
  'PNU',
  'Cebu City',
  NULL,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  (CURRENT_DATE + INTERVAL '31 days')::date,
  (CURRENT_DATE + INTERVAL '20 days')::date,
  TRUE,
  '["pds"]'::jsonb,
  '[]'::jsonb
FROM programs
WHERE program_name = 'CBEP'
LIMIT 1;

INSERT INTO training_events (
  program_id,
  title,
  organizer,
  venue,
  venue_region,
  start_date,
  end_date,
  registration_deadline,
  is_star_partnered,
  required_forms,
  event_specific_fields
)
SELECT
  id,
  'STAR Fellowship Orientation 2026',
  'STAR DOST',
  'Manila',
  NULL,
  (CURRENT_DATE + INTERVAL '45 days')::date,
  (CURRENT_DATE + INTERVAL '47 days')::date,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  TRUE,
  '["pds"]'::jsonb,
  '[]'::jsonb
FROM programs
WHERE program_name = 'STAR Fellowship'
LIMIT 1;

INSERT INTO training_events (
  program_id,
  title,
  organizer,
  venue,
  venue_region,
  start_date,
  end_date,
  registration_deadline,
  is_star_partnered,
  required_forms,
  event_specific_fields
)
SELECT
  id,
  'MTU Rural Outreach Preview',
  'SEAMEO INNOTECH',
  'Davao',
  NULL,
  (CURRENT_DATE + INTERVAL '60 days')::date,
  (CURRENT_DATE + INTERVAL '61 days')::date,
  (CURRENT_DATE + INTERVAL '45 days')::date,
  TRUE,
  '["pds"]'::jsonb,
  '[]'::jsonb
FROM programs
WHERE program_name = 'MTU'
LIMIT 1;

-- DB8 — in-flight registrations for DEMO-001 (not ISLA; created during demo)
INSERT INTO event_registrations (
  teacher_id,
  event_id,
  status,
  event_specific_answers,
  submitted_at,
  next_action
)
SELECT
  'DEMO-001',
  id,
  'submitted',
  '{}'::jsonb,
  NOW() - INTERVAL '3 days',
  'Waiting for division approval'
FROM training_events
WHERE title = 'CBEP Math Facilitators Workshop'
LIMIT 1;

INSERT INTO event_registrations (
  teacher_id,
  event_id,
  status,
  event_specific_answers,
  approved_at,
  next_action
)
SELECT
  'DEMO-001',
  te.id,
  'approved',
  '{}'::jsonb,
  NOW() - INTERVAL '1 day',
  'Prepare for STAR Fellowship Orientation 2026 on ' || te.start_date::text
FROM training_events te
WHERE te.title = 'STAR Fellowship Orientation 2026'
LIMIT 1;
