import { FileText, LayoutDashboard, Users } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

const iconBtn =
  "flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-white/40 hover:text-slate-900"
const iconBtnActive = "polaris-glass-fluent rounded-[14px] text-black"

const logoSlotClass = "flex w-full max-w-[48px] justify-center"

const polarisLogoClass =
  "max-h-7 w-auto max-w-[36px] object-contain select-none pointer-events-none"

const dostLogoClass =
  "max-h-10 w-auto max-w-[48px] object-contain select-none pointer-events-none"

export function Sidebar() {
  const { pathname } = useLocation()
  const reportsActive = pathname.startsWith("/reports")
  const teacherAssignmentActive = pathname.startsWith("/teacher-assignment")

  return (
    <aside className="polaris-glass-liquid rounded-none border-t-0 border-l-0 border-b-0 flex h-full min-h-svh w-[60px] shrink-0 flex-col items-center justify-between py-4 sm:w-[72px]">
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
          to="/reports"
          title="Report Generator"
          className={cn(iconBtn, reportsActive && iconBtnActive)}
        >
          <FileText className="size-5" aria-hidden />
        </NavLink>
        <NavLink
          to="/teacher-assignment"
          title="Teacher Assignment"
          className={cn(iconBtn, teacherAssignmentActive && iconBtnActive)}
        >
          <Users className="size-5" aria-hidden />
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
