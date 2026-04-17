import { FileText, LayoutDashboard, Users } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

const iconBtn =
  "flex size-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
const iconBtnActive = "bg-white/10 text-chart-primary"

const logoSlotClass = "flex w-full max-w-[48px] justify-center"

const polarisLogoClass =
  "max-h-7 w-auto max-w-[36px] object-contain select-none pointer-events-none"

const dostLogoClass =
  "max-h-10 w-auto max-w-[48px] object-contain select-none pointer-events-none"

export function Sidebar() {
  const { pathname } = useLocation()
  const reportsActive = pathname.startsWith("/reports")

  return (
    <aside className="flex h-full min-h-svh w-[72px] shrink-0 flex-col items-center justify-between border-r border-white/10 bg-brand-blue py-4">
      <div className="flex w-full flex-col items-center gap-5 px-1">
        <div className={logoSlotClass}>
          <img
            src="/assets/sidebar/logos/polaris.svg"
            alt="POLARIS"
            className={polarisLogoClass}
            width={36}
            height={28}
            decoding="async"
          />
        </div>
        <div className={logoSlotClass}>
          <img
            src="/assets/sidebar/logos/dost-star.png"
            alt="DOST STAR"
            className={dostLogoClass}
            width={48}
            height={48}
            decoding="async"
          />
        </div>
      </div>

      <nav className="flex flex-col items-center gap-2" aria-label="Primary navigation">
        <NavLink
          to="/"
          end
          title="Dashboard"
          className={({ isActive }) => cn(iconBtn, isActive && iconBtnActive)}
        >
          <LayoutDashboard className="size-5" aria-hidden />
        </NavLink>
        <NavLink
          to="/teacher-assignment"
          title="Teacher Assignment"
          className={({ isActive }) => cn(iconBtn, isActive && iconBtnActive)}
        >
          <Users className="size-5" aria-hidden />
        </NavLink>
        <NavLink
          to="/reports"
          title="Report Generator"
          className={cn(iconBtn, reportsActive && iconBtnActive)}
        >
          <FileText className="size-5" aria-hidden />
        </NavLink>
      </nav>

      <div className="flex flex-col items-center px-1" title="Account">
        <div
          className="size-10 shrink-0 rounded-full border border-white/20 bg-white/40"
          aria-hidden
        />
      </div>
    </aside>
  )
}
