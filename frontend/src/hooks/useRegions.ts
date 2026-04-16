import { useQuery } from "@tanstack/react-query"

import { getDashboardAiReports, getRegions } from "@/lib/api"
import type { DashboardAiReportsResponse, RegionalScore } from "@/types/polaris"

export const regionsQueryKey = ["regions"]

export function useRegions() {
  return useQuery<RegionalScore[]>({
    queryKey: regionsQueryKey,
    queryFn: getRegions,
    staleTime: 60_000,
  })
}

export function useDashboardAiReports(limit = 5) {
  return useQuery<DashboardAiReportsResponse>({
    queryKey: ["dashboard-ai-reports", limit],
    queryFn: () => getDashboardAiReports(limit),
    staleTime: 60_000,
  })
}
