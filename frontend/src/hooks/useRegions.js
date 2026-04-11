import { useQuery } from "@tanstack/react-query"

import { getRegions } from "@/lib/api"

export const regionsQueryKey = ["regions"]

export function useRegions() {
  return useQuery({
    queryKey: regionsQueryKey,
    queryFn: getRegions,
  })
}
