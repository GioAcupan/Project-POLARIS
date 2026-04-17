import type { RegionalScore } from "@/types/polaris"
import { Info } from "lucide-react"
import {
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ImpactDatum = {
  year: string
  training: number
  nat: number
  feedback: number
}

const IMPACT_SCORE_BADGE = 54

const IMPACT_DATA: ImpactDatum[] = [
  { year: "2022", training: 580, nat: 76, feedback: 3.8 },
  { year: "2023", training: 650, nat: 78, feedback: 4.1 },
  { year: "2024", training: 720, nat: 79, feedback: 4.3 },
  { year: "2025", training: 780, nat: 82, feedback: 4.6 },
]

const IMPACT_ROWS = [
  { period: "2022", training: 580, nat: 76 },
  { period: "2023", training: 650, nat: 78 },
  { period: "2024", training: 720, nat: 79 },
  { period: "2025", training: 780, nat: 82 },
]
const IMPACT_YEARS = IMPACT_DATA.map((datum) => datum.year)

function feedbackColor(feedback: number): string {
  if (feedback >= 4.6) return "#047857"
  if (feedback >= 4.3) return "#22c55e"
  if (feedback >= 4.0) return "#a3e635"
  if (feedback >= 3.7) return "#fde68a"
  if (feedback >= 3.4) return "#fb923c"
  return "#dc2626"
}

export function ImpactView({ selectedRegion }: { selectedRegion: RegionalScore }) {
  const regionLabel = selectedRegion.region
  const averageFeedback =
    IMPACT_DATA.reduce((sum, datum) => sum + datum.feedback, 0) / Math.max(IMPACT_DATA.length, 1)

  return (
    <div className="space-y-2" aria-label={`Impact details for ${regionLabel}`}>
      <section className="rounded-glass border border-white/20 bg-white/40 p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-content font-semibold text-text-primary">Impact Key Graph</h3>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="About impact key graph"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#4e596d] transition-colors hover:bg-white/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-data-viz-primary)]/60"
              >
                <Info className="size-5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>
                Correlates STAR training volume with NAT outcomes and teacher feedback over time.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2aa24] text-lg font-bold text-white">
              {IMPACT_SCORE_BADGE}
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full items-stretch gap-1.5 rounded-glass p-0">
          <div className="min-w-0 flex-1">
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart
                data={IMPACT_DATA}
                margin={{ top: 8, right: 6, left: 4, bottom: 8 }}
                barCategoryGap="9%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(116, 133, 162, 0.25)" />
                <XAxis
                  dataKey="year"
                  ticks={IMPACT_YEARS}
                  interval={0}
                  allowDuplicatedCategory={false}
                  padding={{ left: 0, right: 0 }}
                />
                <YAxis yAxisId="left" domain={[0, 850]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} width={36} />
                <RechartsTooltip
                  formatter={(value, name) => {
                    const displayValue = value ?? 0
                    if (name === "Training Volume (Teachers)") return [displayValue, name]
                    if (name === "Avg NAT Score (%)") return [`${displayValue}%`, name]
                    if (name === "Avg Feedback (1-5 Stars)") return [`${displayValue} stars`, name]
                    return [displayValue, name]
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="training"
                  name="Training Volume (Teachers)"
                  fill="#b9c6d8"
                  barSize={44}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  dataKey="nat"
                  name="Avg NAT Score (%)"
                  stroke="#b0303b"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Scatter yAxisId="right" data={IMPACT_DATA} dataKey="nat" name="Avg Feedback (1-5 Stars)">
                  {IMPACT_DATA.map((datum) => (
                    <Cell key={`feedback-${datum.year}`} fill={feedbackColor(datum.feedback)} stroke="#1f2937" />
                  ))}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <aside
            className="flex h-[210px] w-6 flex-col items-center justify-between rounded-full border border-white/40 bg-white/35 px-1 py-2"
            aria-label="Impact metric gradient scale"
          >
            <span className="text-[9px] font-semibold leading-none text-[#0f172a]/70">HI</span>
            <div className="relative h-full w-3.5 overflow-hidden rounded-full border border-white/50 bg-white/30">
              <div className="absolute inset-0 bg-gradient-to-b from-[#16a34a] via-[#facc15] to-[#ef4444]" />
            </div>
            <span className="text-[9px] font-semibold leading-none text-[#0f172a]/70">LO</span>
          </aside>
        </div>
      </section>

      <section className="space-y-1.5">
        {IMPACT_ROWS.map((entry) => (
          <div
            key={entry.period}
            className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2 rounded-full border border-[#d0def1] bg-[#cdddf1] px-2.5 py-1.5"
          >
            <span className="text-[11px] font-bold leading-snug text-[#1f2a3d]">{entry.period}</span>
            <span className="min-w-0 truncate text-[11px] font-medium leading-snug text-[#1f2a3d]">
              {entry.training} Training Volume
            </span>
            <span className="text-right text-[11px] font-semibold leading-snug text-[#1f2a3d]">{entry.nat} NAT</span>
          </div>
        ))}
      </section>

      <aside className="rounded-glass border border-[#d0def1] bg-[#cdddf1] px-3 py-1.5 text-[12px] leading-snug text-[#1f2a3d]">
        Average Training Feedback <span className="font-semibold">{averageFeedback.toFixed(1)}/5</span>
      </aside>
    </div>
  )
}
