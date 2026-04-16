import { cn } from "@/lib/utils"

export default function ReportTypeCard({ value, title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-value={value}
      onClick={() => onClick(value)}
      className={cn(
        "w-full rounded-xl px-4 py-3 text-left transition-colors",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
        selected
          ? "bg-blue-600 text-white"
          : "bg-blue-50 text-slate-900 hover:bg-blue-100",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className={cn("mt-1 text-xs", selected ? "text-blue-100" : "text-slate-600")}>
        {subtitle}
      </p>
    </button>
  )
}
