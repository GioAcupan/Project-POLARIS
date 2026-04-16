import { useSyncExternalStore } from "react"

import type { PPSTRadar, RegionalScore } from "@/types/polaris"

export type DashboardLens = "overall" | "supply" | "demand" | "impact"

type NationalRadar = PPSTRadar

type DashboardState = {
  activeRegion: string | null
  activeLens: DashboardLens
  triggerFlyTo: boolean
  triggerResetToNational: boolean
  nationalRadar: NationalRadar | null
  regions: RegionalScore[]
}

type Listener = () => void

const listeners = new Set<Listener>()

let state: DashboardState = {
  activeRegion: null,
  activeLens: "overall",
  triggerFlyTo: false,
  triggerResetToNational: false,
  nationalRadar: null,
  regions: [],
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setState(next: Partial<DashboardState>) {
  state = { ...state, ...next }
  emitChange()
}

function getState(): DashboardState {
  return state
}

export const dashboardStore = {
  getState,
  setActiveRegion(region: string | null) {
    setState({ activeRegion: region })
  },
  setActiveLens(lens: DashboardLens) {
    setState({ activeLens: lens })
  },
  setTriggerFlyTo(triggerFlyTo: boolean) {
    setState({ triggerFlyTo })
  },
  setTriggerResetToNational(triggerResetToNational: boolean) {
    setState({ triggerResetToNational })
  },
  setNationalRadar(nationalRadar: NationalRadar | null) {
    setState({ nationalRadar })
  },
  setRegions(regions: RegionalScore[]) {
    setState({ regions })
  },
  reset() {
    state = {
      activeRegion: null,
      activeLens: "overall",
      triggerFlyTo: false,
      triggerResetToNational: false,
      nationalRadar: null,
      regions: [],
    }
    emitChange()
  },
}

export function useDashboardStore<T>(selector: (snapshot: DashboardState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}
