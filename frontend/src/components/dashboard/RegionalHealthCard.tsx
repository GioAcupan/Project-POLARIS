import type { RegionHealth, RegionalScore } from "@/types/polaris"

function toRegionHealth(region: RegionalScore): RegionHealth {
  return {
    region: region.region,
    traffic_light: region.traffic_light,
    score: region.underserved_score,
    factors: {
      teacher_student_ratio: region.teacher_student_ratio,
      specialization_pct: region.specialization_pct,
      star_coverage_pct: region.star_coverage_pct,
      avg_nat_score: region.avg_nat_score,
    },
  }
}

function worstFactor(region: RegionHealth): keyof RegionHealth["factors"] {
  const scored: Array<[keyof RegionHealth["factors"], number]> = [
    ["teacher_student_ratio", region.factors.teacher_student_ratio / 50],
    ["specialization_pct", (100 - region.factors.specialization_pct) / 100],
    ["star_coverage_pct", (100 - region.factors.star_coverage_pct) / 100],
    ["avg_nat_score", (100 - region.factors.avg_nat_score) / 100],
  ]

  return scored.sort((a, b) => b[1] - a[1])[0][0]
}

function keyInsight(region: RegionHealth): string {
  const worst = worstFactor(region)
  if (worst === "teacher_student_ratio") {
    return `Key Insight: Classroom load pressure is the largest drag in ${region.region}, indicating a supply bottleneck.`
  }
  if (worst === "specialization_pct") {
    return `Key Insight: The weakest factor is specialization coverage, suggesting targeted upskilling is needed first.`
  }
  if (worst === "star_coverage_pct") {
    return `Key Insight: STAR partner coverage is lagging, limiting access to quality intervention opportunities.`
  }
  return `Key Insight: NAT performance remains the limiting factor and should anchor intervention prioritization.`
}

function pillClass(trafficLight: RegionHealth["traffic_light"]): string {
  if (trafficLight === "red") return "bg-red-100 text-red-700"
  if (trafficLight === "yellow") return "bg-amber-100 text-amber-700"
  return "bg-emerald-100 text-emerald-700"
}

export function RegionalHealthCard({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const region = toRegionHealth(selectedRegion)
  const entries = Object.entries(region.factors)

  return (
    <section className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{region.region}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(region.traffic_light)}`}>
          {region.traffic_light.toUpperCase()}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">Score: {Math.round(region.score)}</p>
      <p className="mt-3 text-sm text-muted-foreground">{keyInsight(region)}</p>
      <div className="mt-4 space-y-2">
        {entries.map(([name, value]) => (
          <div key={name} className="rounded-md border border-border bg-background p-2 text-sm">
            <span className="font-medium text-foreground">{name.replaceAll("_", " ")}: </span>
            <span className="text-muted-foreground">{Number(value).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
