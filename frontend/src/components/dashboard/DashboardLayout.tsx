import { Outlet, useLocation } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"
import Starbot from "@/components/starbot/Starbot"

export function DashboardLayout() {
  const { pathname } = useLocation()
  const showStarbot = pathname === "/"

  return (
    <div className="polaris-app-shell flex h-screen overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4">
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
      {showStarbot ? <Starbot /> : null}
    </div>
  )
}

