import { useQuery } from "@tanstack/react-query"

import { getNationalRadar } from "@/lib/api"

export const nationalRadarQueryKey = ["national-radar"]

export function useNationalRadar() {
  return useQuery({
    queryKey: nationalRadarQueryKey,
    queryFn: getNationalRadar,
    staleTime: 60_000,
  })
}
