import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PPSTRadar } from "@/types/polaris"

const AXIS_KEYS: (keyof NonNullable<PPSTRadar["current"]>)[] = [
  "content_knowledge",
  "learning_environment",
  "diversity_of_learners",
  "curriculum_planning",
  "assessment_reporting",
]

function polygonPoints(values: number[], center = 110, radius = 78): string {
  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2
      const scaled = (Math.max(0, Math.min(100, value)) / 100) * radius
      const x = center + Math.cos(angle) * scaled
      const y = center + Math.sin(angle) * scaled
      return `${x},${y}`
    })
    .join(" ")
}

function axisGrid(center = 110, radius = 78): string[] {
  return AXIS_KEYS.map((_, index) => {
    const angle = (Math.PI * 2 * index) / AXIS_KEYS.length - Math.PI / 2
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    return `${center},${center} ${x},${y}`
  })
}

export function PPSTRadarCard({ radar }: { radar: PPSTRadar | null }) {
  const current = radar?.current
  const target = radar?.target
  const currentPoints = polygonPoints(AXIS_KEYS.map((key) => current?.[key] ?? 0))
  const targetPoints = target ? polygonPoints(AXIS_KEYS.map((key) => target[key] ?? 0)) : null

  return (
    <section className="flex h-full max-h-full w-full flex-col overflow-hidden rounded-glass p-6 polaris-glass-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-section-title font-extrabold text-text-primary">
          PPST Radar Graph
        </h2>
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label="About the PPST Radar Graph"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-data-viz-primary)]/60"
          >
            <Info className="size-5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>
            Shows the national average of teachers measured in PPST mapped metrics.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 min-h-0 flex-1 rounded-glass border border-white/20 bg-white/40 p-3">
        <svg viewBox="0 0 220 220" className="mx-auto h-full w-full max-h-full max-w-64 aspect-square">
          <polygon
            points={polygonPoints([100, 100, 100, 100, 100])}
            fill="none"
            stroke="var(--polaris-chart-axis)"
          />
          {axisGrid().map((line) => (
            <polyline
              key={line}
              points={line}
              fill="none"
              stroke="var(--polaris-chart-axis)"
              strokeWidth="1"
            />
          ))}
          {targetPoints ? (
            <polygon
              points={targetPoints}
              fill="var(--color-signal-warning)"
              fillOpacity={0.2}
              stroke="var(--color-signal-warning)"
              strokeWidth="2"
            />
          ) : null}
          <polygon
            points={currentPoints}
            fill="var(--color-data-viz-primary)"
            fillOpacity={0.2}
            stroke="var(--color-data-viz-primary)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </section>
  )
}
