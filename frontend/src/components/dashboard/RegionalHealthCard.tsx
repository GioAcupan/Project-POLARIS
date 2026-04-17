import { useState } from "react"

import { DemandView } from "@/components/dashboard/detail-views/DemandView"
import { ImpactView } from "@/components/dashboard/detail-views/ImpactView"
import { SummaryView } from "@/components/dashboard/detail-views/SummaryView"
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
  if (trafficLight === "red") return "bg-signal-critical text-text-primary"
  if (trafficLight === "yellow") return "bg-signal-warning text-text-primary"
  return "bg-signal-good text-text-primary"
}

export function RegionalHealthCardContent({ regionData }: { regionData: RegionalScore }) {
  const region = toRegionHealth(regionData)
  const [activeTab, setActiveTab] = useState<"summary" | "demand" | "impact">("summary")

  return (
    <section className="rounded-glass p-4 polaris-glass-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-section-title font-extrabold text-text-primary">{region.region}</h2>
        <span
          className={`rounded-full px-2 py-1 text-label font-semibold tracking-wide ${pillClass(region.traffic_light)}`}
        >
          {region.traffic_light.toUpperCase()}
        </span>
      </div>
      <p className="mt-1 text-metric font-semibold text-text-primary">Score: {Math.round(region.score)}</p>
      <p className="mt-3 text-content text-text-secondary">{keyInsight(region)}</p>

      <div className="mt-4 flex gap-2">
        {(["summary", "demand", "impact"] as const).map((tab) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-full border px-3 py-1 text-label font-semibold uppercase tracking-wide transition",
                active
                  ? "border-indigo-500/30 bg-indigo-500/10 text-slate-900"
                  : "border-white/20 bg-white/40 text-text-secondary",
              ].join(" ")}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        {activeTab === "summary" ? <SummaryView regionHealth={region} /> : null}
        {activeTab === "demand" ? <DemandView selectedRegion={regionData} /> : null}
        {activeTab === "impact" ? <ImpactView selectedRegion={regionData} /> : null}
      </div>
    </section>
  )
}

export function RegionalHealthCard({ selectedRegion }: { selectedRegion: RegionalScore }) {
  return <RegionalHealthCardContent regionData={selectedRegion} />
}
