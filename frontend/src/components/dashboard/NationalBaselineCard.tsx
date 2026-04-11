import type { RegionalScore } from "@/types/polaris"

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function NationalBaselineCard({ regions }: { regions: RegionalScore[] }) {
  const avgSupply = average(regions.map((region) => region.supply_subscore))
  const avgDemand = average(regions.map((region) => region.demand_subscore))
  const avgImpact = average(regions.map((region) => region.impact_subscore))

  const donutStyle = {
    background: `conic-gradient(
      #0d9488 0 ${avgSupply}%,
      #14b8a6 ${avgSupply}% ${avgSupply + avgDemand}%,
      #2dd4bf ${avgSupply + avgDemand}% 100%
    )`,
  }

  const factors = [
    { label: "Teacher-Student Ratio", value: average(regions.map((region) => region.teacher_student_ratio)) },
    { label: "Specialization %", value: average(regions.map((region) => region.specialization_pct)) },
    { label: "STAR Coverage %", value: average(regions.map((region) => region.star_coverage_pct)) },
    { label: "Average NAT Score", value: average(regions.map((region) => region.avg_nat_score)) },
  ]

  return (
    <section className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
      <h2 className="text-sm font-semibold text-foreground">National Baseline</h2>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-32 w-32 rounded-full" style={donutStyle}>
          <div className="absolute inset-4 rounded-full bg-card" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {factors.map((factor) => (
          <div key={factor.label} className="rounded-md border border-border bg-background p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {factor.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{factor.value.toFixed(1)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
