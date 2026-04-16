/**
 * Dashboard demo / backend switches. Toggle trend source via VITE_BASELINE_TREND_SOURCE=demo|backend
 * When "backend" is selected, National baseline bento cards average optional `*_delta_pct` fields on RegionalScore.
 */

export type BaselineTrendSource = "demo" | "backend"

export type BaselineMetricKey =
  | "teacher_student_ratio"
  | "specialization_pct"
  | "star_coverage_pct"
  | "avg_nat_score"

/** Which trend pipeline to use for national baseline bento cards */
export const BASELINE_TREND_SOURCE: BaselineTrendSource = (() => {
  const raw = import.meta.env.VITE_BASELINE_TREND_SOURCE
  if (raw === "backend") return "backend"
  return "demo"
})()

/** Demo-only deltas (% points change) for pitch / Figma parity. Replace with backend fields when wired. */
export const DEMO_BASELINE_TRENDS: Record<BaselineMetricKey, { deltaPct: number }> = {
  teacher_student_ratio: { deltaPct: 2 },
  specialization_pct: { deltaPct: 8 },
  star_coverage_pct: { deltaPct: 5 },
  avg_nat_score: { deltaPct: -2 },
}
