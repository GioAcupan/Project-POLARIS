import { Outlet } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"

export function DashboardLayout() {
  return (
    <div className="polaris-app-shell flex min-h-svh">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <div className="polaris-glass-card min-h-[min(100%,calc(100svh-3rem))] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
