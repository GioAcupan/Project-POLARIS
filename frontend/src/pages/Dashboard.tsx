import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

import { EffectOverviewCard } from "@/components/dashboard/EffectOverviewCard"
import { LensSelector } from "@/components/dashboard/LensSelector"
import { MapCanvas } from "@/components/dashboard/MapCanvas"
import { NationalBaselineCard } from "@/components/dashboard/NationalBaselineCard"
import { PPSTRadarCard } from "@/components/dashboard/PPSTRadarCard"
import { RegionalHealthCard } from "@/components/dashboard/RegionalHealthCard"
import { useNationalRadar } from "@/hooks/useNationalRadar"
import { useRegions } from "@/hooks/useRegions"
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
  const dashboardRootRef = useRef<HTMLDivElement | null>(null)
  const leftRailRef = useRef<HTMLDivElement | null>(null)
  const radarCardRef = useRef<HTMLDivElement | null>(null)
  const [mapZoomTopOffset, setMapZoomTopOffset] = useState(96)
  const { data: regions = [] } = useRegions()
  const { data: nationalRadar = null } = useNationalRadar()
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
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

  useEffect(() => {
    const root = dashboardRootRef.current
    const leftRail = leftRailRef.current
    const radarCard = radarCardRef.current
    if (!root || !leftRail || !radarCard) return

    const updateMapZoomTopOffset = () => {
      const rootRect = root.getBoundingClientRect()
      const cardRect = radarCard.getBoundingClientRect()
      const nextOffset = cardRect.top - rootRect.top
      if (Number.isFinite(nextOffset)) {
        setMapZoomTopOffset(Math.max(0, Math.round(nextOffset)))
      }
    }

    updateMapZoomTopOffset()
    const observer = new ResizeObserver(updateMapZoomTopOffset)
    observer.observe(root)
    observer.observe(leftRail)
    observer.observe(radarCard)
    window.addEventListener("resize", updateMapZoomTopOffset)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateMapZoomTopOffset)
    }
  }, [nationalRadar, regions.length])

  const dashboardStyle = useMemo(
    () =>
      ({
        "--polaris-map-zoom-top": `${mapZoomTopOffset}px`,
      }) as CSSProperties,
    [mapZoomTopOffset],
  )

  return (
    <div
      ref={dashboardRootRef}
      style={dashboardStyle}
      className="relative h-full w-full overflow-hidden bg-transparent animate-in fade-in duration-300"
    >
      <MapCanvas regions={regions} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <header className="pointer-events-auto absolute inset-x-4 top-3 flex items-center justify-between gap-3 sm:inset-x-6 sm:top-4 sm:gap-4 xl:inset-x-screen-margin xl:top-5 xl:gap-card-gap">
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

        <div
          ref={leftRailRef}
          className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute left-4 flex w-[clamp(13rem,24vw,20rem)] flex-col items-start gap-4 overflow-y-auto pr-1 sm:left-6 xl:left-screen-margin xl:gap-card-gap"
        >
          <motion.div
            key={activeRegion ?? "national"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full"
          >
            <EffectOverviewCard />
          </motion.div>
          <div ref={radarCardRef} className="w-full max-h-[60vh]">
            <PPSTRadarCard radar={nationalRadar} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeRegion && selectedRegionForView ? (
            <motion.div
              key={`regional-${selectedRegionForView.region}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute right-4 flex w-[clamp(17rem,31vw,27.5rem)] items-start overflow-y-auto pr-1 pb-4 sm:right-6 xl:right-screen-margin"
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
              className="dashboard-floating-rail-vertical polaris-dashboard-scroll pointer-events-auto absolute right-4 flex w-[clamp(17rem,31vw,27.5rem)] items-start overflow-y-auto pr-1 pb-4 sm:right-6 xl:right-screen-margin"
            >
              <NationalBaselineCard regions={regions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

