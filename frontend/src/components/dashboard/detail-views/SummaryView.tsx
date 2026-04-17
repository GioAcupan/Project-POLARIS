import type { RegionHealth } from "@/types/polaris"
import { ArrowDown, ArrowUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const TREND_GOOD = "#2ecc71"
const TREND_BAD = "#ff5e78"

type ScoreTrendPoint = {
  label: string
  regional: number
  national: number
}

const sampleTrendData: ScoreTrendPoint[] = [
  { label: "2021", regional: 80, national: 75 },
  { label: "2022", regional: 85, national: 78 },
  { label: "2023", regional: 78, national: 80 },
  { label: "2024", regional: 90, national: 82 },
  { label: "2025", regional: 88, national: 85 },
]

export function SummaryView({ regionHealth }: { regionHealth: RegionHealth }) {
  const factorCards = [
    {
      key: "teacher_student_ratio",
      label: "Teacher-Student Ratio",
      value: regionHealth.factors.teacher_student_ratio.toFixed(1),
      trend: { direction: "up" as const, pct: 2, favorable: false },
    },
    {
      key: "specialization_pct",
      label: "Specialization %",
      value: `${regionHealth.factors.specialization_pct.toFixed(1)}%`,
      trend: { direction: "up" as const, pct: 8, favorable: true },
    },
    {
      key: "star_coverage_pct",
      label: "STAR Coverage %",
      value: `${regionHealth.factors.star_coverage_pct.toFixed(1)}%`,
      trend: { direction: "up" as const, pct: 5, favorable: true },
    },
    {
      key: "avg_nat_score",
      label: "Average NAT Score",
      value: regionHealth.factors.avg_nat_score.toFixed(1),
      trend: { direction: "down" as const, pct: 2, favorable: false },
    },
  ] as const

  return (
    <div className="space-y-2.5">
      <section className="rounded-glass border border-white/20 bg-white/40 p-2.5">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-content font-semibold text-text-primary">Score vs National Average</h3>
          <div className="flex items-center gap-3 text-[11px] font-medium text-[#4b5563]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[2px] w-5 rounded bg-[#1f2937]" />
              Regional
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[2px] w-5 border-t-2 border-dashed border-[#6b7280]" />
              National
            </span>
          </div>
        </div>
        <div className="h-36 w-full sm:h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleTrendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="regional"
                name="Regional"
                stroke="#1f2937"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="national"
                name="National"
                stroke="#6b7280"
                strokeWidth={1.8}
                strokeDasharray="6 4"
                dot={{ r: 2.5 }}
                activeDot={{ r: 3.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div>
        <div className="mb-2 flex justify-between px-0.5 text-[11px] font-semibold tracking-wide text-[#8b95b3]">
          {(["2021", "2022", "2023", "2024", "2025"] as const).map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {factorCards.map((factor) => {
            const { trend } = factor
            const color = trend.favorable ? TREND_GOOD : TREND_BAD
            const Arrow = trend.direction === "up" ? ArrowUp : ArrowDown
            return (
              <article
                key={factor.key}
                className="relative flex min-h-[118px] min-w-0 flex-col rounded-[22px] border border-slate-200/90 bg-white px-3 pb-9 pt-2.5 shadow-[0_2px_14px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[0.78rem] font-medium leading-snug text-[#8b95b3]">
                  {factor.label}
                </p>
                <div className="flex flex-1 items-center justify-center py-1">
                  <p className="text-[1.85rem] font-bold leading-none tracking-tight text-[#1f2028]">{factor.value}</p>
                </div>
                <div
                  className="absolute bottom-2.5 right-3 flex items-center gap-0.5 text-[12px] font-semibold tabular-nums"
                  style={{ color }}
                >
                  <Arrow className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden />
                  <span>{trend.pct}%</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
