-- v3.6 Advanced tab metrics schema additions for Regional Health Card
-- Additive only; safe on top of existing v3.5 schema.

ALTER TABLE regional_scores
  ADD COLUMN supply_score_badge NUMERIC(5,2),
  ADD COLUMN impact_score_badge NUMERIC(5,2),
  ADD COLUMN demand_score_badge NUMERIC(5,2),
  ADD COLUMN demand_legend_label VARCHAR(50),
  ADD COLUMN demand_note TEXT;

CREATE TABLE regional_supply_metrics (
  region         VARCHAR(100) NOT NULL
                   REFERENCES regional_scores(region) ON DELETE CASCADE,
  label          VARCHAR(100) NOT NULL,
  value          NUMERIC(5,2) NOT NULL CHECK (value BETWEEN 0 AND 100),
  display_order  SMALLINT     NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (region, label)
);

CREATE INDEX idx_regional_supply_metrics_region ON regional_supply_metrics(region);

CREATE TABLE regional_demand_metrics (
  region         VARCHAR(100) NOT NULL
                   REFERENCES regional_scores(region) ON DELETE CASCADE,
  label          VARCHAR(100) NOT NULL,
  requests       INTEGER      NOT NULL CHECK (requests >= 0),
  display_order  SMALLINT     NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (region, label)
);

CREATE INDEX idx_regional_demand_metrics_region ON regional_demand_metrics(region);

CREATE TABLE regional_impact_series (
  region          VARCHAR(100) NOT NULL
                    REFERENCES regional_scores(region) ON DELETE CASCADE,
  year            SMALLINT     NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  training_volume INTEGER      NOT NULL CHECK (training_volume >= 0),
  avg_nat_score   NUMERIC(5,2) NOT NULL CHECK (avg_nat_score BETWEEN 0 AND 100),
  avg_feedback    NUMERIC(3,2) NOT NULL CHECK (avg_feedback BETWEEN 0 AND 5),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (region, year)
);

CREATE INDEX idx_regional_impact_series_region ON regional_impact_series(region);
CREATE INDEX idx_regional_impact_series_year ON regional_impact_series(year);
