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

        <div className="pointer-events-auto absolute bottom-5 left-5 top-28 flex w-80 flex-col gap-4">
          <PPSTRadarCard radar={nationalRadar} />
          <section className="flex-1 rounded-glass p-4 polaris-glass-card">
            <h2 className="font-heading text-section-title font-extrabold text-text-primary">AI Reports</h2>
            <div className="mt-3 h-full overflow-auto pr-1">
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
              className="pointer-events-auto absolute right-5 top-28 w-96"
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
              className="pointer-events-auto absolute right-5 top-28 w-96"
            >
              <NationalBaselineCard regions={regions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
