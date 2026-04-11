import { useMemo, useState } from "react"

import { dashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function NationalBaselineCard({ regions }: { regions: RegionalScore[] }) {
  const [query, setQuery] = useState("")
  const avgSupply = average(regions.map((region) => region.supply_subscore))
  const avgDemand = average(regions.map((region) => region.demand_subscore))
  const avgGood = Math.max(0, 100 - avgSupply - avgDemand)
  const searchableRegions = useMemo(() => regions.map((region) => region.region), [regions])

  const donutStyle = {
    background: `conic-gradient(
      var(--color-signal-good) 0 ${avgGood}%,
      var(--color-signal-warning) ${avgGood}% ${avgGood + avgDemand}%,
      var(--color-signal-critical) ${avgGood + avgDemand}% 100%
    )`,
  }

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
    <section className="rounded-glass p-4 polaris-glass-card">
      <label className="sr-only" htmlFor="region-search">
        Search by Region
      </label>
      <div className="flex items-center gap-2 rounded-glass border border-border bg-card px-3 py-2">
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
      <h2 className="mt-4 font-heading text-section-title font-extrabold text-text-primary">
        National Baseline View
      </h2>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-32 w-32 rounded-full" style={donutStyle}>
          <div className="absolute inset-4 rounded-full bg-card" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {factors.map((factor) => (
          <div key={factor.label} className="rounded-md border border-border bg-background p-2">
            <p className="text-label font-semibold uppercase tracking-wide text-text-secondary">
              {factor.label}
            </p>
            <p className="mt-1 text-metric font-semibold text-text-primary">{factor.value.toFixed(1)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
