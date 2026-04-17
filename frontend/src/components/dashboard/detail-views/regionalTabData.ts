import type {
  DemandMetricData,
  ImpactDatumData,
  ImpactRowData,
  RegionalScore,
  RegionalTabData,
  SummaryFactorKey,
  SummaryFactorTrend,
  SummaryTrendPoint,
  SupplyMetricData,
  TrendDirection,
} from "@/types/polaris"

const MOCK_SUMMARY_TREND_SERIES: SummaryTrendPoint[] = [
  { label: "2021", regional: 80, national: 75 },
  { label: "2022", regional: 85, national: 78 },
  { label: "2023", regional: 78, national: 80 },
  { label: "2024", regional: 90, national: 82 },
  { label: "2025", regional: 88, national: 85 },
]

const MOCK_SUMMARY_FACTOR_TRENDS: Record<SummaryFactorKey, SummaryFactorTrend> = {
  teacher_student_ratio: { direction: "up", pct: 2, favorable: false },
  specialization_pct: { direction: "up", pct: 8, favorable: true },
  star_coverage_pct: { direction: "up", pct: 5, favorable: true },
  avg_nat_score: { direction: "down", pct: 2, favorable: false },
}

const MOCK_SUPPLY_SCORE_BADGE = 78
const MOCK_SUPPLY_METRICS: SupplyMetricData[] = [
  { label: "Teacher Density", value: 86 },
  { label: "Specialization", value: 88 },
  { label: "STAR Coverage", value: 92 },
  { label: "Infrastructure", value: 85 },
  { label: "Resources", value: 88 },
]

const MOCK_DEMAND_SCORE_BADGE = 69
const MOCK_DEMAND_LEGEND_LABEL = "Requests"
const MOCK_DEMAND_NOTE = "Note: Red on the map = high volume of demand; more bars = more types of demands"
const MOCK_DEMAND_METRICS: DemandMetricData[] = [
  { label: "Cutting-Edge Pedagogy", requests: 68 },
  { label: "AI in Education", requests: 58 },
  { label: "International Standards", requests: 52 },
  { label: "Research Excellence", requests: 45 },
  { label: "Innovation Labs", requests: 38 },
]

const MOCK_IMPACT_SCORE_BADGE = 54
const MOCK_IMPACT_SERIES: ImpactDatumData[] = [
  { year: "2022", training: 580, nat: 76, feedback: 3.8 },
  { year: "2023", training: 650, nat: 78, feedback: 4.1 },
  { year: "2024", training: 720, nat: 79, feedback: 4.3 },
  { year: "2025", training: 780, nat: 82, feedback: 4.6 },
]
const MOCK_IMPACT_ROWS: ImpactRowData[] = MOCK_IMPACT_SERIES.map((entry) => ({
  period: entry.year,
  training: entry.training,
  nat: entry.nat,
}))

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null
  return Number.isFinite(value) ? value : null
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mergeSummaryTrendSeries(series?: SummaryTrendPoint[]): SummaryTrendPoint[] {
  if (!series || series.length === 0) return MOCK_SUMMARY_TREND_SERIES

  const sanitized = series
    .map((entry) => {
      const label = toNonEmptyString(entry.label)
      const regional = toFiniteNumber(entry.regional)
      const national = toFiniteNumber(entry.national)
      if (!label || regional === null || national === null) return null
      return { label, regional, national }
    })
    .filter((entry): entry is SummaryTrendPoint => entry !== null)

  if (sanitized.length === 0) return MOCK_SUMMARY_TREND_SERIES

  const mockLabels = new Set(MOCK_SUMMARY_TREND_SERIES.map((entry) => entry.label))
  const hasOverlap = sanitized.some((entry) => mockLabels.has(entry.label))
  if (!hasOverlap) return sanitized

  const incomingByLabel = new Map(sanitized.map((entry) => [entry.label, entry]))
  const merged = MOCK_SUMMARY_TREND_SERIES.map((entry) => incomingByLabel.get(entry.label) ?? entry)
  const extras = sanitized.filter((entry) => !mockLabels.has(entry.label))
  return [...merged, ...extras]
}

function mergeSupplyMetrics(metrics?: SupplyMetricData[]): SupplyMetricData[] {
  if (!metrics || metrics.length === 0) return MOCK_SUPPLY_METRICS

  const sanitized = metrics
    .map((entry) => {
      const label = toNonEmptyString(entry.label)
      const value = toFiniteNumber(entry.value)
      if (!label || value === null) return null
      return { label, value }
    })
    .filter((entry): entry is SupplyMetricData => entry !== null)

  if (sanitized.length === 0) return MOCK_SUPPLY_METRICS

  const mockLabels = new Set(MOCK_SUPPLY_METRICS.map((entry) => entry.label))
  const hasOverlap = sanitized.some((entry) => mockLabels.has(entry.label))
  if (!hasOverlap) return sanitized

  const incomingByLabel = new Map(sanitized.map((entry) => [entry.label, entry]))
  const merged = MOCK_SUPPLY_METRICS.map((entry) => incomingByLabel.get(entry.label) ?? entry)
  const extras = sanitized.filter((entry) => !mockLabels.has(entry.label))
  return [...merged, ...extras]
}

function mergeDemandMetrics(metrics?: DemandMetricData[]): DemandMetricData[] {
  if (!metrics || metrics.length === 0) return MOCK_DEMAND_METRICS

  const sanitized = metrics
    .map((entry) => {
      const label = toNonEmptyString(entry.label)
      const requests = toFiniteNumber(entry.requests)
      if (!label || requests === null) return null
      return { label, requests }
    })
    .filter((entry): entry is DemandMetricData => entry !== null)

  if (sanitized.length === 0) return MOCK_DEMAND_METRICS

  const mockLabels = new Set(MOCK_DEMAND_METRICS.map((entry) => entry.label))
  const hasOverlap = sanitized.some((entry) => mockLabels.has(entry.label))
  if (!hasOverlap) return sanitized

  const incomingByLabel = new Map(sanitized.map((entry) => [entry.label, entry]))
  const merged = MOCK_DEMAND_METRICS.map((entry) => incomingByLabel.get(entry.label) ?? entry)
  const extras = sanitized.filter((entry) => !mockLabels.has(entry.label))
  return [...merged, ...extras]
}

function mergeImpactSeries(series?: ImpactDatumData[]): ImpactDatumData[] {
  if (!series || series.length === 0) return MOCK_IMPACT_SERIES

  const sanitized = series
    .map((entry) => {
      const year = toNonEmptyString(entry.year)
      const training = toFiniteNumber(entry.training)
      const nat = toFiniteNumber(entry.nat)
      const feedback = toFiniteNumber(entry.feedback)
      if (!year || training === null || nat === null || feedback === null) return null
      return { year, training, nat, feedback }
    })
    .filter((entry): entry is ImpactDatumData => entry !== null)

  if (sanitized.length === 0) return MOCK_IMPACT_SERIES

  const mockYears = new Set(MOCK_IMPACT_SERIES.map((entry) => entry.year))
  const hasOverlap = sanitized.some((entry) => mockYears.has(entry.year))
  if (!hasOverlap) return sanitized

  const incomingByYear = new Map(sanitized.map((entry) => [entry.year, entry]))
  const merged = MOCK_IMPACT_SERIES.map((entry) => incomingByYear.get(entry.year) ?? entry)
  const extras = sanitized.filter((entry) => !mockYears.has(entry.year))
  return [...merged, ...extras]
}

function mergeImpactRows(rows: ImpactRowData[] | undefined, series: ImpactDatumData[]): ImpactRowData[] {
  const sourceRows =
    rows && rows.length > 0
      ? rows
      : series.map((entry) => ({ period: entry.year, training: entry.training, nat: entry.nat }))

  const sanitized = sourceRows
    .map((entry) => {
      const period = toNonEmptyString(entry.period)
      const training = toFiniteNumber(entry.training)
      const nat = toFiniteNumber(entry.nat)
      if (!period || training === null || nat === null) return null
      return { period, training, nat }
    })
    .filter((entry): entry is ImpactRowData => entry !== null)

  if (sanitized.length === 0) return MOCK_IMPACT_ROWS

  const mockPeriods = new Set(MOCK_IMPACT_ROWS.map((entry) => entry.period))
  const hasOverlap = sanitized.some((entry) => mockPeriods.has(entry.period))
  if (!hasOverlap) return sanitized

  const incomingByPeriod = new Map(sanitized.map((entry) => [entry.period, entry]))
  const merged = MOCK_IMPACT_ROWS.map((entry) => incomingByPeriod.get(entry.period) ?? entry)
  const extras = sanitized.filter((entry) => !mockPeriods.has(entry.period))
  return [...merged, ...extras]
}

function sanitizeTrendDirection(direction: unknown): TrendDirection | null {
  return direction === "up" || direction === "down" ? direction : null
}

function mergeSummaryFactorTrends(
  trends?: Partial<Record<SummaryFactorKey, SummaryFactorTrend>>,
): Partial<Record<SummaryFactorKey, SummaryFactorTrend>> {
  if (!trends) return MOCK_SUMMARY_FACTOR_TRENDS

  const merged: Partial<Record<SummaryFactorKey, SummaryFactorTrend>> = { ...MOCK_SUMMARY_FACTOR_TRENDS }
  ;(Object.keys(MOCK_SUMMARY_FACTOR_TRENDS) as SummaryFactorKey[]).forEach((key) => {
    const incoming = trends[key]
    if (!incoming) return

    const direction = sanitizeTrendDirection(incoming.direction)
    const pct = toFiniteNumber(incoming.pct)
    if (!direction || pct === null || typeof incoming.favorable !== "boolean") return

    merged[key] = {
      direction,
      pct,
      favorable: incoming.favorable,
    }
  })
  return merged
}

function fallbackNumber(value: unknown, fallback: number): number {
  const numeric = toFiniteNumber(value)
  return numeric ?? fallback
}

function fallbackText(value: unknown, fallback: string): string {
  return toNonEmptyString(value) ?? fallback
}

export function buildRegionalTabData(region: RegionalScore): RegionalTabData {
  const impactSeries = mergeImpactSeries(region.impact_series)
  return {
    summary: {
      trend_series: mergeSummaryTrendSeries(region.summary_trend_series),
      factor_trends: mergeSummaryFactorTrends(region.summary_factor_trends),
    },
    supply: {
      score_badge: fallbackNumber(region.supply_score_badge, MOCK_SUPPLY_SCORE_BADGE),
      metrics: mergeSupplyMetrics(region.supply_metrics),
    },
    demand: {
      score_badge: fallbackNumber(region.demand_score_badge, MOCK_DEMAND_SCORE_BADGE),
      legend_label: fallbackText(region.demand_legend_label, MOCK_DEMAND_LEGEND_LABEL),
      metrics: mergeDemandMetrics(region.demand_metrics),
      note: fallbackText(region.demand_note, MOCK_DEMAND_NOTE),
    },
    impact: {
      score_badge: fallbackNumber(region.impact_score_badge, MOCK_IMPACT_SCORE_BADGE),
      series: impactSeries,
      rows: mergeImpactRows(region.impact_rows, impactSeries),
    },
  }
}
