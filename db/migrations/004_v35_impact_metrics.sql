-- v3.5 Impact metrics additions for fiscal effect analytics
-- Additive only; safe on top of existing v3.4 schema.

ALTER TABLE regional_scores
  ADD COLUMN student_pop INTEGER DEFAULT 0;

ALTER TABLE regional_scores
  ADD COLUMN economic_loss NUMERIC(15,2) DEFAULT 0;

ALTER TABLE regional_scores
  ADD COLUMN lays_score NUMERIC(5,2) DEFAULT 0;
