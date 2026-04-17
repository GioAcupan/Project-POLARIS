import { Outlet, useLocation } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { cn } from "@/lib/utils"
import Starbot from "@/components/starbot/Starbot"

export function DashboardLayout() {
  const { pathname } = useLocation()
  const usesFlatWhiteSurface = pathname.startsWith("/teacher-assignment")

  return (
    <div className={cn("flex h-screen overflow-hidden", usesFlatWhiteSurface ? "bg-white" : "polaris-app-shell")}>
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4">
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
      <Starbot />
    </div>
  )
}

