import type {
  ActiveRegistration,
  ChatRequest,
  ChatResponse,
  DashboardAiReportsResponse,
  EventRegistration,
  GeneratePDSResponse,
  ProfileExtended,
  ProfileExtendedUpsert,
  PPSTRadar,
  RecommendedEvent,
  RegionalScore,
  RegisterEventRequest,
  RegistrationStatus,
  ReportGenerateRequest,
  ReportGenerateResponse,
  VerifyResponse,
} from "@/types/polaris"

const DEFAULT_BASE = "http://localhost:8000"

export const FRONTEND_PITCH_MODE =
  (import.meta.env.VITE_PITCH_MODE ?? "true").toLowerCase() === "true"

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE
  return raw.trim().replace(/\/$/, "")
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === "string") return detail
      if (Array.isArray(detail)) {
        return detail
          .map((item) =>
            typeof item === "object" && item !== null && "msg" in item
              ? String((item as { msg: unknown }).msg)
              : JSON.stringify(item),
          )
          .join("; ")
      }
      return JSON.stringify(detail)
    }
  } catch {
    /* non-JSON payload */
  }
  return res.statusText || `HTTP ${res.status}`
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!res.ok) throw new Error(await parseErrorMessage(res))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function chat(req: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(req),
  })
}

export function getRegions(): Promise<RegionalScore[]> {
  return apiFetch<RegionalScore[]>("/regions/")
}

export function getDashboardAiReports(limit = 5): Promise<DashboardAiReportsResponse> {
  const q = new URLSearchParams({ limit: String(limit) })
  return apiFetch<DashboardAiReportsResponse>(`/regions/dashboard-ai-reports?${q.toString()}`)
}

export function getNationalRadar(): Promise<PPSTRadar> {
  return apiFetch<PPSTRadar>("/intelligence/national-skill-radar")
}

export function generateReport(req: ReportGenerateRequest): Promise<ReportGenerateResponse> {
  return apiFetch<ReportGenerateResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(req),
  })
}

export function getRecommendedEvents(depedId: string): Promise<RecommendedEvent[]> {
  const q = new URLSearchParams({ deped_id: depedId })
  return apiFetch<RecommendedEvent[]>(`/events/recommended?${q.toString()}`)
}

export function registerForEvent(eventId: number, req: RegisterEventRequest): Promise<EventRegistration> {
  return apiFetch<EventRegistration>(`/events/${eventId}/register`, {
    method: "POST",
    body: JSON.stringify(req),
  })
}

export function verifyRegistration(regId: number): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>(`/registrations/${regId}/verify`, {
    method: "POST",
  })
}

export function generatePDS(regId: number): Promise<GeneratePDSResponse> {
  return apiFetch<GeneratePDSResponse>(`/registrations/${regId}/generate-pds`, {
    method: "POST",
  })
}

export function patchStatus(regId: number, status: RegistrationStatus): Promise<EventRegistration> {
  return apiFetch<EventRegistration>(`/registrations/${regId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function getActiveRegistrations(depedId: string): Promise<ActiveRegistration[]> {
  return apiFetch<ActiveRegistration[]>(
    `/teachers/${encodeURIComponent(depedId)}/active-registrations`,
  )
}

export function upsertProfileExtended(
  depedId: string,
  profile: ProfileExtendedUpsert,
): Promise<ProfileExtended> {
  return apiFetch<ProfileExtended>(
    `/teachers/${encodeURIComponent(depedId)}/profile-extended`,
    {
      method: "POST",
      body: JSON.stringify(profile),
    },
  )
}
