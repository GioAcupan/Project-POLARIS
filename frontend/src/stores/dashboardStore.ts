import { useSyncExternalStore } from "react"

import type { RegionalScore } from "@/types/polaris"

type DashboardState = {
  activeRegion: string | null
  regions: RegionalScore[]
}

type Listener = () => void

const listeners = new Set<Listener>()

let state: DashboardState = {
  activeRegion: null,
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
  setRegions(regions: RegionalScore[]) {
    setState({ regions })
  },
  reset() {
    state = {
      activeRegion: null,
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
