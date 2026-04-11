import type { RegionalScore } from "@/types/polaris"

export function ImpactView({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const snapshots = [
    { label: "Training Uptake", value: selectedRegion.impact_subscore + 4 },
    { label: "NAT Recovery", value: selectedRegion.avg_nat_score },
    { label: "Coverage Momentum", value: selectedRegion.star_coverage_pct },
  ]

  return (
    <div className="space-y-2">
      {snapshots.map((snapshot) => (
        <div key={snapshot.label} className="rounded-md border border-border bg-background p-2">
          <p className="text-sm font-medium text-foreground">{snapshot.label}</p>
          <p className="text-xs text-muted-foreground">Index: {snapshot.value.toFixed(1)}</p>
        </div>
      ))}
    </div>
  )
}
