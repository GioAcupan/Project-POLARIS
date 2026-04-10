import { Outlet } from "react-router-dom"

import { Sidebar } from "@/components/dashboard/Sidebar"

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
