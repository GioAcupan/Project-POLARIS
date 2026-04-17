import type { RegionHealth, SummaryFactorKey, SummaryTabData } from "@/types/polaris"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const FALLBACK_FACTOR_TREND = {
  direction: "up" as const,
  pct: 0,
  favorable: true,
}

export function SummaryView({
  regionHealth,
  summaryData,
}: {
  regionHealth: RegionHealth
  summaryData: SummaryTabData
}) {
  const factorCards = [
    {
      key: "teacher_student_ratio" as SummaryFactorKey,
      label: "Teacher-Student Ratio",
      value: regionHealth.factors.teacher_student_ratio.toFixed(1),
    },
    {
      key: "specialization_pct" as SummaryFactorKey,
      label: "Specialization %",
      value: `${regionHealth.factors.specialization_pct.toFixed(1)}%`,
    },
    {
      key: "star_coverage_pct" as SummaryFactorKey,
      label: "STAR Coverage %",
      value: `${regionHealth.factors.star_coverage_pct.toFixed(1)}%`,
    },
    {
      key: "avg_nat_score" as SummaryFactorKey,
      label: "Average NAT Score",
      value: regionHealth.factors.avg_nat_score.toFixed(1),
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
            <LineChart data={summaryData.trend_series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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
        <div className="grid grid-cols-2 gap-2.5">
          {factorCards.map((factor) => {
            const trend = summaryData.factor_trends[factor.key] ?? FALLBACK_FACTOR_TREND
            const trendClass = trend.favorable
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
            const trendArrow = trend.direction === "up" ? "↑" : "↓"
            return (
              <div
                key={factor.key}
                className="flex min-h-[100px] min-w-0 flex-col justify-between rounded-lg border border-white/20 bg-white/40 px-2.5 py-2 shadow-sm md:min-h-[108px]"
              >
                <p className="text-xs font-medium leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">{factor.label}</p>
                <div className="flex min-h-[2.5rem] flex-wrap items-baseline justify-end gap-1.5">
                  <span className="text-3xl font-bold leading-none tracking-tight text-text-primary sm:text-4xl">{factor.value}</span>
                  <span className={`text-sm font-semibold tabular-nums ${trendClass}`}>
                    {trendArrow} {trend.pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
