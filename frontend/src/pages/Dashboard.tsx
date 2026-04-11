import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { CriticalPingsFeed } from "@/components/dashboard/CriticalPingsFeed"
import { LensSelector } from "@/components/dashboard/LensSelector"
import { MapCanvas } from "@/components/dashboard/MapCanvas"
import { NationalBaselineCard } from "@/components/dashboard/NationalBaselineCard"
import { PPSTRadarCard } from "@/components/dashboard/PPSTRadarCard"
import { RegionalHealthCard } from "@/components/dashboard/RegionalHealthCard"
import { useNationalRadar } from "@/hooks/useNationalRadar"
import { useRegions } from "@/hooks/useRegions"
import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"

export default function Dashboard() {
  const { data: regions = [] } = useRegions()
  const { data: nationalRadar = null } = useNationalRadar()
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const selectedRegion = regions.find((region) => region.region === activeRegion) ?? null

  useEffect(() => {
    dashboardStore.setRegions(regions)
  }, [regions])

  useEffect(() => {
    dashboardStore.setNationalRadar(nationalRadar)
  }, [nationalRadar])

  return (
    <div className="relative h-full min-h-screen w-full animate-in fade-in duration-300">
      <MapCanvas regions={regions} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <header className="pointer-events-auto absolute inset-x-screen-margin top-screen-margin flex items-center justify-between gap-card-gap">
          <h1 className="font-heading text-display-dashboard font-extrabold text-text-primary">
            DASHBOARD
          </h1>
          <LensSelector />
        </header>

        <div className="dashboard-floating-rail-vertical pointer-events-auto absolute left-screen-margin flex w-80 min-h-0 flex-col gap-card-gap">
          <div className="flex min-h-0 flex-[2] flex-col overflow-hidden">
            <PPSTRadarCard radar={nationalRadar} />
          </div>
          <section className="flex min-h-0 flex-[3] flex-col rounded-glass p-4 polaris-glass-card">
            <h2 className="font-heading text-section-title font-extrabold text-text-primary">AI Reports</h2>
            <div className="mt-element-stack min-h-0 flex-1 overflow-y-auto pr-1">
              <CriticalPingsFeed regions={regions} />
            </div>
          </section>
        </div>

        <AnimatePresence mode="wait">
          {selectedRegion ? (
            <motion.div
              key={`regional-${selectedRegion.region}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="dashboard-floating-rail-vertical pointer-events-auto absolute right-screen-margin flex h-full min-h-0 w-96 flex-col"
            >
              <RegionalHealthCard selectedRegion={selectedRegion} />
            </motion.div>
          ) : (
            <motion.div
              key="national-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="dashboard-floating-rail-vertical pointer-events-auto absolute right-screen-margin flex h-full min-h-0 w-96 flex-col"
            >
              <NationalBaselineCard regions={regions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
