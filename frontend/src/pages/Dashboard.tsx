import { useEffect } from "react"

import { IntelligenceColumn } from "@/components/dashboard/IntelligenceColumn"
import { useNationalRadar } from "@/hooks/useNationalRadar"
import { useRegions } from "@/hooks/useRegions"
import { dashboardStore } from "@/stores/dashboardStore"

export default function Dashboard() {
  const { data: regions = [] } = useRegions()
  const { data: nationalRadar = null } = useNationalRadar()

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

        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-6">
          <h2 className="text-sm font-semibold text-foreground">Map Panel</h2>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Detail Panel</h2>
        </section>
      </div>
    </div>
  )
}
