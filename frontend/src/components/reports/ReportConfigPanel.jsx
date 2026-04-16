import { Loader2 } from "lucide-react"

import ReportTypeCard from "@/components/reports/ReportTypeCard"

const reportTypeDefinitions = [
  {
    value: "quarterly_performance",
    title: "Quarterly Performance Report",
  },
  {
    value: "intervention_priority",
    title: "Intervention Priority Memo",
    subtitle: "Urgent Action Recommendations",
  },
  {
    value: "executive_summary",
    title: "Executive Summary",
    subtitle: "Quick Overview Brief",
  },
]

export default function ReportConfigPanel({
  regions,
  selectedRegion,
  onRegionChange,
  selectedReportType,
  onReportTypeChange,
  currentQuarter,
  currentYear,
  isGenerating,
  onGenerate,
}) {
  return (
    <section className="polaris-glass-surface flex h-full flex-col rounded-2xl p-5">
      <label htmlFor="region-select" className="text-xs font-semibold tracking-wide text-slate-700">
        Select Region
      </label>
      <select
        id="region-select"
        value={selectedRegion}
        onChange={(event) => onRegionChange(event.target.value)}
        className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-300 transition focus:ring-2"
      >
        {regions.map((region) => (
          <option key={region.region} value={region.region}>
            {region.region}
          </option>
        ))}
      </select>

      <div className="mt-6">
        <p className="text-xs font-semibold tracking-wide text-slate-700">Report Type</p>
        <div role="radiogroup" aria-label="Report Type" className="mt-2 space-y-3">
          {reportTypeDefinitions.map((card) => (
            <ReportTypeCard
              key={card.value}
              value={card.value}
              title={card.title}
              subtitle={
                card.subtitle ?? `Comprehensive Q${currentQuarter} ${currentYear} Analysis`
              }
              selected={selectedReportType === card.value}
              onClick={onReportTypeChange}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !selectedRegion}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {isGenerating ? "Generating..." : "GENERATE REPORT"}
      </button>
    </section>
  )
}
