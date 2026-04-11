import type { RegionHealth } from "@/types/polaris"

export function SummaryView({ regionHealth }: { regionHealth: RegionHealth }) {
  const factors = Object.entries(regionHealth.factors)

  return (
    <div className="space-y-2">
      {factors.map(([name, value]) => (
        <div key={name} className="rounded-md border border-border bg-background p-2 text-sm">
          <span className="font-medium text-foreground">{name.replaceAll("_", " ")}: </span>
          <span className="text-muted-foreground">{Number(value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}
