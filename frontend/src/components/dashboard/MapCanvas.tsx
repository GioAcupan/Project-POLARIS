import { useEffect, useMemo, useRef, useState } from "react"
import { GeoJSON, MapContainer, ZoomControl, useMap } from "react-leaflet"

import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

type LatLngTuple = [number, number]
type RegionFeatureProperties = {
  region: string
  adm1_psgc: number
  source_file: string
}

const defaultCenter: LatLngTuple = [12.5, 122.5]
const UnsafeMapContainer: any = MapContainer
const UnsafeGeoJSON: any = GeoJSON

function scoreForLens(region: RegionalScore, lens: "overall" | "supply" | "demand" | "impact"): number {
  if (lens === "supply") return region.supply_subscore
  if (lens === "demand") return region.demand_subscore
  if (lens === "impact") return region.impact_subscore
  return region.underserved_score
}

function fillForScore(score: number): string {
  const normalized = Math.max(0, Math.min(100, score))
  if (normalized >= 66) return "var(--color-signal-critical)"
  if (normalized >= 40) return "var(--color-signal-warning)"
  return "var(--color-signal-good)"
}

function MapViewportController({
  geoLayerRef,
  activeRegion,
  triggerFlyTo,
}: {
  geoLayerRef: { current: any }
  activeRegion: string | null
  triggerFlyTo: boolean
}) {
  const map = useMap()
  const initializedBounds = useRef(false)
  const mapPadding = useMemo(() => {
    if (typeof window === "undefined") return 16
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--ds-spacing-element-stack")
      .trim()
    const parsed = Number.parseFloat(raw.replace("px", ""))
    return Number.isFinite(parsed) ? parsed : 16
  }, [])

  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer || initializedBounds.current) return

    const bounds = layer.getBounds()
    if (!bounds.isValid()) return
    map.fitBounds(bounds)
    map.setMaxBounds(bounds)
    map.setMaxBoundsViscosity(1)
    map.setMinZoom(map.getZoom())
    initializedBounds.current = true
  }, [geoLayerRef, map])

  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer) return

    layer.eachLayer((geoLayer: any) => {
      const featureRegion = geoLayer.feature?.properties?.region as string | undefined
      const isActive = activeRegion != null && featureRegion === activeRegion
      geoLayer.setStyle({
        color: isActive ? "var(--color-text-primary)" : "var(--polaris-map-region-border)",
        weight: isActive ? 2.8 : 1.2,
      })
      if (isActive && geoLayer.bringToFront) geoLayer.bringToFront()
    })
  }, [activeRegion, geoLayerRef])

  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer || !triggerFlyTo || !activeRegion) return

    let selectedLayer: any = null
    layer.eachLayer((geoLayer: any) => {
      const featureRegion = geoLayer.feature?.properties?.region as string | undefined
      if (featureRegion === activeRegion) selectedLayer = geoLayer
    })

    if (selectedLayer) {
      map.flyToBounds(selectedLayer.getBounds(), {
        duration: 0.8,
        easeLinearity: 0.5,
        padding: [mapPadding, mapPadding],
      })
    }
    dashboardStore.setTriggerFlyTo(false)
  }, [activeRegion, geoLayerRef, map, mapPadding, triggerFlyTo])

  return null
}

export function MapCanvas({ regions }: { regions: RegionalScore[] }) {
  const [geoData, setGeoData] = useState<any>(null)
  const activeLens = useDashboardStore((snapshot) => snapshot.activeLens)
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const triggerFlyTo = useDashboardStore((snapshot) => snapshot.triggerFlyTo)
  const geoLayerRef = useRef<any>(null)
  const mapFillOpacity = useMemo(() => {
    if (typeof window === "undefined") return 0.85
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--ds-component-map-fill-opacity")
      .trim()
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 0.85
  }, [])
  const regionByName = useMemo(() => new Map(regions.map((region) => [region.region, region])), [regions])

  useEffect(() => {
    let cancelled = false
    void fetch("/ph-regions.geojson")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load ph-regions.geojson")
        return response.json()
      })
      .then((json) => {
        if (cancelled) return
        setGeoData(json)
      })
      .catch((error) => {
        console.error("[MapCanvas] Unable to load PH regions GeoJSON", error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!geoData || !("features" in geoData)) return
    const geoRegions = new Set(
      (geoData.features as Array<{ properties?: Partial<RegionFeatureProperties> }>)
        .map((feature) => feature.properties?.region)
        .filter((name): name is string => Boolean(name)),
    )
    const backendRegions = new Set(regions.map((region) => region.region))
    const unmatchedGeo = [...geoRegions].filter((name) => !backendRegions.has(name))
    const unmatchedBackend = [...backendRegions].filter((name) => !geoRegions.has(name))
    if (unmatchedGeo.length || unmatchedBackend.length) {
      console.warn("[MapCanvas] Region join mismatch", {
        unmatchedGeo,
        unmatchedBackend,
      })
    }
  }, [geoData, regions])

  return (
    <section className="absolute inset-0 z-0 overflow-hidden rounded-glass bg-dataViz-highlight">
      <UnsafeMapContainer
        center={defaultCenter}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl={false}
        zoomControl={false}
      >
        {geoData ? (
          <UnsafeGeoJSON
            ref={geoLayerRef}
            data={geoData}
            style={(feature: any) => {
              const regionName = feature?.properties?.region as string | undefined
              const regionData = regionName ? regionByName.get(regionName) : null
              const score = regionData ? scoreForLens(regionData, activeLens) : 50
              return {
                fillColor: fillForScore(score),
                fillOpacity: mapFillOpacity,
                color:
                  activeRegion && regionName === activeRegion
                    ? "var(--color-text-primary)"
                    : "var(--polaris-map-region-border)",
                weight: activeRegion && regionName === activeRegion ? 2.8 : 1.2,
              }
            }}
            onEachFeature={(feature: any, layer: any) => {
              const regionName = feature?.properties?.region as string | undefined
              layer.on("mouseover", () => {
                layer.setStyle({
                  color: "var(--color-text-secondary)",
                  weight: 2,
                })
                if (layer.bringToFront) layer.bringToFront()
              })
              layer.on("mouseout", () => {
                const isActive = activeRegion != null && regionName === activeRegion
                layer.setStyle({
                  color: isActive ? "var(--color-text-primary)" : "var(--polaris-map-region-border)",
                  weight: isActive ? 2.8 : 1.2,
                })
              })
              layer.on("click", () => {
                if (!regionName) return
                dashboardStore.setActiveRegion(regionName)
                dashboardStore.setTriggerFlyTo(!dashboardStore.getState().triggerFlyTo)
              })
            }}
          />
        ) : null}
        <MapViewportController
          geoLayerRef={geoLayerRef}
          activeRegion={activeRegion}
          triggerFlyTo={triggerFlyTo}
        />
        <ZoomControl position="bottomleft" />
      </UnsafeMapContainer>
      <p className="pointer-events-none absolute bottom-4 right-4 rounded-glass border border-border bg-card px-3 py-2 text-label font-medium text-text-secondary">
        Boundaries: faeldon/philippines-json-maps (2023)
      </p>
    </section>
  )
}
