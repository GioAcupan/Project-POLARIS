-- POLARIS 001_init.sql — Base schema (v3.1)

-- ============================================================================
-- SECTION 1 — CUSTOM ENUM TYPES (§2.3.0)
-- ============================================================================
DO $$
BEGIN
    CREATE TYPE subject_area AS ENUM ('Science', 'Mathematics', 'Both');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE qualification_level AS ENUM ('Bachelor', 'Master', 'Doctorate', 'None');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE nomination_status AS ENUM (
        'pending_eligibility',
        'eligible',
        'ineligible',
        'enrolled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE traffic_light AS ENUM ('green', 'yellow', 'red');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- ============================================================================
-- SECTION 2 — TABLE: schools (§2.3.1)
-- ============================================================================
CREATE TABLE schools (
    school_id       SERIAL          PRIMARY KEY,
    school_name     VARCHAR(255)    NOT NULL,
    region          VARCHAR(100)    NOT NULL,
    division        VARCHAR(100)    NOT NULL,
    psgc_code       CHAR(10)        NOT NULL,
    is_gida         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_region ON schools(region);
CREATE INDEX idx_schools_division ON schools(division);
CREATE INDEX idx_schools_psgc ON schools(psgc_code);

-- ============================================================================
-- SECTION 3 — TABLE: programs (§2.3.2)
-- ============================================================================
CREATE TABLE programs (
    id                  SERIAL          PRIMARY KEY,
    program_name        VARCHAR(100)    NOT NULL UNIQUE,
    subject_area        subject_area    NOT NULL,
    description         TEXT,
    eligibility_rules   JSONB           NOT NULL DEFAULT '{}',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4 — TABLE: teachers (§2.3.3)
-- ============================================================================
CREATE TABLE teachers (
    -- Identity
    deped_id                VARCHAR(30)             PRIMARY KEY,
    star_id                 VARCHAR(50)             NOT NULL UNIQUE,
    first_name              VARCHAR(100)            NOT NULL,
    last_name               VARCHAR(100)            NOT NULL,
    middle_name             VARCHAR(100),

    -- Location (fully denormalized)
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

    -- TVI (computed, never user-editable)
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

CREATE INDEX idx_teachers_region ON teachers(region);
CREATE INDEX idx_teachers_division ON teachers(division);
CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_teachers_subject_area ON teachers(subject_area);
CREATE INDEX idx_teachers_tvi_score ON teachers(tvi_score);
CREATE INDEX idx_teachers_is_gida ON teachers(is_gida);

-- ============================================================================
-- SECTION 5 — TABLE: trainings (§2.3.4)
-- ============================================================================
CREATE TABLE trainings (
    id                      SERIAL          PRIMARY KEY,
    teacher_id              VARCHAR(30)     NOT NULL
                                REFERENCES teachers(deped_id)
                                ON DELETE CASCADE,
    program_id              INTEGER
                                REFERENCES programs(id)
                                ON DELETE SET NULL,
    program_name_cache      VARCHAR(100),
    region                  VARCHAR(100)    NOT NULL,
    division                VARCHAR(100)    NOT NULL,
    module_tag              VARCHAR(100),
    completion_date         DATE            NOT NULL,
    ppst_weights            JSONB,
    is_ppst_tagged          BOOLEAN         NOT NULL DEFAULT FALSE,
    rating                  SMALLINT        CHECK (rating BETWEEN 1 AND 5),
    feedback_text           TEXT,
    feedback_submitted_at   TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trainings_teacher_id ON trainings(teacher_id);
CREATE INDEX idx_trainings_program_id ON trainings(program_id);
CREATE INDEX idx_trainings_region ON trainings(region);
CREATE INDEX idx_trainings_completion ON trainings(completion_date);
CREATE INDEX idx_trainings_ppst_tagged ON trainings(is_ppst_tagged);

-- ============================================================================
-- SECTION 6 — TABLE: outcomes (§2.3.5)
-- ============================================================================
CREATE TABLE outcomes (
    id          SERIAL          PRIMARY KEY,
    school_id   INTEGER         NOT NULL
                    REFERENCES schools(school_id)
                    ON DELETE CASCADE,
    region      VARCHAR(100)    NOT NULL,
    psgc_code   CHAR(10)        NOT NULL,
    subject     subject_area    NOT NULL,
    nat_score   NUMERIC(5,2)    NOT NULL CHECK (nat_score BETWEEN 0 AND 100),
    year        SMALLINT        NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, subject, year)
);

CREATE INDEX idx_outcomes_school_id ON outcomes(school_id);
CREATE INDEX idx_outcomes_region ON outcomes(region);
CREATE INDEX idx_outcomes_subject ON outcomes(subject);
CREATE INDEX idx_outcomes_year ON outcomes(year);

-- ============================================================================
-- SECTION 7 — TABLE: needs_signals (§2.3.6)
-- ============================================================================
CREATE TABLE needs_signals (
    id              SERIAL          PRIMARY KEY,
    teacher_id      VARCHAR(30)     NOT NULL
                        REFERENCES teachers(deped_id)
                        ON DELETE CASCADE,
    region          VARCHAR(100)    NOT NULL,
    division        VARCHAR(100)    NOT NULL,
    raw_text        TEXT            NOT NULL,
    subject_tag     VARCHAR(100),
    topic_tag       VARCHAR(100),
    context_tag     VARCHAR(100),
    is_processed    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_needs_region ON needs_signals(region);
CREATE INDEX idx_needs_teacher ON needs_signals(teacher_id);
CREATE INDEX idx_needs_processed ON needs_signals(is_processed);
CREATE INDEX idx_needs_created ON needs_signals(created_at);

-- ============================================================================
-- SECTION 8 — TABLE: nominations (§2.3.7)
-- ============================================================================
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
    UNIQUE (teacher_id, program_id)
);

CREATE INDEX idx_nominations_teacher ON nominations(teacher_id);
CREATE INDEX idx_nominations_program ON nominations(program_id);
CREATE INDEX idx_nominations_status ON nominations(status);

-- ============================================================================
-- SECTION 9 — TABLE: regional_scores (§2.3.8)
-- ============================================================================
CREATE TABLE regional_scores (
    region                          VARCHAR(100)    PRIMARY KEY,
    psgc_code                       CHAR(10),
    underserved_score               NUMERIC(5,2)    NOT NULL DEFAULT 0,
    supply_subscore                 NUMERIC(5,2)    NOT NULL DEFAULT 0,
    impact_subscore                 NUMERIC(5,2)    NOT NULL DEFAULT 0,
    demand_subscore                 NUMERIC(5,2)    NOT NULL DEFAULT 0,
    teacher_student_ratio           NUMERIC(8,4),
    specialization_pct              NUMERIC(5,2),
    star_coverage_pct               NUMERIC(5,2),
    avg_nat_score                   NUMERIC(5,2),
    demand_signal_count             INTEGER         NOT NULL DEFAULT 0,
    ppst_content_knowledge          NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_curriculum_planning        NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_research_based_practice    NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_assessment_literacy        NUMERIC(4,3)    NOT NULL DEFAULT 0,
    ppst_professional_development   NUMERIC(4,3)    NOT NULL DEFAULT 0,
    critical_pings                  JSONB           NOT NULL DEFAULT '[]',
    total_teachers                  INTEGER         NOT NULL DEFAULT 0,
    traffic_light                   traffic_light   NOT NULL DEFAULT 'red',
    computed_at                     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10 — VIEW: regional_nat_trends (§2.3.9)
-- ============================================================================
CREATE VIEW regional_nat_trends AS
SELECT
    o.region,
    o.subject,
    o.year,
    ROUND(AVG(o.nat_score), 2) AS avg_nat_score,
    COUNT(DISTINCT o.school_id) AS school_count
FROM outcomes o
GROUP BY o.region, o.subject, o.year
ORDER BY o.region, o.subject, o.year;

-- Verification: After running this file, these checks should pass:
-- \dt should show: schools, programs, teachers, trainings, outcomes, needs_signals, nominations, regional_scores
-- \dT+ should show: subject_area, qualification_level, nomination_status, traffic_light
-- \dv should show: regional_nat_trends
-- SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'; → 8

-- End of 001_init.sql — Next: run 002_seed.sql
