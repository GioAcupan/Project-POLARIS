import type { RegionHealth } from "@/types/polaris"

export function SummaryView({ regionHealth }: { regionHealth: RegionHealth }) {
  const factors = Object.entries(regionHealth.factors)

  return (
    <div className="space-y-2">
      {factors.map(([name, value]) => (
        <div key={name} className="rounded-glass border border-border bg-card p-2 text-content">
          <span className="font-medium text-text-primary">{name.replaceAll("_", " ")}: </span>
          <span className="text-text-secondary">{Number(value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}
