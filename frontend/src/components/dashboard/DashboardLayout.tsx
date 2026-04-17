import { Outlet } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"
import Starbot from "@/components/starbot/Starbot"

export function DashboardLayout() {
  return (
    <div className="polaris-main-aura-background flex h-screen overflow-hidden polaris-app-shell">
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

