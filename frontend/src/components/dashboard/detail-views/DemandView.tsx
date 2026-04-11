import type { RegionalScore } from "@/types/polaris"

export function DemandView({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const topics = [
    { topic: "Assessment Literacy Interventions", count: selectedRegion.demand_signal_count + 8 },
    { topic: "Differentiated Instruction", count: selectedRegion.demand_signal_count + 4 },
    { topic: "Curriculum Planning", count: selectedRegion.demand_signal_count + 1 },
  ]

  return (
    <div className="space-y-2">
      {topics.map((topic) => (
        <div key={topic.topic} className="rounded-md border border-border bg-background p-2">
          <p className="text-sm font-medium text-foreground">{topic.topic}</p>
          <p className="text-xs text-muted-foreground">Signals: {topic.count}</p>
        </div>
      ))}
    </div>
  )
}
