import { FileText } from "lucide-react"

export default function ReportPreviewPanel({
  filename,
  markdown,
  onFinalizeAndExport,
  isGenerating,
}) {
  return (
    <section className="polaris-glass-surface flex h-full flex-col rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <FileText className="size-4" aria-hidden />
          <span className="text-sm font-medium">{filename ?? "Quarterly_Report.md"}</span>
        </div>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-800">
          FOR REVIEW — AI-GENERATED DRAFT
        </span>
      </div>

      <pre className="mt-4 min-h-60 max-h-[60vh] flex-1 overflow-auto whitespace-pre-wrap rounded-lg border bg-slate-50 p-6 text-sm font-mono">
        {markdown ? (
          markdown
        ) : (
          <span className="text-slate-500">
            Select a region and report type, then click Generate to preview your report.
          </span>
        )}
      </pre>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onFinalizeAndExport}
          disabled={!markdown || isGenerating}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          FINALIZE AND EXPORT
        </button>
      </div>
    </section>
  )
}
