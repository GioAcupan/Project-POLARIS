import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { EffectOverviewCard } from "@/components/dashboard/EffectOverviewCard"
import { PPSTRadarCard } from "@/components/dashboard/PPSTRadarCard"
import { RegionalHealthCardContent } from "@/components/dashboard/RegionalHealthCard"
import { useNationalRadar } from "@/hooks/useNationalRadar"
import { useRegions } from "@/hooks/useRegions"
import { chat } from "@/lib/api"
import { dashboardStore } from "@/stores/dashboardStore"
import type { ChatRequest, RegionalScore } from "@/types/polaris"

const MODES: Array<{
  id: ChatRequest["mode"]
  label: string
  description: string
  icon: string
}> = [
  {
    id: "advisor",
    label: "Advisor",
    description: "Strategic analysis and root-cause diagnosis",
    icon: "Brain",
  },
  {
    id: "drafting_accomplishment",
    label: "Draft: Accomplishment",
    description: "Generate a DepEd Accomplishment Report",
    icon: "Report",
  },
  {
    id: "drafting_intervention",
    label: "Draft: Intervention",
    description: "Generate an Intervention Priority Memo",
    icon: "Memo",
  },
  {
    id: "drafting_needs_assessment",
    label: "Draft: Needs Assessment",
    description: "Generate a Regional TNA Summary",
    icon: "Chart",
  },
]

function computeEOC(studentPop?: number, avgNatScore?: number): string | null {
  if (!studentPop || avgNatScore == null) return null
  const nonProficient = studentPop * (1 - avgNatScore / 100)
  return (nonProficient * 290000 / 1e9).toFixed(1)
}

type Message = {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

export default function ConsultantPage() {
  const { data: regions = [] } = useRegions()
  const { data: nationalRadar = null } = useNationalRadar()
  const [selectedRegion, setSelectedRegion] = useState<RegionalScore | null>(null)
  const [leftPage, setLeftPage] = useState(0)
  const [activeMode, setActiveMode] = useState<ChatRequest["mode"]>("advisor")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (regions.length > 0 && !selectedRegion) {
      const r8 = regions.find((r) => r.region === "Region VIII") ?? regions[0]
      setSelectedRegion(r8)
    }
  }, [regions, selectedRegion])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setLeftPage(0)
  }, [selectedRegion?.region])

  useEffect(() => {
    dashboardStore.setActiveRegion(selectedRegion?.region ?? null)
  }, [selectedRegion?.region])

  useEffect(() => {
    return () => {
      dashboardStore.setActiveRegion(null)
    }
  }, [])

  const eoc = selectedRegion
    ? (selectedRegion.economic_loss?.toFixed(1) ??
      computeEOC(selectedRegion.student_pop, selectedRegion.avg_nat_score))
    : null
  const leftPages = [
    {
      key: "regional-health",
      label: "Regional Health",
      render: () => (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Regional Health
          </h3>
          {selectedRegion ? <RegionalHealthCardContent regionData={selectedRegion} /> : null}
        </div>
      ),
    },
    {
      key: "economic-impact",
      label: "Economic Impact",
      render: () => (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Economic Impact
          </h3>
          <EffectOverviewCard />
        </div>
      ),
    },
    {
      key: "ppst-radar",
      label: "PPST Skill Radar",
      render: () => (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            PPST Skill Radar
          </h3>
          <div className="mx-auto w-full max-w-[420px]">
            {/* Uses national benchmark radar data for now; regional radar mapping is out of scope. */}
            <PPSTRadarCard radar={nationalRadar} />
          </div>
        </div>
      ),
    },
  ] as const

  const pageCount = leftPages.length
  const activeLeftPage = leftPages[leftPage] ?? leftPages[0]

  function handlePrevLeftPage() {
    setLeftPage((current) => (current - 1 + pageCount) % pageCount)
  }

  function handleNextLeftPage() {
    setLeftPage((current) => (current + 1) % pageCount)
  }

  async function handleSend() {
    if (!inputValue.trim() || isStreaming) return

    const prompt = inputValue
    const userMsg: Message = { role: "user", content: prompt }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsStreaming(true)

    try {
      const data = await chat({
        message: prompt,
        region_context: selectedRegion,
        mode: activeMode,
      })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, sources: data.sources },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to reach STARBOT.", sources: [] },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  function handleModeChange(modeId: ChatRequest["mode"]) {
    setActiveMode(modeId)
    setMessages([])
  }

  return (
    <div className="flex h-full min-h-0 gap-4 md:gap-5">
      <section className="polaris-glass-fluent flex min-h-0 w-1/3 min-w-[320px] flex-col overflow-hidden">
        <div className="p-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Region
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[color:var(--color-brand-blue)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRegion?.region ?? ""}
            onChange={(e) => {
              const nextRegion = regions.find((rg) => rg.region === e.target.value) ?? null
              setSelectedRegion(nextRegion)
              setLeftPage(0)
              setMessages([])
            }}
          >
            {regions.map((region) => (
              <option key={region.region} value={region.region}>
                {region.region}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-slate-50 p-4">
            {selectedRegion ? (
              <div className="flex min-h-0 flex-1 flex-col">{activeLeftPage.render()}</div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-400">
                Select a region to see intelligence data
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center p-3 pt-1">
          <div className="inline-flex items-center justify-center gap-3 rounded-full bg-slate-100 px-4 py-1.5">
            <button
              type="button"
              onClick={handlePrevLeftPage}
              className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
              disabled={!selectedRegion}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {leftPages.map((page, index) => {
                const active = index === leftPage
                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => setLeftPage(index)}
                    aria-label={`Show ${page.label}`}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      active ? "bg-slate-800" : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    disabled={!selectedRegion}
                  />
                )
              })}
            </div>
            <button
              type="button"
              onClick={handleNextLeftPage}
              className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
              disabled={!selectedRegion}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Strategic Consultant</h1>
              <p className="text-xs text-gray-500">
                {selectedRegion
                  ? `Analyzing ${selectedRegion.region} - powered by POLARIS telemetry`
                  : "Select a region to begin"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                title={mode.description}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeMode === mode.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {MODES.find((mode) => mode.id === activeMode)?.description}
          </p>
        </div>

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <StarterPrompts
              mode={activeMode}
              region={selectedRegion?.region}
              eoc={eoc}
              onSelect={(text) => setInputValue(text)}
            />
          ) : null}
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="max-w-lg rounded-2xl rounded-tr-md bg-blue-600 px-4 py-3 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-2xl">
                  <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-5 py-4 shadow-sm">
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 ? (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-400">Data from: {msg.sources.join(" | ")}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isStreaming ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              placeholder={
                activeMode === "advisor"
                  ? `Ask about ${selectedRegion?.region || "a region"}... (e.g. "How do we stop the economic loss?")`
                  : "Type 'Generate the report' to create the document..."
              }
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || !selectedRegion}
            />
            <button
              onClick={() => void handleSend()}
              disabled={isStreaming || !inputValue.trim() || !selectedRegion}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStreaming ? "..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

type StarterPromptsProps = {
  mode: ChatRequest["mode"]
  region?: string
  eoc: string | null
  onSelect: (text: string) => void
}

function StarterPrompts({ mode, region, eoc, onSelect }: StarterPromptsProps) {
  const prompts: Record<ChatRequest["mode"], string[]> = {
    advisor: [
      eoc
        ? `How do we stop the PHP ${eoc}B annual economic loss in ${region}?`
        : `What is the biggest risk in ${region}?`,
      `Which PPST domain should ${region} address first?`,
      "What STAR programs would have the most impact right now?",
    ],
    drafting_accomplishment: ["Generate an Accomplishment Report for this quarter."],
    drafting_intervention: ["Generate an Intervention Priority Memo for the weakest PPST domain."],
    drafting_needs_assessment: ["Generate a Regional Training Needs Assessment Summary."],
  }
  const list = (prompts[mode] || []).filter(Boolean)
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <p className="text-sm font-medium text-gray-400">Try asking:</p>
      <div className="w-full max-w-xl space-y-2">
        {list.map((prompt, index) => (
          <button
            key={`${prompt}-${index}`}
            onClick={() => onSelect(prompt)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
