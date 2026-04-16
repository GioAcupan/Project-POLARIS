import { CriticalPingsFeed } from "@/components/dashboard/CriticalPingsFeed"
import type { PPSTRadar, RegionalScore } from "@/types/polaris"

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

export function IntelligenceColumn({
  regions,
  radar,
}: {
  regions: RegionalScore[]
  radar: PPSTRadar | null
}) {
  const current = radar?.current
  const target = radar?.target

  if (radar && !target) {
    console.warn("[Dashboard] national-skill-radar payload missing target polygon.")
  }

  const currentPoints = polygonPoints(AXIS_KEYS.map((key) => current?.[key] ?? 0))
  const targetPoints = target ? polygonPoints(AXIS_KEYS.map((key) => target[key] ?? 0)) : null

  return (
    <section className="rounded-xl border border-white/20 bg-white/40 p-4 lg:col-span-3">
      <h2 className="text-sm font-semibold text-foreground">National Skill Radar</h2>
      <div className="mt-3 rounded-lg border border-white/20 bg-white/40 p-3">
        <svg viewBox="0 0 220 220" className="mx-auto h-52 w-full max-w-[220px]">
          <polygon points={polygonPoints([100, 100, 100, 100, 100])} fill="none" stroke="var(--polaris-chart-axis)" />
          {axisGrid().map((line) => (
            <polyline key={line} points={line} fill="none" stroke="var(--polaris-chart-axis)" strokeWidth="1" />
          ))}
          {targetPoints ? (
            <polygon
              points={targetPoints}
              fill="rgba(234, 179, 8, 0.18)"
              stroke="rgb(202, 138, 4)"
              strokeWidth="2"
            />
          ) : null}
          <polygon
            points={currentPoints}
            fill="rgba(20, 184, 166, 0.18)"
            stroke="rgb(13, 148, 136)"
            strokeWidth="2"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Critical Pings
      </h3>
      <div className="mt-2">
        <CriticalPingsFeed regions={regions} />
      </div>
    </section>
  )
}
