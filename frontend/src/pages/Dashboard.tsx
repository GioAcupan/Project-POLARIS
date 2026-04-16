import { useEffect, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

import { CriticalPingsFeed } from "@/components/dashboard/CriticalPingsFeed"
import { LensSelector } from "@/components/dashboard/LensSelector"
import { MapCanvas } from "@/components/dashboard/MapCanvas"
import { NationalBaselineCard } from "@/components/dashboard/NationalBaselineCard"
import { PPSTRadarCard } from "@/components/dashboard/PPSTRadarCard"
import { RegionalHealthCard } from "@/components/dashboard/RegionalHealthCard"
import { useNationalRadar } from "@/hooks/useNationalRadar"
import { useDashboardAiReports, useRegions } from "@/hooks/useRegions"
import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

function makeFallbackRegionalScore(regionName: string): RegionalScore {
  return {
    region: regionName,
    region_code: "UNKNOWN",
    underserved_score: 50,
    traffic_light: "yellow",
    supply_subscore: 50,
    impact_subscore: 50,
    demand_subscore: 50,
    teacher_student_ratio: 35,
    specialization_pct: 0,
    star_coverage_pct: 0,
    avg_nat_score: 0,
    ppst_content_knowledge: 0,
    ppst_curriculum_planning: 0,
    ppst_research_based_practice: 0,
    ppst_assessment_literacy: 0,
    ppst_professional_development: 0,
    demand_signal_count: 0,
  }
}

export default function Dashboard() {
  const { data: regions = [] } = useRegions()
  const { data: dashboardAiReports = null } = useDashboardAiReports(5)
  const { data: nationalRadar = null } = useNationalRadar()
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const aiReportRegions = dashboardAiReports?.limited_results ?? []
  const selectedRegion = regions.find((region) => region.region === activeRegion) ?? null
  const selectedRegionForView = useMemo(() => {
    if (!activeRegion) return null
    return selectedRegion ?? makeFallbackRegionalScore(activeRegion)
  }, [activeRegion, selectedRegion])
  const resetToNational = () => {
    dashboardStore.setActiveRegion(null)
    dashboardStore.setTriggerResetToNational(!dashboardStore.getState().triggerResetToNational)
  }

  useEffect(() => {
    dashboardStore.setRegions(regions)
  }, [regions])

  useEffect(() => {
    dashboardStore.setNationalRadar(nationalRadar)
  }, [nationalRadar])

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent animate-in fade-in duration-300">
      <MapCanvas regions={regions} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <header className="pointer-events-auto absolute inset-x-screen-margin top-screen-margin flex items-center justify-between gap-card-gap">
          <h1 className="font-heading text-display-dashboard font-extrabold text-text-primary">
            DASHBOARD
          </h1>
          <div className="flex items-center gap-3">
            {activeRegion && selectedRegionForView ? (
              <button
                type="button"
                onClick={resetToNational}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-label font-medium text-text-primary backdrop-blur-md transition-all duration-200 ease-in-out hover:bg-white/30 hover:shadow-[0_0_18px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label={`Back to national view from ${selectedRegionForView.region}`}
              >
                <span>Philippines &gt; {selectedRegionForView.region}</span>
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <LensSelector />
          </div>
        </header>

        <div className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute left-screen-margin flex w-80 flex-col items-start gap-card-gap overflow-y-auto pr-1">
          <div className="w-full max-h-[60vh]">
            <PPSTRadarCard radar={nationalRadar} />
          </div>
          <section className="flex h-fit w-full max-h-[35vh] flex-col rounded-glass p-6 polaris-glass-card">
            <h2 className="font-heading text-section-title font-extrabold text-text-primary">AI Reports</h2>
            <div className="polaris-dashboard-scroll mt-element-stack min-h-0 overflow-y-auto pr-1">
              <CriticalPingsFeed regions={aiReportRegions} />
            </div>
          </section>
        </div>

        <AnimatePresence mode="wait">
          {activeRegion && selectedRegionForView ? (
            <motion.div
              key={`regional-${selectedRegionForView.region}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute right-screen-margin flex w-[440px] items-start overflow-y-auto"
            >
              <RegionalHealthCard selectedRegion={selectedRegionForView} />
            </motion.div>
          ) : (
            <motion.div
              key="national-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute right-screen-margin flex w-[440px] items-start overflow-y-auto"
            >
              <NationalBaselineCard regions={regions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
