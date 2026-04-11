import { dashboardStore } from "@/stores/dashboardStore"
import type { CriticalPing, RegionalScore } from "@/types/polaris"

type PingWithScore = CriticalPing & { score: number }

const severityRank: Record<CriticalPing["severity"], number> = {
  CRITICAL: 0,
  WARNING: 1,
  GAP: 2,
}

function collectPings(regions: RegionalScore[]): PingWithScore[] {
  const collected: PingWithScore[] = regions.flatMap((region) =>
    (region.critical_pings ?? []).map((ping) => ({
      ...ping,
      score: region.underserved_score,
    })),
  )

  if (collected.length >= 3) {
    return collected
      .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.score - a.score)
      .slice(0, 6)
  }

  const fill = regions
    .slice()
    .sort((a, b) => b.underserved_score - a.underserved_score)
    .map<PingWithScore>((region) => ({
      region: region.region,
      severity: "GAP",
      message: `Skill-gap pressure remains elevated in ${region.region}.`,
      score: region.underserved_score,
    }))

  return [...collected, ...fill]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.score - a.score)
    .slice(0, 6)
}

export function CriticalPingsFeed({ regions }: { regions: RegionalScore[] }) {
  const pings = collectPings(regions)

  return (
    <div className="space-y-2">
      {pings.map((ping) => (
        <button
          key={`${ping.region}-${ping.severity}-${ping.message}`}
          type="button"
          onClick={() => {
            dashboardStore.setActiveRegion(ping.region)
            dashboardStore.setTriggerFlyTo(!dashboardStore.getState().triggerFlyTo)
          }}
          className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-muted-foreground">{ping.severity}</span>
            <span className="text-xs font-semibold text-foreground">Score: {Math.round(ping.score)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{ping.region}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ping.message}</p>
        </button>
      ))}
    </div>
  )
}
