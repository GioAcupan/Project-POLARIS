import { FileText, LayoutDashboard, Users } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

const iconBtn =
  "flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
const iconBtnActive = "bg-muted text-foreground"

export function Sidebar() {
  const { pathname } = useLocation()
  const reportsActive = pathname.startsWith("/reports")

  return (
    <aside className="polaris-glass-surface flex w-[72px] shrink-0 flex-col items-center gap-2 py-4">
      <NavLink
        to="/"
        end
        title="Dashboard"
        className={({ isActive }) => cn(iconBtn, isActive && iconBtnActive)}
      >
        <LayoutDashboard className="size-5" aria-hidden />
      </NavLink>
      <span
        title="Coming soon"
        className={cn(iconBtn, "pointer-events-none opacity-40")}
        aria-disabled
        role="presentation"
      >
        <Users className="size-5" aria-hidden />
      </span>
      <NavLink
        to="/reports"
        title="Report Generator"
        className={cn(iconBtn, reportsActive && iconBtnActive)}
      >
        <FileText className="size-5" aria-hidden />
      </NavLink>
    </aside>
  )
}
