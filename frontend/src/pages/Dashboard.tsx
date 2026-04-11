import { useEffect } from "react"

import { dashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

const demoRegions: RegionalScore[] = [
  {
    region: "Region VIII",
    region_code: "R8",
    underserved_score: 42,
    traffic_light: "red",
    supply_subscore: 39,
    impact_subscore: 48,
    demand_subscore: 41,
    teacher_student_ratio: 37.4,
    specialization_pct: 34.8,
    star_coverage_pct: 21.6,
    avg_nat_score: 58.2,
    ppst_content_knowledge: 0.58,
    ppst_curriculum_planning: 0.52,
    ppst_research_based_practice: 0.47,
    ppst_assessment_literacy: 0.42,
    ppst_professional_development: 0.54,
    demand_signal_count: 19,
    critical_pings: [
      {
        region: "Region VIII",
        severity: "CRITICAL",
        message: "Assessment Literacy backlog exceeds target threshold.",
      },
    ],
  },
]

export default function Dashboard() {
  useEffect(() => {
    const { regions, activeRegion } = dashboardStore.getState()
    if (regions.length === 0) dashboardStore.setRegions(demoRegions)
    if (!activeRegion) dashboardStore.setActiveRegion(demoRegions[0].region)
  }, [])

  return (
    <div>
      <h1 className="text-lg font-medium">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Home view. Full dashboard content ships in later blueprint prompts.
      </p>
    </div>
  )
}
