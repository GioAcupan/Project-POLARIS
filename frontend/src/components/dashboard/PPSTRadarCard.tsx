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
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-glass p-4 polaris-glass-card">
      <h2 className="font-heading text-section-title font-extrabold text-text-primary">PPST Radar Graph</h2>
      <p className="mt-1 text-content font-medium text-text-secondary">
        Shows the national average of teachers measured in PPST mapped metrics.
      </p>
      <div className="mt-element-stack min-h-0 flex-1 overflow-hidden rounded-glass bg-card/70 p-3">
        <svg viewBox="0 0 220 220" className="mx-auto h-52 max-h-full w-full max-w-64">
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
