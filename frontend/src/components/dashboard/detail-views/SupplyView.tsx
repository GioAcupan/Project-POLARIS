import type { RegionalScore } from "@/types/polaris"

export function SupplyView({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const supplySignals = [
    { label: "Teacher Load Capacity", value: selectedRegion.teacher_student_ratio, unit: "" },
    { label: "Specialization Alignment", value: selectedRegion.specialization_pct, unit: "%" },
    { label: "Supply Subscore", value: selectedRegion.supply_subscore, unit: "" },
  ]

  return (
    <div className="space-y-2">
      {supplySignals.map((signal) => (
        <div key={signal.label} className="rounded-glass border border-white/20 bg-white/40 p-2">
          <p className="text-content font-medium text-text-primary">{signal.label}</p>
          <p className="text-label text-text-secondary">
            Value: {signal.value.toFixed(1)}
            {signal.unit}
          </p>
        </div>
      ))}
    </div>
  )
}
