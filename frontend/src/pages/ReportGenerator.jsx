import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import ReportConfigPanel from "@/components/reports/ReportConfigPanel"
import ReportPreviewPanel from "@/components/reports/ReportPreviewPanel"
import { useRegions } from "@/hooks/useRegions"
import { generateReport } from "@/lib/api"
import { useDashboardStore } from "@/stores/dashboardStore"

function quarterFromDate(now = new Date()) {
  return Math.floor(now.getMonth() / 3) + 1
}

export default function ReportGenerator() {
  const activeRegion = useDashboardStore((snapshot) => snapshot.activeRegion)
  const { data: regions = [] } = useRegions()
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedReportType, setSelectedReportType] = useState("quarterly_performance")
  const [markdown, setMarkdown] = useState(null)
  const [filename, setFilename] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (regions.length === 0 || selectedRegion) return
    const hasActiveRegion = activeRegion && regions.some((region) => region.region === activeRegion)
    setSelectedRegion(hasActiveRegion ? activeRegion : regions[0].region)
  }, [activeRegion, regions, selectedRegion])

  const currentQuarter = useMemo(() => quarterFromDate(), [])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  async function handleGenerate() {
    if (!selectedRegion) {
      setToast({ tone: "error", message: "Please select a region first." })
      return
    }

    try {
      setIsGenerating(true)
      const response = await generateReport({
        region: selectedRegion,
        report_type: selectedReportType,
      })
      setMarkdown(response.markdown)
      setFilename(response.filename)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate report."
      setToast({ tone: "error", message })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleFinalizeAndExport() {
    if (!markdown) return
    try {
      await navigator.clipboard.writeText(markdown)
      setToast({ tone: "success", message: "Report copied to clipboard." })
    } catch {
      setToast({ tone: "error", message: "Clipboard access failed. Please copy manually." })
    }
  }

  return (
    <div className="relative w-full p-8">
      {toast ? (
        <div
          className={`absolute right-8 top-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
            toast.tone === "success"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-red-100 text-red-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mb-6">
        <Link
          to="/"
          className="text-sm font-medium text-blue-700 underline-offset-2 transition hover:text-blue-800 hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tight text-slate-900">
          REPORT GENERATOR
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ReportConfigPanel
            regions={regions}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            selectedReportType={selectedReportType}
            onReportTypeChange={setSelectedReportType}
            currentQuarter={currentQuarter}
            currentYear={currentYear}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>

        <div className="xl:col-span-2">
          <ReportPreviewPanel
            filename={filename}
            markdown={markdown}
            isGenerating={isGenerating}
            onFinalizeAndExport={handleFinalizeAndExport}
          />
        </div>
      </div>
    </div>
  )
}
