import { useMemo } from "react"

import { useRegions } from "@/hooks/useRegions"
import { formatPesoBillions, formatYears } from "@/lib/formatNumber"
import { useDashboardStore } from "@/stores/dashboardStore"
import type { RegionalScore } from "@/types/polaris"

const MAX_SCHOOL_YEARS = 12
const TAX_LOSS_FACTOR = 0.144
const HEADLINE_METRIC_CLASS =
  "text-[24px] font-extrabold tracking-tight leading-tight"

function toFiniteNumber(value: number | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function computeNationalLays(regions: RegionalScore[]): number {
  if (regions.length === 0) return 0

  const weighted = regions.reduce(
    (acc, region) => {
      const lays = toFiniteNumber(region.lays_score)
      const population = Math.max(0, toFiniteNumber(region.student_pop))
      return {
        laysTimesPopulation: acc.laysTimesPopulation + lays * population,
        population: acc.population + population,
      }
    },
    { laysTimesPopulation: 0, population: 0 },
  )

  if (weighted.population > 0) {
    return weighted.laysTimesPopulation / weighted.population
  }

  const laysValues = regions.map((region) => toFiniteNumber(region.lays_score))
  if (laysValues.length === 0) return 0

  return laysValues.reduce((sum, value) => sum + value, 0) / laysValues.length
}

export function EffectOverviewCard() {
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const { data: regions = [], isLoading } = useRegions()

  const cardData = useMemo(() => {
    const selectedRegion = activeRegion
      ? regions.find((region) => region.region === activeRegion) ?? null
      : null

    if (!selectedRegion) {
      const aggregateEconomicLoss = regions.reduce(
        (sum, region) => sum + toFiniteNumber(region.economic_loss),
        0,
      )

      const lays = clamp(computeNationalLays(regions), 0, MAX_SCHOOL_YEARS)
      const learningGap = clamp(MAX_SCHOOL_YEARS - lays, 0, MAX_SCHOOL_YEARS)

      return {
        contextLabel: "NATIONAL AGGREGATE",
        economicLoss: aggregateEconomicLoss,
        taxLoss: aggregateEconomicLoss * TAX_LOSS_FACTOR,
        lays,
        learningGap,
      }
    }

    const economicLoss = toFiniteNumber(selectedRegion.economic_loss)
    const lays = clamp(toFiniteNumber(selectedRegion.lays_score), 0, MAX_SCHOOL_YEARS)
    const learningGap = clamp(MAX_SCHOOL_YEARS - lays, 0, MAX_SCHOOL_YEARS)

    return {
      contextLabel: selectedRegion.region.toUpperCase(),
      economicLoss,
      taxLoss: economicLoss * TAX_LOSS_FACTOR,
      lays,
      learningGap,
    }
  }, [activeRegion, regions])

  const laysProgressPercent = clamp((cardData.lays / MAX_SCHOOL_YEARS) * 100, 0, 100)
  const isDataLoading = isLoading && regions.length === 0

  return (
    <section
      className="w-full rounded-[24px] border border-white/40 bg-white/75 px-[24px] py-[20px] font-sans backdrop-blur-[24px]"
      style={{
        boxShadow:
          "0 10px 25px -5px rgba(26, 94, 168, 0.1), 0 8px 10px -6px rgba(26, 94, 168, 0.1)",
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold tracking-wide" style={{ color: "#1A5EA8" }}>
            {cardData.contextLabel}
          </p>
          {isDataLoading ? (
            <p className="text-sm font-medium text-right" style={{ color: "#1A5EA8" }}>
              Loading impact data...
            </p>
          ) : null}
        </div>

        <div className="space-y-0.5">
          <p className={HEADLINE_METRIC_CLASS} style={{ color: "#E8532A" }}>
            {formatPesoBillions(cardData.economicLoss)}
          </p>
          <p className="text-sm font-medium" style={{ color: "#1B1B1B" }}>
            Annual GDP Opportunity Cost
          </p>
        </div>

        <div className="space-y-0.5">
          <p className={HEADLINE_METRIC_CLASS} style={{ color: "#F5A623" }}>
            {formatPesoBillions(cardData.taxLoss)}
          </p>
          <p className="text-sm font-medium" style={{ color: "#1A5EA8" }}>
            Annual Tax Leak
          </p>
        </div>

        <div>
          <div className="space-y-0.5">
            <p className={HEADLINE_METRIC_CLASS} style={{ color: "#1B1B1B" }}>
              {formatYears(cardData.learningGap)} Lost
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium" style={{ color: "#1A5EA8" }}>
                Learning Gap
              </p>
              <p className="text-sm font-medium" style={{ color: "#1A5EA8" }}>
                LAYS {cardData.lays.toFixed(2)} / {MAX_SCHOOL_YEARS}
              </p>
            </div>
          </div>
          <div className="mt-1 h-4 w-full overflow-hidden rounded-full border border-white/50 bg-[#1A5EA8]/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${laysProgressPercent}%`,
                backgroundColor: "#3B9BDD",
              }}
            />
          </div>

        </div>
      </div>
    </section>
  )
}



