import type { RegionalScore } from "@/types/polaris"
import { Info } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type SupplyMetric = {
  label: string
  value: number
}

const SUPPLY_SCORE_BADGE = 78

const SUPPLY_METRICS: SupplyMetric[] = [
  { label: "Teacher Density", value: 86 },
  { label: "Specialization", value: 88 },
  { label: "STAR Coverage", value: 92 },
  { label: "Infrastructure", value: 85 },
  { label: "Resources", value: 88 },
]

function polarPoint(
  index: number,
  total: number,
  normalizedRadius: number,
  centerX = 110,
  centerY = 100,
  radius = 66,
) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const scaled = normalizedRadius * radius
  return {
    x: centerX + Math.cos(angle) * scaled,
    y: centerY + Math.sin(angle) * scaled,
  }
}

function polygonPoints(values: number[], centerX = 110, centerY = 100, radius = 66): string {
  const total = values.length
  return values
    .map((value, index) => {
      const point = polarPoint(index, total, Math.max(0, Math.min(100, value)) / 100, centerX, centerY, radius)
      return `${point.x},${point.y}`
    })
    .join(" ")
}

export function SupplyView({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const metricValues = SUPPLY_METRICS.map((metric) => metric.value)
  const centerX = 110
  const centerY = 100
  const radius = 66
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1]
  const regionLabel = selectedRegion.region

  return (
    <div className="space-y-2" aria-label={`Supply details for ${regionLabel}`}>
      <section className="rounded-glass border border-white/20 bg-white/40 p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-content font-semibold text-text-primary">Supply Radar Chart</h3>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="About the supply radar chart"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#4e596d] transition-colors hover:bg-white/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-data-viz-primary)]/60"
              >
                <Info className="size-5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>
                Measures the overall supply of educational resources across the region with 5 key metrics.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#39bfa8] text-lg font-bold text-white">
            {SUPPLY_SCORE_BADGE}
          </div>
        </div>

        <div className="mx-auto w-full rounded-glass p-0">
          <svg viewBox="0 16 220 172" className="mx-auto h-[168px] w-full">
            {ringLevels.map((level) => (
              <polygon
                key={level}
                points={polygonPoints(SUPPLY_METRICS.map(() => level * 100), centerX, centerY, radius)}
                fill="none"
                stroke="rgba(116, 133, 162, 0.32)"
                strokeWidth="1"
              />
            ))}

            {SUPPLY_METRICS.map((metric, index) => {
              const spoke = polarPoint(index, SUPPLY_METRICS.length, 1, centerX, centerY, radius)
              return (
                <line
                  key={`spoke-${metric.label}`}
                  x1={centerX}
                  y1={centerY}
                  x2={spoke.x}
                  y2={spoke.y}
                  stroke="rgba(116, 133, 162, 0.32)"
                  strokeWidth="1"
                />
              )
            })}

            <polygon
              points={polygonPoints(metricValues, centerX, centerY, radius)}
              fill="rgba(72, 153, 220, 0.58)"
              stroke="#3e8cd1"
              strokeWidth="2"
            />

            {SUPPLY_METRICS.map((metric, index) => {
              const point = polarPoint(
                index,
                SUPPLY_METRICS.length,
                metric.value / 100,
                centerX,
                centerY,
                radius,
              )
              return <circle key={`dot-${metric.label}`} cx={point.x} cy={point.y} r="2.8" fill="#2f78be" />
            })}

            {SUPPLY_METRICS.map((metric, index) => {
              const labelPoint = polarPoint(index, SUPPLY_METRICS.length, 1.06, centerX, centerY, radius)
              const anchor =
                labelPoint.x < centerX - 10 ? "end" : labelPoint.x > centerX + 10 ? "start" : "middle"
              return (
                <text
                  key={`label-${metric.label}`}
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="#4e596d"
                >
                  {`${metric.label} ${metric.value}`}
                </text>
              )
            })}
          </svg>
        </div>
      </section>

      <div className="space-y-2">
        {SUPPLY_METRICS.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-full border border-[#c7d8ef] bg-[#c9ddf6] px-3 py-1.5"
          >
            <span className="text-label font-medium text-[#1f3554]">{metric.label}</span>
            <span className="text-content font-semibold text-[#1f3554]">{metric.value}/100</span>
          </div>
        ))}
      </div>
    </div>
  )
}
