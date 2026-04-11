import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { IntelligenceColumn } from "@/components/dashboard/IntelligenceColumn"
import { MapCanvas } from "@/components/dashboard/MapCanvas"
import { NationalBaselineCard } from "@/components/dashboard/NationalBaselineCard"
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
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <IntelligenceColumn regions={regions} radar={nationalRadar} />

        <MapCanvas regions={regions} />

        <AnimatePresence mode="wait">
          {selectedRegion ? (
            <motion.div
              key={`regional-${selectedRegion.region}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="lg:col-span-3"
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
              className="lg:col-span-3"
            >
              <NationalBaselineCard regions={regions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
