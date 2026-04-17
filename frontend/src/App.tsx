import { Route, Routes } from "react-router-dom"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import Dashboard from "@/pages/Dashboard"
import ConsultantPage from "@/pages/ConsultantPage"
import TeacherAssignment from "@/pages/TeacherAssignment"

export function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="teacher-assignment"
          element={<TeacherAssignment onAssignTeachers={() => undefined} />}
        />
        <Route path="reports" element={<ConsultantPage />} />
      </Route>
    </Routes>
  )
}

export default App
