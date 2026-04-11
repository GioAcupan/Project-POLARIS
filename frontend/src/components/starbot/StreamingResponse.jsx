import { useState, useEffect } from "react"

export default function StreamingResponse({ fullText }) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    setDisplayed("")
    if (!fullText) return
    let i = 0
    const interval = setInterval(() => {
      i += 3
      setDisplayed(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(interval)
    }, 15)
    return () => clearInterval(interval)
  }, [fullText])

  const isStreaming = displayed.length < (fullText?.length ?? 0)

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {displayed}
      {isStreaming && <span className="ml-0.5 animate-pulse">▊</span>}
    </div>
  )
}
