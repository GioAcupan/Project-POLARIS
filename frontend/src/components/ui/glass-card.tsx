import * as React from "react"

import { cn } from "@/lib/utils"

export function GlassCard({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-glass p-6 polaris-glass-card", className)} {...props} />
}
