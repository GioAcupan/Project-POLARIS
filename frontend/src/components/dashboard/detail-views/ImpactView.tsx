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
        <div key={snapshot.label} className="rounded-glass border border-white/20 bg-white/40 p-2">
          <p className="text-content font-medium text-text-primary">{snapshot.label}</p>
          <p className="text-label text-text-secondary">Index: {snapshot.value.toFixed(1)}</p>
        </div>
      ))}
    </div>
  )
}
