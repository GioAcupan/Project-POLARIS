import { useState } from "react"

import { DemandView } from "@/components/dashboard/detail-views/DemandView"
import { ImpactView } from "@/components/dashboard/detail-views/ImpactView"
import { SupplyView } from "@/components/dashboard/detail-views/SupplyView"
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

export function RegionalHealthCard({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const region = toRegionHealth(selectedRegion)
  const [activeTab, setActiveTab] = useState<"summary" | "supply" | "demand" | "impact">("summary")

  return (
    <section className="rounded-glass p-3 polaris-glass-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-section-title font-extrabold text-text-primary">{region.region}</h2>
        <span
          className={`rounded-full px-2 py-1 text-label font-semibold tracking-wide ${pillClass(region.traffic_light)}`}
        >
          {region.traffic_light.toUpperCase()}
        </span>
      </div>
      <p className="mt-1 text-metric font-semibold text-text-primary">Score: {Math.round(region.score)}</p>
      <p className="mt-2 text-content text-text-secondary">{keyInsight(region)}</p>

      <div className="mt-3 rounded-full border border-[#7ea3d7] bg-white/35 p-1">
        <div className="grid grid-cols-4 gap-1">
          {(["summary", "supply", "impact", "demand"] as const).map((tab) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-full px-3 py-1 text-label font-semibold tracking-wide transition",
                  active
                    ? "bg-[#8ec8ff] text-[#1e2a3b]"
                    : "bg-transparent text-[#1f62ac]",
                ].join(" ")}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-2.5">
        {activeTab === "summary" ? <SummaryView regionHealth={region} /> : null}
        {activeTab === "supply" ? <SupplyView selectedRegion={selectedRegion} /> : null}
        {activeTab === "demand" ? <DemandView selectedRegion={selectedRegion} /> : null}
        {activeTab === "impact" ? <ImpactView selectedRegion={selectedRegion} /> : null}
      </div>
    </section>
  )
}
