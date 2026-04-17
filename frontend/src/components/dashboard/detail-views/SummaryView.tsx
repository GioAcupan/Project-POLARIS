import type { RegionHealth } from "@/types/polaris"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type ScoreTrendPoint = {
  label: string
  regional: number
  national: number
}

const sampleTrendData: ScoreTrendPoint[] = [
  { label: "Jan", regional: 80, national: 75 },
  { label: "Feb", regional: 85, national: 78 },
  { label: "Mar", regional: 78, national: 80 },
  { label: "Apr", regional: 90, national: 82 },
  { label: "May", regional: 88, national: 85 },
]

export function SummaryView({ regionHealth }: { regionHealth: RegionHealth }) {
  const factorCards = [
    {
      key: "teacher_student_ratio",
      label: "Teacher-Student Ratio",
      value: regionHealth.factors.teacher_student_ratio.toFixed(1),
    },
    {
      key: "specialization_pct",
      label: "Specialization %",
      value: `${regionHealth.factors.specialization_pct.toFixed(1)}%`,
    },
    {
      key: "star_coverage_pct",
      label: "STAR Coverage %",
      value: `${regionHealth.factors.star_coverage_pct.toFixed(1)}%`,
    },
    {
      key: "avg_nat_score",
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
      <div className="grid grid-cols-2 gap-2.5">
        {factorCards.map((factor) => (
          <article
            key={factor.key}
            className="flex min-h-[98px] min-w-0 flex-col justify-between rounded-[18px] border border-[#d6dce7] bg-[#edf1f6] px-3 py-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
          >
            <p className="text-[0.8rem] font-semibold leading-snug text-[#8aa0bc]">{factor.label}</p>
            <p className="text-[1.85rem] font-bold leading-none tracking-tight text-[#1f2028]">{factor.value}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
