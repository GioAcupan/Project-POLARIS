declare module "*.jsx"

declare module "@/pages/ReportGenerator" {
  const ReportGenerator: import("react").ComponentType
  export default ReportGenerator
}

declare module "@/components/starbot/Starbot" {
  const Starbot: import("react").ComponentType
  export default Starbot
}
