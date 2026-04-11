import type { ComponentType } from "react"

declare module "*.jsx"

declare module "@/pages/ReportGenerator" {
  const ReportGenerator: ComponentType
  export default ReportGenerator
}

declare module "@/components/starbot/Starbot" {
  const Starbot: ComponentType
  export default Starbot
}
