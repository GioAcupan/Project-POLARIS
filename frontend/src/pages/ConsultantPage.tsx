import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import { RegionalHealthCardContent } from "@/components/dashboard/RegionalHealthCard"
import { useRegions } from "@/hooks/useRegions"
import { chat } from "@/lib/api"
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

function computeLAYS(avgNatScore?: number): string | null {
  if (avgNatScore == null) return null
  return (12 * (avgNatScore / 100)).toFixed(1)
}

function computeTaxLeak(eoc: string | number | null): string | null {
  if (eoc == null) return null
  const numeric = typeof eoc === "number" ? eoc : Number.parseFloat(eoc)
  if (!Number.isFinite(numeric)) return null
  return (numeric * 0.144).toFixed(1)
}

type Message = {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

export default function ConsultantPage() {
  const { data: regions = [] } = useRegions()
  const [selectedRegion, setSelectedRegion] = useState<RegionalScore | null>(null)
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

  const eoc = selectedRegion
    ? (selectedRegion.economic_loss?.toFixed(1) ??
      computeEOC(selectedRegion.student_pop, selectedRegion.avg_nat_score))
    : null
  const lays = selectedRegion
    ? (selectedRegion.lays_score?.toFixed(1) ?? computeLAYS(selectedRegion.avg_nat_score))
    : null
  const taxLeak = computeTaxLeak(eoc)

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex min-w-[320px] w-1/3 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Region
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRegion?.region ?? ""}
            onChange={(e) => {
              const nextRegion = regions.find((rg) => rg.region === e.target.value) ?? null
              setSelectedRegion(nextRegion)
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

        {selectedRegion ? (
          <>
            <div className="space-y-3 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Economic Impact
              </h3>
              <ImpactCard
                label="Annual Economic Loss (EOC)"
                value={eoc ? `PHP ${eoc}B` : "N/A"}
                subtext="GDP lost to non-proficiency"
                severity="critical"
              />
              <ImpactCard
                label="Annual Tax Revenue Leak"
                value={taxLeak ? `PHP ${taxLeak}B` : "N/A"}
                subtext="14.4% of regional EOC"
                severity="warning"
              />
              <ImpactCard
                label="Learning-Adjusted Years"
                value={lays ? `${lays} / 12 yrs` : "N/A"}
                subtext="Actual learning vs. expected"
                severity="info"
              />
            </div>
            <div className="px-4 pb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Regional Health
              </h3>
              <RegionalHealthCardContent regionData={selectedRegion} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-400">
            Select a region to see intelligence data
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
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

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
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

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    </div>
  )
}

type ImpactCardProps = {
  label: string
  value: string
  subtext: string
  severity: "critical" | "warning" | "info"
}

function ImpactCard({ label, value, subtext, severity }: ImpactCardProps) {
  const colors: Record<ImpactCardProps["severity"], string> = {
    critical: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  }
  return (
    <div className={`rounded-xl border p-3 ${colors[severity]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs font-semibold">{label}</div>
      <div className="text-xs opacity-70">{subtext}</div>
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
