import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Copy, MessageSquare, Minimize2, RefreshCw, Send, X } from "lucide-react"

import { chat } from "@/lib/api"
import { useDashboardStore } from "@/stores/dashboardStore"

import StreamingResponse from "./StreamingResponse"

const CHIP_ONE_LABEL = "💡 Biggest PPST gap here?"
const CHIP_ONE_PROMPT = "Which PPST domain has the biggest gap in this region?"
const CHIP_TWO_LABEL = "📊 How does this region compare nationally?"
const CHIP_TWO_PROMPT = "How does this region compare to the national average?"

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function Starbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState([])
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const dragOriginRef = useRef({ x: 0, y: 0, baseX: 0, baseY: 0 })
  const panelRef = useRef(null)
  const launcherRef = useRef(null)
  const listRef = useRef(null)

  const activeRegion = useDashboardStore((state) => state.activeRegion)
  const regions = useDashboardStore((state) => state.regions)
  const resetConversation = useMemo(
    () => () => {
      setMessages([])
      setInputValue("")
    },
    [],
  )

  useEffect(() => {
    if (!isOpen || isMinimized) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (event) => {
      const nextX = dragOriginRef.current.baseX + (event.clientX - dragOriginRef.current.x)
      const nextY = dragOriginRef.current.baseY + (event.clientY - dragOriginRef.current.y)
      setDragOffset({ x: nextX, y: nextY })
    }
    const onMouseUp = () => setDragging(false)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging])

  useEffect(() => {
    if (!copiedMessageId) return
    const timer = window.setTimeout(() => setCopiedMessageId(null), 2500)
    return () => window.clearTimeout(timer)
  }, [copiedMessageId])

  useEffect(() => {
    if (!isOpen) return
    const onOutsideClick = (event) => {
      const target = event.target
      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return
      setIsOpen(false)
      setIsMinimized(false)
    }
    document.addEventListener("mousedown", onOutsideClick)
    return () => document.removeEventListener("mousedown", onOutsideClick)
  }, [isOpen])

  const hasMessages = messages.length > 0

  async function sendPrompt(rawMessage) {
    const message = rawMessage.trim()
    if (!message || isSending) return

    const regionContext = activeRegion
      ? regions.find((row) => row.region === activeRegion) ?? null
      : null

    setIsSending(true)
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text: message }])
    setInputValue("")

    try {
      const response = await chat({
        message,
        region_context: regionContext,
      })
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          response: response.response,
          sources: response.sources ?? [],
        },
      ])
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Failed to contact STARBOT. Try again."
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          response: fallbackMessage,
          sources: [],
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function onDragStart(event) {
    dragOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
      baseX: dragOffset.x,
      baseY: dragOffset.y,
    }
    setDragging(true)
  }

  return (
    <div
      className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3"
      style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
    >
      {isOpen && (
        <section
          ref={panelRef}
          className="polaris-glass-surface w-[360px] overflow-hidden rounded-2xl border border-white/50 shadow-2xl"
          role="dialog"
          aria-label="STARBOT"
        >
          <header
            onMouseDown={onDragStart}
            className="flex cursor-move items-center justify-between border-b border-white/50 px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/70 text-brand-blue">
                <MessageSquare className="size-4" aria-hidden />
              </div>
              <div className="text-sm font-semibold text-slate-800">STARBOT</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                title="Reset conversation"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <RefreshCw className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Minimize2 className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                title="Close"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </header>

          {!isMinimized && (
            <div className="flex h-[460px] flex-col">
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <article key={message.id} className="space-y-1.5">
                    {message.role === "user" ? (
                      <div className="ml-auto max-w-[85%] rounded-2xl bg-brand-blue px-3 py-2 text-sm text-white">
                        {message.text}
                      </div>
                    ) : (
                      <div className="mr-auto max-w-[95%] rounded-2xl bg-white/80 px-3 py-2.5 text-slate-800">
                        <StreamingResponse fullText={message.response} />
                        {message.sources?.length > 0 && (
                          <p className="mt-2 text-xs text-slate-500">
                            [Source: {message.sources.join(", ")}]
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(message.response).then(() => {
                                setCopiedMessageId(message.id)
                              })
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Copy className="size-3.5" aria-hidden />
                            Copy
                          </button>
                          {copiedMessageId === message.id && (
                            <span
                              className="text-xs font-medium text-signal-good"
                              role="status"
                              aria-live="polite"
                            >
                              Copied successfully!
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-white/50 p-3">
                {!hasMessages && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void sendPrompt(CHIP_ONE_PROMPT)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-200 hover:text-slate-900"
                    >
                      {CHIP_ONE_LABEL}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendPrompt(CHIP_TWO_PROMPT)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-200 hover:text-slate-900"
                    >
                      {CHIP_TWO_LABEL}
                    </button>
                  </div>
                )}
                <form
                  className="flex items-center gap-2 rounded-2xl border border-slate-300/80 bg-white/80 px-2 py-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void sendPrompt(inputValue)
                  }}
                >
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    maxLength={500}
                    placeholder="Ask STARBOT about this region..."
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSending || inputValue.trim().length === 0}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-brand-blue text-white disabled:cursor-not-allowed disabled:opacity-50"
                    title="Send"
                  >
                    <Send className="size-4" aria-hidden />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev)
          setIsMinimized(false)
        }}
        className="polaris-glass-surface inline-flex size-14 items-center justify-center rounded-full border border-white/60 text-brand-blue shadow-xl"
        aria-label="Toggle STARBOT"
        title="STARBOT"
      >
        <Bot className="size-6" aria-hidden />
      </button>
    </div>
  )
}
