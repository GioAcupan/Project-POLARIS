import { useEffect, useMemo } from "react"

import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet"

import { LensSelector } from "@/components/dashboard/LensSelector"
import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

type LatLngTuple = [number, number]

const defaultCenter: LatLngTuple = [12.5, 122.5]
const UnsafeMapContainer: any = MapContainer
const UnsafeTileLayer: any = TileLayer

const knownCentroids: Record<string, LatLngTuple> = {
  "Region I": [16.2, 120.4],
  "Region II": [16.8, 121.8],
  "Region III": [15.3, 120.8],
  "Region IV-A": [14.2, 121.2],
  "Region IV-B": [12.8, 121.1],
  "Region V": [13.6, 123.2],
  "Region VI": [10.7, 122.5],
  "Region VII": [10.1, 123.8],
  "Region VIII": [11.2, 125.0],
  "Region IX": [7.9, 123.0],
  "Region X": [8.5, 124.7],
  "Region XI": [7.2, 125.8],
  "Region XII": [6.9, 124.3],
  "Region XIII": [8.9, 125.9],
  BARMM: [7.1, 124.2],
  NCR: [14.6, 121.0],
  CAR: [16.5, 120.9],
}
const canonicalRegions = Object.keys(knownCentroids)

function scoreForLens(region: RegionalScore, lens: "overall" | "supply" | "demand" | "impact"): number {
  if (lens === "supply") return region.supply_subscore
  if (lens === "demand") return region.demand_subscore
  if (lens === "impact") return region.impact_subscore
  return region.underserved_score
}

function fillForScore(score: number, lens: "overall" | "supply" | "demand" | "impact"): string {
  const normalized = Math.max(0, Math.min(100, score))
  if (lens === "demand") {
    if (normalized >= 66) return "#dc2626"
    if (normalized >= 40) return "#f97316"
    return "#16a34a"
  }
  if (normalized >= 66) return "#0d9488"
  if (normalized >= 40) return "#14b8a6"
  return "#5eead4"
}

function polygonForCenter([lat, lng]: LatLngTuple): LatLngTuple[] {
  const delta = 0.7
  return [
    [lat + delta, lng - delta],
    [lat + delta, lng + delta],
    [lat - delta, lng + delta],
    [lat - delta, lng - delta],
  ]
}

function FlyToOnSelection({
  regions,
}: {
  regions: RegionalScore[]
}) {
  const map = useMap()
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const triggerFlyTo = useDashboardStore((snapshot) => snapshot.triggerFlyTo)

  useEffect(() => {
    if (!triggerFlyTo || !activeRegion) return
    const selected = regions.find((region) => region.region === activeRegion)
    if (!selected) return
    const center = knownCentroids[selected.region] ?? defaultCenter
    map.flyTo(center, 6.6, { duration: 0.8, easeLinearity: 0.5 })
    dashboardStore.setTriggerFlyTo(false)
  }, [activeRegion, map, regions, triggerFlyTo])

  return null
}

export function MapCanvas({ regions }: { regions: RegionalScore[] }) {
  const activeLens = useDashboardStore((snapshot) => snapshot.activeLens)
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const regionByName = useMemo(
    () => new Map(regions.map((region) => [region.region, region])),
    [regions],
  )

  return (
    <section className="rounded-xl border border-border bg-card p-4 lg:col-span-6">
      <LensSelector />
      <p
        className={`mb-2 text-xs font-semibold ${
          activeLens === "demand" ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        {activeLens === "demand" ? "Red = High Unmet Demand" : "Color scale updates per active lens"}
      </p>
      <div className="h-[420px] overflow-hidden rounded-lg border border-border">
        <UnsafeMapContainer center={defaultCenter} zoom={5.5} className="h-full w-full" scrollWheelZoom>
          <UnsafeTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {canonicalRegions.map((regionName) => {
            const region = regionByName.get(regionName) ?? null
            const centroid = knownCentroids[regionName] ?? defaultCenter
            const score = region ? scoreForLens(region, activeLens) : 50
            return (
              <Polygon
                key={regionName}
                positions={polygonForCenter(centroid)}
                pathOptions={{
                  fillColor: fillForScore(score, activeLens),
                  fillOpacity: 0.65,
                  color: activeRegion === regionName ? "#0f172a" : "#334155",
                  weight: activeRegion === regionName ? 2.5 : 1.2,
                }}
                eventHandlers={{
                  click: () => dashboardStore.setActiveRegion(regionName),
                }}
              />
            )
          })}
          <FlyToOnSelection regions={regions} />
        </UnsafeMapContainer>
      </div>
    </section>
  )
}
