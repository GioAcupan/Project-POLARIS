import type { DemandTabData, RegionalScore } from "@/types/polaris"
import { Info } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DemandView({
  selectedRegion,
  demandData,
}: {
  selectedRegion: RegionalScore
  demandData: DemandTabData
}) {
  const topThree = demandData.metrics.slice(0, 3)
  const regionLabel = selectedRegion.region

  return (
    <div className="space-y-2" aria-label={`Demand details for ${regionLabel}`}>
      <section className="rounded-glass border border-white/20 bg-white/40 p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-content font-semibold text-text-primary">Demands by Bar Chart</h3>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="About demand chart"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#4e596d] transition-colors hover:bg-white/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-data-viz-primary)]/60"
              >
                <Info className="size-5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>
                Summarizes teacher demand for resource or training material by category.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#4b5563]">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#3495db]" aria-hidden="true" />
              {demandData.legend_label}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2aa24] text-lg font-bold text-white">
              {Math.round(demandData.score_badge)}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full rounded-glass p-0">
          <ResponsiveContainer width="100%" height={188}>
            <BarChart data={demandData.metrics} layout="vertical" margin={{ top: 8, right: 18, left: 6, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(116, 133, 162, 0.32)" />
              <XAxis type="number" domain={[0, 100]} tickCount={6} />
              <YAxis
                type="category"
                dataKey="label"
                width={116}
                tick={{ fontSize: 11, fill: "#5d6679" }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip cursor={{ fill: "rgba(145, 181, 226, 0.2)" }} />
              <Bar dataKey="requests" fill="#64a8df" radius={[0, 10, 10, 0]} barSize={14}>
                <LabelList dataKey="requests" position="right" fill="#445065" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-1.5">
        <header className="rounded-xl border border-[#2f73b9] bg-[#b9d4f2] px-3 py-1 text-label font-bold leading-tight text-[#1f2a3d]">
          TOP 3 TRAINING DEMANDS IN THIS REGION
        </header>
        {topThree.map((entry, index) => (
          <div
            key={entry.label}
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-[#d0def1] bg-[#cdddf1] px-3 py-1.5"
          >
            <span className="text-content font-bold text-[#1f2a3d]">{index + 1}</span>
            <span className="truncate text-content font-medium text-[#1f2a3d]">{entry.label}</span>
            <span className="text-content font-semibold text-[#1f2a3d]">{entry.requests} Requests</span>
          </div>
        ))}
      </section>

      <aside className="rounded-glass border border-[#d0def1] bg-[#cdddf1] px-2 py-1 text-[10px] leading-tight italic text-[#3b4658]">
        {demandData.note}
      </aside>
    </div>
  )
}
