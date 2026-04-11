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
        <div key={topic.topic} className="rounded-glass border border-border bg-card p-2">
          <p className="text-content font-medium text-text-primary">{topic.topic}</p>
          <p className="text-label text-text-secondary">Signals: {topic.count}</p>
        </div>
      ))}
    </div>
  )
}
