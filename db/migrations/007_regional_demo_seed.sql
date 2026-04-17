-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 007 — REGIONAL DEMO SEED (ALL 17 PHILIPPINE REGIONS)
-- ───────────────────────────────────────────────────────────────────────────────
-- Purpose:  Populate every region of the Philippines with realistic, internally
--           consistent demo data so the POLARIS dashboard looks production-grade
--           regardless of which region the judge clicks on.
--
-- Scope:    - regional_scores              (17 rows, UPSERT on region)
--           - regional_supply_metrics      (85 rows, 5 per region)
--           - regional_demand_metrics      (85 rows, 5 per region)
--           - regional_impact_series       (68 rows, 4 years × 17 regions)
--           - programs                     (51 rows, 3 per region — UNIQUE names)
--
-- Excluded: supply_subscore, impact_subscore, demand_subscore
--           underserved_score (let API/scoring.py recompute if needed)
--
-- Run:      psql "$DATABASE_URL_DIRECT" -f db/migrations/007_regional_demo_seed.sql
--           Idempotent — safe to re-run between demo takes.
--
-- Migration owner: Person A (per Blueprint App.6)
-- Story shape: 4 green • 6 yellow • 7 red — worst actors are BARMM, R8, Caraga,
--              MIMAROPA, R5, R9, R12. Hero of the demo: Region VIII.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. NCR  (National Capital Region)  —  GREEN  •  PSGC 1300000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'NCR', '1300000000',
    32.5000, 74.80, 38.20, 65.40,
    52, 64800, 2280000, 2150000000.00, 9.10,
    'green'::traffic_light,
    3.350, 3.200, 2.950, 2.900, 3.150,
    '[{"region":"NCR","severity":"WARNING","message":"Overcrowding pressure — STAR capacity saturated in NCR divisions"},{"region":"NCR","severity":"GAP","message":"Assessment literacy trailing content mastery by 0.45 points"}]'::jsonb,
    78.00, 82.50, 45.00,
    'Moderate Demand', 'Signals concentrated in pedagogical innovation and AI readiness.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code,
    teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct,
    star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score,
    demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers,
    student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss,
    lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge,
    impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge,
    demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note,
    computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('NCR', 'Teacher Density', 82.00, 1),
    ('NCR', 'Specialization', 75.00, 2),
    ('NCR', 'STAR Coverage',  38.00, 3),
    ('NCR', 'Infrastructure', 88.00, 4),
    ('NCR', 'Resources',      85.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('NCR', 'Cutting-Edge Pedagogy',    18, 1),
    ('NCR', 'AI in Education',          22, 2),
    ('NCR', 'International Standards',  15, 3),
    ('NCR', 'Research Excellence',      12, 4),
    ('NCR', 'Innovation Labs',          14, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('NCR', 2022, 1180, 61.20, 4.10),
    ('NCR', 2023, 1340, 63.50, 4.20),
    ('NCR', 2024, 1520, 64.80, 4.30),
    ('NCR', 2025, 1680, 65.40, 4.40)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CAR  (Cordillera Administrative Region)  —  GREEN  •  PSGC 1400000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'CAR', '1400000000',
    28.0000, 68.50, 41.20, 67.80,
    34, 17600, 495000, 680000000.00, 9.20,
    'green'::traffic_light,
    3.400, 3.250, 3.050, 3.100, 3.000,
    '[{"region":"CAR","severity":"WARNING","message":"GIDA schools in Kalinga and Ifugao need travel-subsidy pathway"}]'::jsonb,
    75.00, 85.00, 32.00,
    'Low Demand', 'Most requests from GIDA districts. Infrastructure need outpaces pedagogy gap.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('CAR', 'Teacher Density', 78.00, 1),
    ('CAR', 'Specialization', 69.00, 2),
    ('CAR', 'STAR Coverage',  41.00, 3),
    ('CAR', 'Infrastructure', 62.00, 4),
    ('CAR', 'Resources',      70.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('CAR', 'Cutting-Edge Pedagogy',   9, 1),
    ('CAR', 'AI in Education',         8, 2),
    ('CAR', 'International Standards', 6, 3),
    ('CAR', 'Research Excellence',     7, 4),
    ('CAR', 'Innovation Labs',         4, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('CAR', 2022, 420, 64.10, 4.30),
    ('CAR', 2023, 480, 65.80, 4.40),
    ('CAR', 2024, 540, 66.90, 4.40),
    ('CAR', 2025, 590, 67.80, 4.50)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Region I  (Ilocos Region)  —  YELLOW  •  PSGC 0100000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region I', '0100000000',
    35.8000, 58.30, 24.80, 54.60,
    48, 34200, 1080000, 3950000000.00, 7.90,
    'yellow'::traffic_light,
    2.750, 2.600, 2.350, 2.400, 2.550,
    '[{"region":"Region I","severity":"WARNING","message":"Research-based practice lagging 0.35 below national median"}]'::jsonb,
    62.00, 64.00, 52.00,
    'Moderate Demand', 'Research and assessment literacy gaps driving most signals.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region I', 'Teacher Density', 65.00, 1),
    ('Region I', 'Specialization', 58.00, 2),
    ('Region I', 'STAR Coverage',  25.00, 3),
    ('Region I', 'Infrastructure', 68.00, 4),
    ('Region I', 'Resources',      60.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region I', 'Cutting-Edge Pedagogy',   14, 1),
    ('Region I', 'AI in Education',         11, 2),
    ('Region I', 'International Standards',  8, 3),
    ('Region I', 'Research Excellence',      9, 4),
    ('Region I', 'Innovation Labs',          6, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region I', 2022, 620, 51.80, 3.70),
    ('Region I', 2023, 710, 52.90, 3.80),
    ('Region I', 2024, 790, 53.80, 3.90),
    ('Region I', 2025, 850, 54.60, 4.00)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Region II  (Cagayan Valley)  —  YELLOW  •  PSGC 0200000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region II', '0200000000',
    37.2000, 55.60, 22.40, 52.80,
    54, 24800, 790000, 3420000000.00, 7.70,
    'yellow'::traffic_light,
    2.650, 2.550, 2.300, 2.350, 2.450,
    '[{"region":"Region II","severity":"WARNING","message":"Batanes and Apayao remote districts underserved"},{"region":"Region II","severity":"GAP","message":"Math specialization under 50% in Cagayan"}]'::jsonb,
    58.00, 61.00, 56.00,
    'Moderate Demand', 'Persistent signals from remote and island districts.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region II', 'Teacher Density', 61.00, 1),
    ('Region II', 'Specialization', 56.00, 2),
    ('Region II', 'STAR Coverage',  22.00, 3),
    ('Region II', 'Infrastructure', 58.00, 4),
    ('Region II', 'Resources',      55.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region II', 'Cutting-Edge Pedagogy',   15, 1),
    ('Region II', 'AI in Education',         10, 2),
    ('Region II', 'International Standards',  9, 3),
    ('Region II', 'Research Excellence',     11, 4),
    ('Region II', 'Innovation Labs',          9, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region II', 2022, 410, 49.80, 3.60),
    ('Region II', 2023, 465, 50.90, 3.70),
    ('Region II', 2024, 520, 51.90, 3.80),
    ('Region II', 2025, 570, 52.80, 3.80)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Region III  (Central Luzon)  —  GREEN  •  PSGC 0300000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region III', '0300000000',
    31.5000, 66.20, 32.50, 60.80,
    45, 58400, 2460000, 2680000000.00, 8.60,
    'green'::traffic_light,
    3.100, 2.950, 2.700, 2.750, 2.850,
    '[{"region":"Region III","severity":"WARNING","message":"Aurora and Zambales coastal divisions show specialization gap"}]'::jsonb,
    72.00, 76.00, 44.00,
    'Moderate Demand', 'Manufacturing-belt schools drive AI and pedagogy requests.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region III', 'Teacher Density', 74.00, 1),
    ('Region III', 'Specialization', 66.00, 2),
    ('Region III', 'STAR Coverage',  33.00, 3),
    ('Region III', 'Infrastructure', 78.00, 4),
    ('Region III', 'Resources',      72.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region III', 'Cutting-Edge Pedagogy',   14, 1),
    ('Region III', 'AI in Education',         12, 2),
    ('Region III', 'International Standards',  8, 3),
    ('Region III', 'Research Excellence',      6, 4),
    ('Region III', 'Innovation Labs',          5, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region III', 2022, 1060, 57.20, 4.00),
    ('Region III', 2023, 1190, 58.60, 4.10),
    ('Region III', 2024, 1330, 59.90, 4.20),
    ('Region III', 2025, 1460, 60.80, 4.30)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Region IV-A  (CALABARZON)  —  GREEN  •  PSGC 0400000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region IV-A', '0400000000',
    30.2000, 69.40, 34.80, 62.10,
    58, 74200, 3180000, 2910000000.00, 8.80,
    'green'::traffic_light,
    3.200, 3.050, 2.800, 2.850, 2.950,
    '[{"region":"Region IV-A","severity":"WARNING","message":"Rizal and Cavite urban fringe schools overcapacity"}]'::jsonb,
    74.00, 78.00, 50.00,
    'Moderate Demand', 'Growth corridors (Cavite, Laguna, Batangas) driving innovation signals.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region IV-A', 'Teacher Density', 76.00, 1),
    ('Region IV-A', 'Specialization', 69.00, 2),
    ('Region IV-A', 'STAR Coverage',  35.00, 3),
    ('Region IV-A', 'Infrastructure', 82.00, 4),
    ('Region IV-A', 'Resources',      75.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region IV-A', 'Cutting-Edge Pedagogy',   18, 1),
    ('Region IV-A', 'AI in Education',         15, 2),
    ('Region IV-A', 'International Standards', 10, 3),
    ('Region IV-A', 'Research Excellence',      8, 4),
    ('Region IV-A', 'Innovation Labs',          7, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region IV-A', 2022, 1280, 58.40, 4.00),
    ('Region IV-A', 2023, 1440, 59.80, 4.10),
    ('Region IV-A', 2024, 1610, 61.00, 4.20),
    ('Region IV-A', 2025, 1770, 62.10, 4.30)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. MIMAROPA  (Region IV-B)  —  RED  •  PSGC 1700000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'MIMAROPA', '1700000000',
    46.8000, 41.20, 14.20, 44.20,
    67, 21400, 740000, 7850000000.00, 6.60,
    'red'::traffic_light,
    2.150, 2.050, 1.900, 1.950, 2.000,
    '[{"region":"MIMAROPA","severity":"CRITICAL","message":"Palawan and Occidental Mindoro GIDA schools — 70% without specialized science teacher"},{"region":"MIMAROPA","severity":"GAP","message":"Inter-island travel barrier cuts STAR enrollment"}]'::jsonb,
    38.00, 42.00, 66.00,
    'High Demand', 'Island logistics and specialization scarcity compound underservice.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('MIMAROPA', 'Teacher Density', 42.00, 1),
    ('MIMAROPA', 'Specialization', 41.00, 2),
    ('MIMAROPA', 'STAR Coverage',  14.00, 3),
    ('MIMAROPA', 'Infrastructure', 35.00, 4),
    ('MIMAROPA', 'Resources',      38.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('MIMAROPA', 'Cutting-Edge Pedagogy',   17, 1),
    ('MIMAROPA', 'AI in Education',         14, 2),
    ('MIMAROPA', 'International Standards', 12, 3),
    ('MIMAROPA', 'Research Excellence',     13, 4),
    ('MIMAROPA', 'Innovation Labs',         11, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('MIMAROPA', 2022, 240, 41.60, 3.30),
    ('MIMAROPA', 2023, 280, 42.60, 3.40),
    ('MIMAROPA', 2024, 310, 43.50, 3.50),
    ('MIMAROPA', 2025, 340, 44.20, 3.60)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. Region V  (Bicol Region)  —  RED  •  PSGC 0500000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region V', '0500000000',
    42.5000, 46.80, 17.60, 47.30,
    71, 48600, 1820000, 8120000000.00, 6.90,
    'red'::traffic_light,
    2.300, 2.200, 2.000, 2.050, 2.150,
    '[{"region":"Region V","severity":"CRITICAL","message":"Typhoon corridor — recurring disruption to learning continuity"},{"region":"Region V","severity":"WARNING","message":"Catanduanes and Masbate divisions need targeted support"}]'::jsonb,
    44.00, 46.00, 70.00,
    'High Demand', 'Disaster-resilient pedagogy and catch-up learning requests dominate.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region V', 'Teacher Density', 48.00, 1),
    ('Region V', 'Specialization', 47.00, 2),
    ('Region V', 'STAR Coverage',  18.00, 3),
    ('Region V', 'Infrastructure', 42.00, 4),
    ('Region V', 'Resources',      45.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region V', 'Cutting-Edge Pedagogy',   18, 1),
    ('Region V', 'AI in Education',         16, 2),
    ('Region V', 'International Standards', 13, 3),
    ('Region V', 'Research Excellence',     13, 4),
    ('Region V', 'Innovation Labs',         11, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region V', 2022, 680, 44.40, 3.40),
    ('Region V', 2023, 760, 45.50, 3.50),
    ('Region V', 2024, 830, 46.40, 3.60),
    ('Region V', 2025, 890, 47.30, 3.70)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. Region VI  (Western Visayas)  —  YELLOW  •  PSGC 0600000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region VI', '0600000000',
    38.4000, 53.20, 21.80, 51.40,
    56, 49200, 1900000, 4680000000.00, 7.50,
    'yellow'::traffic_light,
    2.550, 2.450, 2.200, 2.250, 2.350,
    '[{"region":"Region VI","severity":"WARNING","message":"Aklan and Guimaras posting specialization gaps"}]'::jsonb,
    56.00, 58.00, 55.00,
    'Moderate Demand', 'Assessment literacy and Math specialization requests leading.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region VI', 'Teacher Density', 58.00, 1),
    ('Region VI', 'Specialization', 53.00, 2),
    ('Region VI', 'STAR Coverage',  22.00, 3),
    ('Region VI', 'Infrastructure', 62.00, 4),
    ('Region VI', 'Resources',      58.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region VI', 'Cutting-Edge Pedagogy',   16, 1),
    ('Region VI', 'AI in Education',         13, 2),
    ('Region VI', 'International Standards', 10, 3),
    ('Region VI', 'Research Excellence',      9, 4),
    ('Region VI', 'Innovation Labs',          8, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region VI', 2022, 700, 48.50, 3.70),
    ('Region VI', 2023, 790, 49.60, 3.80),
    ('Region VI', 2024, 870, 50.50, 3.80),
    ('Region VI', 2025, 940, 51.40, 3.90)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. Region VII  (Central Visayas)  —  YELLOW  •  PSGC 0700000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region VII', '0700000000',
    36.6000, 58.40, 26.40, 55.70,
    51, 44800, 1720000, 3810000000.00, 7.90,
    'yellow'::traffic_light,
    2.800, 2.700, 2.450, 2.500, 2.600,
    '[{"region":"Region VII","severity":"WARNING","message":"Bohol and Siquijor island divisions trailing urban Cebu"}]'::jsonb,
    64.00, 66.00, 50.00,
    'Moderate Demand', 'Urban-rural divide with Cebu pulling the average; islands lag.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region VII', 'Teacher Density', 63.00, 1),
    ('Region VII', 'Specialization', 58.00, 2),
    ('Region VII', 'STAR Coverage',  26.00, 3),
    ('Region VII', 'Infrastructure', 72.00, 4),
    ('Region VII', 'Resources',      66.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region VII', 'Cutting-Edge Pedagogy',   15, 1),
    ('Region VII', 'AI in Education',         13, 2),
    ('Region VII', 'International Standards',  9, 3),
    ('Region VII', 'Research Excellence',      8, 4),
    ('Region VII', 'Innovation Labs',          6, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region VII', 2022, 780, 52.60, 3.90),
    ('Region VII', 2023, 880, 53.70, 4.00),
    ('Region VII', 2024, 970, 54.80, 4.00),
    ('Region VII', 2025, 1040, 55.70, 4.10)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. Region VIII  (Eastern Visayas)  —  RED  •  PSGC 0800000000  ★ DEMO HERO ★
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region VIII', '0800000000',
    48.2000, 39.60, 12.40, 42.80,
    82, 37800, 1330000, 9240000000.00, 6.40,
    'red'::traffic_light,
    2.100, 2.000, 1.800, 1.750, 1.950,
    '[{"region":"Region VIII","severity":"CRITICAL","message":"Assessment literacy 1.75/4.0 — lowest nationally"},{"region":"Region VIII","severity":"CRITICAL","message":"12.4% STAR coverage against 82 active demand signals"},{"region":"Region VIII","severity":"GAP","message":"Samar and Biliran divisions need urgent pipeline"}]'::jsonb,
    36.00, 40.00, 82.00,
    'Critical Demand', 'Highest demand-to-coverage ratio nationally. Priority intervention zone.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region VIII', 'Teacher Density', 40.00, 1),
    ('Region VIII', 'Specialization', 40.00, 2),
    ('Region VIII', 'STAR Coverage',  12.00, 3),
    ('Region VIII', 'Infrastructure', 32.00, 4),
    ('Region VIII', 'Resources',      36.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region VIII', 'Cutting-Edge Pedagogy',   22, 1),
    ('Region VIII', 'AI in Education',         18, 2),
    ('Region VIII', 'International Standards', 14, 3),
    ('Region VIII', 'Research Excellence',     15, 4),
    ('Region VIII', 'Innovation Labs',         13, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region VIII', 2022, 420, 39.80, 3.10),
    ('Region VIII', 2023, 490, 41.00, 3.20),
    ('Region VIII', 2024, 560, 42.00, 3.30),
    ('Region VIII', 2025, 620, 42.80, 3.40)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. Region IX  (Zamboanga Peninsula)  —  RED  •  PSGC 0900000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region IX', '0900000000',
    44.8000, 42.50, 15.80, 44.60,
    69, 29600, 1080000, 7420000000.00, 6.70,
    'red'::traffic_light,
    2.250, 2.150, 1.950, 2.000, 2.100,
    '[{"region":"Region IX","severity":"CRITICAL","message":"Basilan GIDA districts — conflict-affected learning gaps"},{"region":"Region IX","severity":"WARNING","message":"Zamboanga Sibugay specialization pipeline thin"}]'::jsonb,
    40.00, 43.00, 68.00,
    'High Demand', 'Peace-and-order context; prioritize mobile and cohort-based delivery.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region IX', 'Teacher Density', 44.00, 1),
    ('Region IX', 'Specialization', 43.00, 2),
    ('Region IX', 'STAR Coverage',  16.00, 3),
    ('Region IX', 'Infrastructure', 38.00, 4),
    ('Region IX', 'Resources',      40.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region IX', 'Cutting-Edge Pedagogy',   18, 1),
    ('Region IX', 'AI in Education',         15, 2),
    ('Region IX', 'International Standards', 12, 3),
    ('Region IX', 'Research Excellence',     13, 4),
    ('Region IX', 'Innovation Labs',         11, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region IX', 2022, 340, 41.80, 3.30),
    ('Region IX', 2023, 390, 42.80, 3.40),
    ('Region IX', 2024, 440, 43.70, 3.50),
    ('Region IX', 2025, 490, 44.60, 3.60)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. Region X  (Northern Mindanao)  —  YELLOW  •  PSGC 1000000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region X', '1000000000',
    38.8000, 52.40, 20.60, 50.20,
    58, 39400, 1380000, 4240000000.00, 7.40,
    'yellow'::traffic_light,
    2.550, 2.450, 2.250, 2.300, 2.400,
    '[{"region":"Region X","severity":"WARNING","message":"Camiguin and Lanao del Norte divisions need re-tooling"}]'::jsonb,
    54.00, 55.00, 57.00,
    'Moderate Demand', 'Cagayan de Oro and Iligan urban centers stabilize the average.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region X', 'Teacher Density', 57.00, 1),
    ('Region X', 'Specialization', 52.00, 2),
    ('Region X', 'STAR Coverage',  21.00, 3),
    ('Region X', 'Infrastructure', 60.00, 4),
    ('Region X', 'Resources',      55.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region X', 'Cutting-Edge Pedagogy',   16, 1),
    ('Region X', 'AI in Education',         14, 2),
    ('Region X', 'International Standards', 11, 3),
    ('Region X', 'Research Excellence',      9, 4),
    ('Region X', 'Innovation Labs',          8, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region X', 2022, 620, 47.40, 3.70),
    ('Region X', 2023, 700, 48.50, 3.80),
    ('Region X', 2024, 770, 49.40, 3.90),
    ('Region X', 2025, 830, 50.20, 3.90)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. Region XI  (Davao Region)  —  YELLOW  •  PSGC 1100000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region XI', '1100000000',
    36.8000, 56.80, 24.20, 53.90,
    49, 34800, 1210000, 3580000000.00, 7.80,
    'yellow'::traffic_light,
    2.700, 2.600, 2.350, 2.400, 2.500,
    '[{"region":"Region XI","severity":"WARNING","message":"Davao Oriental coastal divisions need logistics support"}]'::jsonb,
    62.00, 64.00, 48.00,
    'Moderate Demand', 'Davao City acts as anchor; periphery provinces lag.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region XI', 'Teacher Density', 62.00, 1),
    ('Region XI', 'Specialization', 57.00, 2),
    ('Region XI', 'STAR Coverage',  24.00, 3),
    ('Region XI', 'Infrastructure', 68.00, 4),
    ('Region XI', 'Resources',      62.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region XI', 'Cutting-Edge Pedagogy',   14, 1),
    ('Region XI', 'AI in Education',         12, 2),
    ('Region XI', 'International Standards',  9, 3),
    ('Region XI', 'Research Excellence',      8, 4),
    ('Region XI', 'Innovation Labs',          6, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region XI', 2022, 620, 50.80, 3.80),
    ('Region XI', 2023, 700, 51.90, 3.90),
    ('Region XI', 2024, 770, 53.00, 3.90),
    ('Region XI', 2025, 830, 53.90, 4.00)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. Region XII  (SOCCSKSARGEN)  —  RED  •  PSGC 1200000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region XII', '1200000000',
    43.6000, 44.80, 16.40, 45.80,
    64, 31800, 1180000, 6820000000.00, 6.80,
    'red'::traffic_light,
    2.300, 2.200, 2.000, 2.050, 2.150,
    '[{"region":"Region XII","severity":"CRITICAL","message":"Sultan Kudarat and Sarangani schools — chronic supply gap"},{"region":"Region XII","severity":"WARNING","message":"Math specialization under 45%"}]'::jsonb,
    42.00, 44.00, 64.00,
    'High Demand', 'Agri-industrial divisions with persistent teacher-supply bottlenecks.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region XII', 'Teacher Density', 46.00, 1),
    ('Region XII', 'Specialization', 45.00, 2),
    ('Region XII', 'STAR Coverage',  16.00, 3),
    ('Region XII', 'Infrastructure', 44.00, 4),
    ('Region XII', 'Resources',      42.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region XII', 'Cutting-Edge Pedagogy',   17, 1),
    ('Region XII', 'AI in Education',         14, 2),
    ('Region XII', 'International Standards', 12, 3),
    ('Region XII', 'Research Excellence',     12, 4),
    ('Region XII', 'Innovation Labs',          9, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region XII', 2022, 420, 42.80, 3.40),
    ('Region XII', 2023, 480, 43.90, 3.50),
    ('Region XII', 2024, 540, 44.90, 3.50),
    ('Region XII', 2025, 590, 45.80, 3.60)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 16. Region XIII  (Caraga)  —  RED  •  PSGC 1600000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'Region XIII', '1600000000',
    45.2000, 41.80, 13.80, 43.50,
    68, 22400, 760000, 7280000000.00, 6.50,
    'red'::traffic_light,
    2.200, 2.100, 1.900, 1.950, 2.050,
    '[{"region":"Region XIII","severity":"CRITICAL","message":"Dinagat Islands and Agusan hinterlands — 74% specialization gap"},{"region":"Region XIII","severity":"WARNING","message":"IP (Indigenous Peoples) schools need culturally responsive STEM materials"}]'::jsonb,
    40.00, 42.00, 68.00,
    'High Demand', 'Mining-region divisions and IP communities under-supplied.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('Region XIII', 'Teacher Density', 42.00, 1),
    ('Region XIII', 'Specialization', 42.00, 2),
    ('Region XIII', 'STAR Coverage',  14.00, 3),
    ('Region XIII', 'Infrastructure', 38.00, 4),
    ('Region XIII', 'Resources',      40.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('Region XIII', 'Cutting-Edge Pedagogy',   17, 1),
    ('Region XIII', 'AI in Education',         15, 2),
    ('Region XIII', 'International Standards', 13, 3),
    ('Region XIII', 'Research Excellence',     13, 4),
    ('Region XIII', 'Innovation Labs',         10, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('Region XIII', 2022, 280, 40.60, 3.20),
    ('Region XIII', 2023, 320, 41.60, 3.30),
    ('Region XIII', 2024, 360, 42.60, 3.40),
    ('Region XIII', 2025, 390, 43.50, 3.50)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 17. BARMM  (Bangsamoro Autonomous Region in Muslim Mindanao)  —  RED  •  PSGC 1900000000
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO regional_scores (
    region, psgc_code,
    teacher_student_ratio, specialization_pct, star_coverage_pct, avg_nat_score,
    demand_signal_count, total_teachers, student_pop, economic_loss, lays_score,
    traffic_light,
    ppst_content_knowledge, ppst_curriculum_planning, ppst_research_based_practice,
    ppst_assessment_literacy, ppst_professional_development,
    critical_pings,
    supply_score_badge, impact_score_badge, demand_score_badge,
    demand_legend_label, demand_note
) VALUES (
    'BARMM', '1900000000',
    52.4000, 32.60, 9.40, 38.40,
    94, 31200, 1420000, 11840000000.00, 5.80,
    'red'::traffic_light,
    1.850, 1.800, 1.650, 1.700, 1.750,
    '[{"region":"BARMM","severity":"CRITICAL","message":"Lanao del Sur and Maguindanao — lowest specialization nationally (32.6%)"},{"region":"BARMM","severity":"CRITICAL","message":"Sulu and Tawi-Tawi island divisions — peace-and-order blocks STAR delivery"},{"region":"BARMM","severity":"CRITICAL","message":"Basilan teacher-student ratio 1:52 — worst nationally"}]'::jsonb,
    28.00, 32.00, 92.00,
    'Critical Demand', 'Highest-priority intervention region. Cultural, peace-and-order, and supply factors compound.'
)
ON CONFLICT (region) DO UPDATE SET
    psgc_code = EXCLUDED.psgc_code, teacher_student_ratio = EXCLUDED.teacher_student_ratio,
    specialization_pct = EXCLUDED.specialization_pct, star_coverage_pct = EXCLUDED.star_coverage_pct,
    avg_nat_score = EXCLUDED.avg_nat_score, demand_signal_count = EXCLUDED.demand_signal_count,
    total_teachers = EXCLUDED.total_teachers, student_pop = EXCLUDED.student_pop,
    economic_loss = EXCLUDED.economic_loss, lays_score = EXCLUDED.lays_score,
    traffic_light = EXCLUDED.traffic_light,
    ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
    ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
    ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
    ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
    ppst_professional_development = EXCLUDED.ppst_professional_development,
    critical_pings = EXCLUDED.critical_pings,
    supply_score_badge = EXCLUDED.supply_score_badge, impact_score_badge = EXCLUDED.impact_score_badge,
    demand_score_badge = EXCLUDED.demand_score_badge, demand_legend_label = EXCLUDED.demand_legend_label,
    demand_note = EXCLUDED.demand_note, computed_at = NOW();

INSERT INTO regional_supply_metrics (region, label, value, display_order) VALUES
    ('BARMM', 'Teacher Density', 28.00, 1),
    ('BARMM', 'Specialization', 33.00, 2),
    ('BARMM', 'STAR Coverage',   9.00, 3),
    ('BARMM', 'Infrastructure', 24.00, 4),
    ('BARMM', 'Resources',      28.00, 5)
ON CONFLICT (region, label) DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_demand_metrics (region, label, requests, display_order) VALUES
    ('BARMM', 'Cutting-Edge Pedagogy',   26, 1),
    ('BARMM', 'AI in Education',         21, 2),
    ('BARMM', 'International Standards', 16, 3),
    ('BARMM', 'Research Excellence',     18, 4),
    ('BARMM', 'Innovation Labs',         13, 5)
ON CONFLICT (region, label) DO UPDATE SET requests = EXCLUDED.requests, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO regional_impact_series (region, year, training_volume, avg_nat_score, avg_feedback) VALUES
    ('BARMM', 2022, 260, 35.40, 2.90),
    ('BARMM', 2023, 310, 36.50, 3.00),
    ('BARMM', 2024, 360, 37.50, 3.10),
    ('BARMM', 2025, 410, 38.40, 3.20)
ON CONFLICT (region, year) DO UPDATE SET training_volume = EXCLUDED.training_volume, avg_nat_score = EXCLUDED.avg_nat_score, avg_feedback = EXCLUDED.avg_feedback, updated_at = NOW();


-- ═══════════════════════════════════════════════════════════════════════════════
-- PROGRAMS — 3 per region (51 total)
-- ───────────────────────────────────────────────────────────────────────────────
-- Brand stays stable across regions; eligibility_rules.target_regions scopes each
-- row to its region (since `programs` has no region column, we use JSONB rules).
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO programs (program_name, subject_area, description, eligibility_rules, is_active) VALUES

-- NCR
('ISLA Cohort 12 — NCR', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in NCR. Focus: research-based practice, content mastery.', '{"target_regions":["NCR"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — NCR', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for NCR science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["NCR"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — NCR', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for NCR. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["NCR"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- CAR
('ISLA Cohort 12 — CAR', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in CAR. Focus: research-based practice, content mastery.', '{"target_regions":["CAR"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — CAR', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for CAR science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["CAR"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — CAR', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for CAR. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["CAR"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region I
('ISLA Cohort 12 — Region I', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region I. Focus: research-based practice, content mastery.', '{"target_regions":["Region I"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region I', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region I science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region I"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region I', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region I. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region I"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region II
('ISLA Cohort 12 — Region II', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region II. Focus: research-based practice, content mastery.', '{"target_regions":["Region II"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region II', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region II science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region II"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region II', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region II. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region II"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region III
('ISLA Cohort 12 — Region III', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region III. Focus: research-based practice, content mastery.', '{"target_regions":["Region III"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region III', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region III science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region III"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region III', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region III. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region III"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region IV-A
('ISLA Cohort 12 — Region IV-A', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region IV-A. Focus: research-based practice, content mastery.', '{"target_regions":["Region IV-A"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region IV-A', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region IV-A science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region IV-A"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region IV-A', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region IV-A. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region IV-A"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- MIMAROPA
('ISLA Cohort 12 — MIMAROPA', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in MIMAROPA. Focus: research-based practice, content mastery.', '{"target_regions":["MIMAROPA"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — MIMAROPA', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for MIMAROPA science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["MIMAROPA"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — MIMAROPA', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for MIMAROPA. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["MIMAROPA"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region V
('ISLA Cohort 12 — Region V', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region V. Focus: research-based practice, content mastery.', '{"target_regions":["Region V"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region V', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region V science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region V"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region V', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region V. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region V"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region VI
('ISLA Cohort 12 — Region VI', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region VI. Focus: research-based practice, content mastery.', '{"target_regions":["Region VI"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region VI', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region VI science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region VI"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region VI', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region VI. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region VI"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region VII
('ISLA Cohort 12 — Region VII', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region VII. Focus: research-based practice, content mastery.', '{"target_regions":["Region VII"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region VII', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region VII science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region VII"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region VII', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region VII. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region VII"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region VIII
('ISLA Cohort 12 — Region VIII', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region VIII. Focus: research-based practice, content mastery.', '{"target_regions":["Region VIII"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region VIII', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region VIII science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region VIII"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region VIII', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region VIII. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region VIII"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region IX
('ISLA Cohort 12 — Region IX', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region IX. Focus: research-based practice, content mastery.', '{"target_regions":["Region IX"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region IX', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region IX science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region IX"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region IX', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region IX. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region IX"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region X
('ISLA Cohort 12 — Region X', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region X. Focus: research-based practice, content mastery.', '{"target_regions":["Region X"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region X', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region X science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region X"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region X', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region X. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region X"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region XI
('ISLA Cohort 12 — Region XI', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region XI. Focus: research-based practice, content mastery.', '{"target_regions":["Region XI"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region XI', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region XI science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region XI"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region XI', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region XI. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region XI"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region XII
('ISLA Cohort 12 — Region XII', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region XII. Focus: research-based practice, content mastery.', '{"target_regions":["Region XII"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region XII', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region XII science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region XII"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region XII', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region XII. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region XII"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- Region XIII
('ISLA Cohort 12 — Region XIII', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in Region XIII. Focus: research-based practice, content mastery.', '{"target_regions":["Region XIII"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — Region XIII', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for Region XIII science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["Region XIII"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — Region XIII', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for Region XIII. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["Region XIII"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true),

-- BARMM
('ISLA Cohort 12 — BARMM', 'Science', 'Intensive Science Leadership Academy — 12-week cohort for lead science teachers in BARMM. Focus: research-based practice, content mastery.', '{"target_regions":["BARMM"],"subject_areas":["Science"],"min_years_experience":3,"max_slots":30,"cohort":"12"}'::jsonb, true),
('CBEP Workshop (Science Assessment) — BARMM', 'Science', 'Competency-Based Enhancement Program — assessment literacy workshop for BARMM science educators. Aligned to PPST and DepEd K-12 framework.', '{"target_regions":["BARMM"],"subject_areas":["Science"],"min_years_experience":2,"max_slots":40,"focus":"assessment_literacy"}'::jsonb, true),
('STAR Fest Regional Hub — BARMM', 'Both', 'STAR Fest Regional Hub — annual innovation and showcase event for BARMM. Open to Science and Math teachers. PPST-tagged sessions on pedagogy and AI-readiness.', '{"target_regions":["BARMM"],"subject_areas":["Science","Mathematics"],"min_years_experience":1,"max_slots":60,"event_type":"regional_hub"}'::jsonb, true)

ON CONFLICT (program_name) DO UPDATE SET
    subject_area     = EXCLUDED.subject_area,
    description      = EXCLUDED.description,
    eligibility_rules = EXCLUDED.eligibility_rules,
    is_active        = EXCLUDED.is_active;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SANITY CHECKS — run after commit to confirm expected row counts
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_regions       INT;
    v_supply        INT;
    v_demand        INT;
    v_impact        INT;
    v_programs      INT;
BEGIN
    SELECT COUNT(*) INTO v_regions       FROM regional_scores;
    SELECT COUNT(*) INTO v_supply        FROM regional_supply_metrics;
    SELECT COUNT(*) INTO v_demand        FROM regional_demand_metrics;
    SELECT COUNT(*) INTO v_impact        FROM regional_impact_series;
    SELECT COUNT(*) INTO v_programs      FROM programs WHERE is_active = TRUE;

    RAISE NOTICE '── POLARIS seed audit ──';
    RAISE NOTICE 'regional_scores:          % (expected ≥ 17)', v_regions;
    RAISE NOTICE 'regional_supply_metrics:  % (expected ≥ 85)', v_supply;
    RAISE NOTICE 'regional_demand_metrics:  % (expected ≥ 85)', v_demand;
    RAISE NOTICE 'regional_impact_series:   % (expected ≥ 68)', v_impact;
    RAISE NOTICE 'programs (is_active):     % (expected ≥ 51)', v_programs;

    IF v_regions < 17 OR v_supply < 85 OR v_demand < 85 OR v_impact < 68 OR v_programs < 51 THEN
        RAISE EXCEPTION 'Seed audit failed — one or more tables under expected row count';
    END IF;
END $$;

COMMIT;
