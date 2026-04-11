import { useQuery } from "@tanstack/react-query"

import { getRegions } from "@/lib/api"
import type { RegionalScore } from "@/types/polaris"

export const regionsQueryKey = ["regions"]

export function useRegions() {
  return useQuery<RegionalScore[]>({
    queryKey: regionsQueryKey,
    queryFn: getRegions,
    staleTime: 60_000,
  })
}
