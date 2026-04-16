import { useMemo, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { GlassCard } from "@/components/ui/glass-card"
import { dashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

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

  const factors = [
    { label: "Teacher-Student Ratio", value: average(regions.map((region) => region.teacher_student_ratio)) },
    { label: "Specialization %", value: average(regions.map((region) => region.specialization_pct)) },
    { label: "STAR Coverage %", value: average(regions.map((region) => region.star_coverage_pct)) },
    { label: "Average NAT Score", value: average(regions.map((region) => region.avg_nat_score)) },
  ]

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

      <div className="mt-4 flex flex-row items-center justify-between gap-4 rounded-glass border border-white/20 bg-white/35 p-3">
        <div className="flex w-[45%] min-w-0 items-center justify-center">
          <div className="relative h-36 w-full max-w-[180px]">
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

      <div className="mt-5 max-h-[28vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          {factors.map((factor) => (
            <div key={factor.label} className="rounded-md border border-white/20 bg-white/40 p-2">
              <p className="text-label font-semibold uppercase tracking-wide text-text-secondary">
                {factor.label}
              </p>
              <p className="mt-1 text-metric font-semibold text-text-primary">{factor.value.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
