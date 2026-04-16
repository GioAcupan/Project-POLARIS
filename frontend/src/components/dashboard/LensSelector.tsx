import { dashboardStore, useDashboardStore } from "@/stores/dashboardStore"

const lenses = [
  { id: "overall", label: "Overall" },
  { id: "supply", label: "Supply" },
  { id: "demand", label: "Demand" },
  { id: "impact", label: "Impact" },
] as const

export function LensSelector() {
  const activeLens = useDashboardStore((snapshot) => snapshot.activeLens)

  return (
    <div className="polaris-glass-surface pointer-events-auto inline-flex items-center rounded-glass border border-white/20 px-3 py-2">
      <label htmlFor="lens-selector" className="sr-only">
        Select lens
      </label>
      <select
        id="lens-selector"
        value={activeLens}
        onChange={(event) => dashboardStore.setActiveLens(event.target.value as (typeof lenses)[number]["id"])}
        className="min-w-40 bg-transparent font-sans text-content font-medium text-text-primary outline-none"
      >
        {lenses.map((lens) => (
          <option key={lens.id} value={lens.id}>
            {lens.label}
          </option>
        ))}
      </select>
    </div>
  )
}
