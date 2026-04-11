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
    <div className="mb-3 flex flex-wrap gap-2">
      {lenses.map((lens) => {
        const active = activeLens === lens.id
        return (
          <button
            key={lens.id}
            type="button"
            onClick={() => dashboardStore.setActiveLens(lens.id)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {lens.label}
          </button>
        )
      })}
    </div>
  )
}
