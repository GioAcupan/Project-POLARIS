import { Outlet, useLocation } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { cn } from "@/lib/utils"
import Starbot from "@/components/starbot/Starbot"

export function DashboardLayout() {
  const { pathname } = useLocation()
  const isTeacherAssignmentRoute = pathname.startsWith("/teacher-assignment")

  return (
    <div className={cn("flex h-screen overflow-hidden", isTeacherAssignmentRoute ? "bg-white" : "polaris-app-shell")}>
      <Sidebar />
      <main className={cn("min-w-0 flex-1 overflow-hidden p-6 md:p-8", isTeacherAssignmentRoute && "bg-white")}>
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
      <Starbot />
    </div>
  )
}
