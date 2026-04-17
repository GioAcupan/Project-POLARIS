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

const AXIS_LABELS: Record<(typeof AXIS_KEYS)[number], string> = {
  content_knowledge: "Content Knowledge",
  learning_environment: "Learning Environment",
  diversity_of_learners: "Diversity of Learners",
  curriculum_planning: "Curriculum & Planning",
  assessment_reporting: "Assessment & Reporting",
}

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

function axisLabelPoint(index: number, total: number, center = 110, radius = 92): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

function splitLabel(label: string): [string, string?] {
  if (label.length <= 18) return [label]
  const words = label.split(" ")
  if (words.length < 2) return [label]
  const midpoint = Math.ceil(words.length / 2)
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")]
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
      <div className="mt-2 min-h-0 flex-1 p-3">
        <svg viewBox="-18 -18 256 256" className="mx-auto h-full w-full max-h-full max-w-64 aspect-square overflow-visible">
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
          {AXIS_KEYS.map((key, index) => {
            const point = axisLabelPoint(index, AXIS_KEYS.length)
            const anchor = point.x < 100 ? "end" : point.x > 120 ? "start" : "middle"
            const [firstLine, secondLine] = splitLabel(AXIS_LABELS[key])
            return (
              <text
                key={`label-${key}`}
                x={point.x}
                y={point.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="#2d3f5b"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="2.2"
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                <tspan x={point.x} dy={0}>
                  {firstLine}
                </tspan>
                {secondLine ? (
                  <tspan x={point.x} dy="11.5">
                    {secondLine}
                  </tspan>
                ) : null}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
