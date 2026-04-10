import { Route, Routes } from "react-router-dom"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import Dashboard from "@/pages/Dashboard"
import ReportGenerator from "@/pages/ReportGenerator"

export function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<ReportGenerator />} />
      </Route>
    </Routes>
  )
}

export default App
