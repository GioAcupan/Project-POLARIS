import { Outlet } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"
import Starbot from "@/components/starbot/Starbot"

export function DashboardLayout() {
  return (
    <div className="polaris-app-shell flex h-screen overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden p-6 md:p-8">
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
      <Starbot />
    </div>
  )
}
