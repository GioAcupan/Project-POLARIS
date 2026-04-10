-- v3.4 Module 4 + STARBOT (DB1–DB4)
-- Additive only: requires v3.1 tables teachers, programs, nominations.

-- DB1
DO $$
BEGIN
  CREATE TYPE registration_status AS ENUM (
    'draft',
    'forms_generated',
    'submitted',
    'approved',
    'attended',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- DB2
CREATE TABLE IF NOT EXISTS teacher_profile_extended (
  deped_id VARCHAR(30) PRIMARY KEY REFERENCES teachers (deped_id) ON DELETE CASCADE,
  name_extension VARCHAR(10) NULL,
  sex VARCHAR(10) CHECK (sex IS NULL OR sex IN ('Male', 'Female')),
  date_of_birth DATE NULL,
  civil_status VARCHAR(20) CHECK (
    civil_status IS NULL
    OR civil_status IN ('Single', 'Married', 'Separated', 'Widowed')
  ),
  place_of_birth VARCHAR(255),
  citizenship VARCHAR(50) DEFAULT 'Filipino',
  height_cm NUMERIC(5, 2),
  weight_kg NUMERIC(5, 2),
  blood_type VARCHAR(5),
  mobile_number VARCHAR(20),
  telephone_number VARCHAR(20),
  email VARCHAR(100),
  addr_house_no VARCHAR(50),
  addr_street VARCHAR(100),
  addr_subdivision VARCHAR(100),
  addr_barangay VARCHAR(100),
  addr_city VARCHAR(100),
  addr_province VARCHAR(100),
  addr_zip VARCHAR(10),
  completeness_score SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
  last_verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teacher_profile_extended_last_verified_at ON teacher_profile_extended (last_verified_at);

-- DB3
CREATE TABLE IF NOT EXISTS training_events (
  id SERIAL PRIMARY KEY,
  program_id INT NOT NULL REFERENCES programs (id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  venue VARCHAR,
  venue_region VARCHAR,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE NOT NULL,
  is_star_partnered BOOLEAN NOT NULL DEFAULT FALSE,
  funding_source VARCHAR(50),
  required_forms JSONB NOT NULL DEFAULT '["pds"]'::jsonb,
  event_specific_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  capacity INT,
  slots_remaining INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_training_events_program_id ON training_events (program_id);
CREATE INDEX idx_training_events_start_date ON training_events (start_date);
CREATE INDEX idx_training_events_is_star_partnered ON training_events (is_star_partnered);
CREATE INDEX idx_training_events_registration_deadline ON training_events (registration_deadline);

-- DB4
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  teacher_id VARCHAR(30) NOT NULL REFERENCES teachers (deped_id) ON DELETE CASCADE,
  event_id INT NOT NULL REFERENCES training_events (id) ON DELETE RESTRICT,
  status registration_status NOT NULL DEFAULT 'draft',
  event_specific_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  nomination_id INT REFERENCES nominations (id),
  generated_pds_path TEXT,
  generated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_action VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_id, event_id)
);

CREATE INDEX idx_event_registrations_teacher_id ON event_registrations (teacher_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations (event_id);
CREATE INDEX idx_event_registrations_status ON event_registrations (status);

-- Verification (after apply on a DB that already has v3.1 schema):
--   \dt public.*
-- Expect new tables among existing ones:
--     teacher_profile_extended
--     training_events
--     event_registrations
--   SELECT unnest(enum_range(NULL::registration_status));
--   \d teacher_profile_extended
--   \d training_events
--   \d event_registrations
