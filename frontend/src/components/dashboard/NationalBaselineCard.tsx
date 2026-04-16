import { useMemo, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { GlassCard } from "@/components/ui/glass-card"
import {
  BASELINE_TREND_SOURCE,
  DEMO_BASELINE_TRENDS,
  type BaselineMetricKey,
} from "@/config/dashboard"
import { dashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"
import { cn } from "@/lib/utils"

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averageOptionalDelta(
  regions: RegionalScore[],
  pick: (region: RegionalScore) => number | undefined,
): number | null {
  const vals = regions
    .map(pick)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function resolveTrendDeltaPct(
  metric: BaselineMetricKey,
  regions: RegionalScore[],
): number | null {
  if (BASELINE_TREND_SOURCE === "demo") {
    return DEMO_BASELINE_TRENDS[metric].deltaPct
  }
  switch (metric) {
    case "teacher_student_ratio":
      return averageOptionalDelta(regions, (r) => r.teacher_student_ratio_delta_pct)
    case "specialization_pct":
      return averageOptionalDelta(regions, (r) => r.specialization_pct_delta_pct)
    case "star_coverage_pct":
      return averageOptionalDelta(regions, (r) => r.star_coverage_pct_delta_pct)
    case "avg_nat_score":
      return averageOptionalDelta(regions, (r) => r.avg_nat_score_delta_pct)
  }
}

/** Higher value is worse; downward change in metric is good (green). */
function isTrendBeneficial(metric: BaselineMetricKey, deltaPct: number): boolean | null {
  if (deltaPct === 0) return null
  if (metric === "teacher_student_ratio") {
    return deltaPct < 0
  }
  return deltaPct > 0
}

function formatMainValue(metric: BaselineMetricKey, value: number): string {
  if (metric === "teacher_student_ratio") {
    const rounded = Math.max(0, Math.round(value))
    return `1:${rounded}`
  }
  if (metric === "specialization_pct" || metric === "star_coverage_pct") {
    return `${value.toFixed(0)}%`
  }
  return value.toFixed(0)
}

const FACTORS_CONFIG: Array<{
  key: BaselineMetricKey
  label: string
  accessor: (region: RegionalScore) => number
}> = [
  {
    key: "teacher_student_ratio",
    label: "Teacher-Student Ratio",
    accessor: (r) => r.teacher_student_ratio,
  },
  {
    key: "specialization_pct",
    label: "Specialization %",
    accessor: (r) => r.specialization_pct,
  },
  {
    key: "star_coverage_pct",
    label: "STAR Coverage %",
    accessor: (r) => r.star_coverage_pct,
  },
  {
    key: "avg_nat_score",
    label: "Average NAT Score",
    accessor: (r) => r.avg_nat_score,
  },
]

export function NationalBaselineCard({ regions }: { regions: RegionalScore[] }) {
  const [query, setQuery] = useState("")
  const searchableRegions = useMemo(() => regions.map((region) => region.region), [regions])
  const regionalCounts = useMemo(() => {
    return regions.reduce(
      (counts, region) => {
        if (region.traffic_light === "red") counts.critical += 1
        else if (region.traffic_light === "yellow") counts.atRisk += 1
        else counts.stable += 1
        return counts
      },
      { critical: 0, atRisk: 0, stable: 0 },
    )
  }, [regions])

  const chartData = [
    {
      label: "Critical",
      value: regionalCounts.critical,
      color: "var(--color-signal-critical)",
    },
    {
      label: "At Risk",
      value: regionalCounts.atRisk,
      color: "var(--color-signal-warning)",
    },
    {
      label: "Stable",
      value: regionalCounts.stable,
      color: "var(--color-signal-good)",
    },
  ]

  const totalRegions = regions.length

  const factorRows = useMemo(() => {
    return FACTORS_CONFIG.map((cfg) => {
      const value = average(regions.map(cfg.accessor))
      const deltaPct = resolveTrendDeltaPct(cfg.key, regions)
      return { ...cfg, value, deltaPct }
    })
  }, [regions])

  const handleSearch = () => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return
    const matchedRegion = searchableRegions.find((regionName) =>
      regionName.toLowerCase().includes(normalized),
    )
    if (matchedRegion) {
      dashboardStore.setActiveRegion(matchedRegion)
      dashboardStore.setTriggerFlyTo(!dashboardStore.getState().triggerFlyTo)
    }
  }

  return (
    <GlassCard className="w-full self-start">
      <label className="sr-only" htmlFor="region-search">
        Search by Region
      </label>
      <div className="shrink-0 flex items-center gap-2 rounded-glass border border-white/20 bg-white/40 px-3 py-2">
        <input
          id="region-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleSearch()
            }
          }}
          placeholder="Search by Region"
          className="w-full bg-transparent text-content font-medium text-text-primary outline-none placeholder:text-text-secondary"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-full bg-brand-blue px-3 py-1 text-label font-semibold text-text-primary transition hover:opacity-90"
        >
          Find
        </button>
      </div>
      <h2 className="mt-4 shrink-0 font-heading text-section-title font-extrabold text-text-primary">
        National Baseline View
      </h2>

      <div className="mt-3 flex flex-row items-center justify-between gap-4 rounded-glass border border-white/20 bg-white/35 p-3">
        <div className="flex w-[45%] min-w-0 items-center justify-center">
          <div className="relative h-32 w-full max-w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth={2}
                  paddingAngle={3}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-label font-semibold uppercase tracking-wide text-text-secondary">Regions</p>
                <p className="text-metric font-semibold text-text-primary">{totalRegions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[55%] min-w-0 flex-col gap-2">
          {chartData.map((entry) => (
            <div key={entry.label} className="flex items-center gap-2 rounded-md border border-white/25 bg-white/45 px-3 py-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-content font-medium text-text-primary">{entry.label}</span>
              <span className="flex-1" />
              <span className="text-content font-bold text-text-primary">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pr-1">
        <div className="grid grid-cols-2 gap-4">
          {factorRows.map((factor) => {
            const main = formatMainValue(factor.key, factor.value)
            const deltaPct = factor.deltaPct
            const beneficial =
              deltaPct === null ? null : isTrendBeneficial(factor.key, deltaPct)
            const arrow =
              deltaPct === null ? null : deltaPct > 0 ? "↑" : deltaPct < 0 ? "↓" : "→"
            const trendText =
              deltaPct === null ? null : `${arrow} ${Math.abs(deltaPct)}%`

            return (
              <div
                key={factor.key}
                className="flex min-h-[120px] min-w-0 flex-col justify-between rounded-lg border border-white/20 bg-white/40 p-3 shadow-sm md:min-h-[132px]"
              >
                <p className="text-xs font-medium leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">
                  {factor.label}
                </p>
                <div className="flex min-h-[3.25rem] flex-wrap items-baseline justify-end gap-2">
                  <span className="text-3xl font-bold leading-none tracking-tight text-text-primary sm:text-4xl">
                    {main}
                  </span>
                  {trendText !== null ? (
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        beneficial === null && "text-slate-500 dark:text-slate-400",
                        beneficial === true && "text-emerald-600 dark:text-emerald-400",
                        beneficial === false && "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {trendText}
                    </span>
                  ) : BASELINE_TREND_SOURCE === "backend" ? (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">—</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}
