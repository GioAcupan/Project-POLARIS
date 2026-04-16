import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import L from "leaflet"
import type { Feature, FeatureCollection } from "geojson"
import { Minus, Plus } from "lucide-react"
import { GeoJSON, MapContainer, useMap, useMapEvents } from "react-leaflet"

import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

type LatLngTuple = [number, number]
type RegionFeatureProperties = {
  region: string
  adm1_psgc: number
  source_file: string
}

/**
 * Default view center. Shifted east so the archipelago sits between dashboard rails on wide screens.
 * Runtime logs showed the previous value was being clamped west by east maxBounds at startup.
 */
const PH_MAP_CENTER: LatLngTuple = [12.8797, 124.0]
/** Nationwide framing for a standard dashboard viewport. */
const PH_INITIAL_ZOOM = 5.8
/** Prevents zooming out into empty ocean/grey around the map. */
const PH_MIN_ZOOM = 5.5
/**
 * Pan limits: same north/south as before, with extra horizontal room.
 * East bound widened so startup center can remain east-shifted instead of being auto-clamped.
 */
const PH_MAX_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [4.5, 111.5],
  [21.5, 135.0],
]
/** Allows fractional zoom levels (e.g. 5.8) alongside Leaflet defaults. */
const PH_ZOOM_SNAP = 0.1

type GeoLayerWithFeature = L.Layer & { feature?: Feature; bringToFront?: () => void }
type BoundsLayer = L.Layer & { getBounds: () => L.LatLngBounds }

function isBoundsLayer(layer: L.Layer | null): layer is BoundsLayer {
  return Boolean(layer && "getBounds" in layer && typeof (layer as BoundsLayer).getBounds === "function")
}

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
  triggerResetToNational,
}: {
  geoLayerRef: { current: L.GeoJSON | null }
  activeRegion: string | null
  triggerFlyTo: boolean
  triggerResetToNational: boolean
}) {
  const map = useMap()
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
    if (!layer) return

    layer.eachLayer((geoLayer: L.Layer) => {
      const g = geoLayer as GeoLayerWithFeature
      const featureRegion = g.feature?.properties?.region as string | undefined
      const isActive = activeRegion != null && featureRegion === activeRegion
      if ("setStyle" in g && typeof g.setStyle === "function") {
        ;(g as L.Path).setStyle({
          color: isActive ? "var(--color-text-primary)" : "var(--polaris-map-region-border)",
          weight: isActive ? 2.8 : 1.2,
        })
      }
      if (isActive && g.bringToFront) g.bringToFront()
    })
  }, [activeRegion, geoLayerRef])

  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer || !triggerFlyTo || !activeRegion) return

    const selectedLayer =
      layer.getLayers().find((geoLayer: L.Layer) => {
        const g = geoLayer as GeoLayerWithFeature
        const featureRegion = g.feature?.properties?.region as string | undefined
        return featureRegion === activeRegion
      }) ?? null

    if (isBoundsLayer(selectedLayer)) {
      map.flyToBounds(selectedLayer.getBounds(), {
        duration: 0.8,
        easeLinearity: 0.5,
        padding: [mapPadding, mapPadding],
      })
    }
    dashboardStore.setTriggerFlyTo(false)
  }, [activeRegion, geoLayerRef, map, mapPadding, triggerFlyTo])

  useEffect(() => {
    if (!triggerResetToNational) return

    map.flyTo(PH_MAP_CENTER, PH_INITIAL_ZOOM, {
      duration: 0.9,
      easeLinearity: 0.45,
      animate: true,
    })
    dashboardStore.setTriggerResetToNational(false)
  }, [map, triggerResetToNational])

  return null
}

function MapBackgroundResetController() {
  useMapEvents({
    click: () => {
      const { activeRegion, triggerResetToNational } = dashboardStore.getState()
      if (!activeRegion) return

      dashboardStore.setActiveRegion(null)
      dashboardStore.setTriggerResetToNational(!triggerResetToNational)
    },
  })

  return null
}

function MapHudZoomControls() {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const [minZoom, setMinZoom] = useState(() => map.getMinZoom())
  const [maxZoom, setMaxZoom] = useState(() => map.getMaxZoom())

  useEffect(() => {
    const syncZoomState = () => {
      setZoom(map.getZoom())
      setMinZoom(map.getMinZoom())
      setMaxZoom(map.getMaxZoom())
    }

    syncZoomState()
    map.on("zoomend", syncZoomState)
    map.on("zoomlevelschange", syncZoomState)

    return () => {
      map.off("zoomend", syncZoomState)
      map.off("zoomlevelschange", syncZoomState)
    }
  }, [map])

  const isAtMinZoom = zoom <= minZoom + 0.001
  const isAtMaxZoom = zoom >= maxZoom - 0.001

  const blockMapInteractions = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleZoomIn = (event: ReactMouseEvent<HTMLButtonElement>) => {
    blockMapInteractions(event)
    if (!isAtMaxZoom) map.zoomIn()
  }

  const handleZoomOut = (event: ReactMouseEvent<HTMLButtonElement>) => {
    blockMapInteractions(event)
    if (!isAtMinZoom) map.zoomOut()
  }

  return (
    <div
      className="pointer-events-auto absolute z-[12] overflow-hidden rounded-xl border border-white/20 bg-white/40 shadow-[0_12px_28px_-14px_rgba(79,70,229,0.35)] backdrop-blur-[24px]"
      style={{
        top: "var(--polaris-map-zoom-top, 96px)",
        left: "calc(var(--ds-spacing-screen-margin) + 20rem + 1rem)",
      }}
      onClick={blockMapInteractions}
      onDoubleClick={blockMapInteractions}
      onMouseDown={blockMapInteractions}
    >
      <div className="flex flex-col">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center bg-transparent text-text-primary transition-all duration-200 ease-in-out hover:bg-white/60 hover:shadow-[0_0_16px_rgba(79,70,229,0.2)] focus-visible:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-text-primary/45 disabled:shadow-none"
          aria-label="Zoom in map"
          onClick={handleZoomIn}
          disabled={isAtMaxZoom}
        >
          <Plus className="h-4 w-4 stroke-[2.4]" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center border-t border-white/20 bg-transparent text-text-primary transition-all duration-200 ease-in-out hover:bg-white/60 hover:shadow-[0_0_16px_rgba(79,70,229,0.2)] focus-visible:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-text-primary/45 disabled:shadow-none"
          aria-label="Zoom out map"
          onClick={handleZoomOut}
          disabled={isAtMinZoom}
        >
          <Minus className="h-4 w-4 stroke-[2.4]" />
        </button>
      </div>
    </div>
  )
}

function regionNameFromFeature(feature: Feature | undefined): string | undefined {
  const props = feature?.properties
  if (!props || typeof props !== "object" || !("region" in props)) return undefined
  const r = (props as RegionFeatureProperties).region
  return typeof r === "string" ? r : undefined
}

export function MapCanvas({ regions }: { regions: RegionalScore[] }) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)
  const activeLens = useDashboardStore((snapshot) => snapshot.activeLens)
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const triggerFlyTo = useDashboardStore((snapshot) => snapshot.triggerFlyTo)
  const triggerResetToNational = useDashboardStore((snapshot) => snapshot.triggerResetToNational)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
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
      .then((json: unknown) => {
        if (cancelled) return
        if (json && typeof json === "object" && "type" in json && json.type === "FeatureCollection") {
          setGeoData(json as FeatureCollection)
        }
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
    <section className="absolute inset-0 z-0 overflow-hidden bg-transparent">
      <MapContainer
        center={PH_MAP_CENTER}
        zoom={PH_INITIAL_ZOOM}
        minZoom={PH_MIN_ZOOM}
        maxBounds={PH_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomSnap={PH_ZOOM_SNAP}
        doubleClickZoom={false}
        scrollWheelZoom
        wheelPxPerZoomLevel={120}
        className="polaris-map-root h-full w-full"
        attributionControl={false}
        zoomControl={false}
      >
        <MapBackgroundResetController />
        {geoData ? (
          <GeoJSON
            ref={geoLayerRef}
            data={geoData}
            style={(feature) => {
              const regionName = regionNameFromFeature(feature ?? undefined)
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
            onEachFeature={(feature, layer) => {
              const pathLayer = layer as L.Path
              const regionName = regionNameFromFeature(feature)
              pathLayer.on("mouseover", () => {
                pathLayer.setStyle({
                  color: "var(--color-text-secondary)",
                  weight: 2,
                })
                pathLayer.bringToFront()
              })
              pathLayer.on("mouseout", () => {
                const isActive = activeRegion != null && regionName === activeRegion
                pathLayer.setStyle({
                  color: isActive ? "var(--color-text-primary)" : "var(--polaris-map-region-border)",
                  weight: isActive ? 2.8 : 1.2,
                })
              })
              pathLayer.on("click", (event: L.LeafletMouseEvent) => {
                if (!regionName) return
                L.DomEvent.stopPropagation(event)
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
          triggerResetToNational={triggerResetToNational}
        />
        <MapHudZoomControls />
      </MapContainer>
    </section>
  )
}
