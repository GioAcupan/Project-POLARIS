// frontend/src/types/polaris.ts
// THE source of truth. Do not redefine these locally in components.

// ─────────────────────────────────────────────────────────────
// Region (unchanged from v3.1; included for completeness)
// ─────────────────────────────────────────────────────────────
export type TrafficLight = "green" | "yellow" | "red";

export interface RegionalScore {
  region: string;                          // e.g. "Region VIII"
  region_code: string;                     // e.g. "R8" (used in filenames)
  underserved_score: number;               // 0–100
  traffic_light: TrafficLight;
  supply_subscore: number;                 // 0–100
  impact_subscore: number;                 // 0–100
  demand_subscore: number;                 // 0–100
  teacher_student_ratio: number;
  specialization_pct: number;
  star_coverage_pct: number;
  avg_nat_score: number;
  // PPST axes (used by STARBOT context + reports)
  ppst_content_knowledge: number;
  ppst_curriculum_planning: number;
  ppst_research_based_practice: number;
  ppst_assessment_literacy: number;
  ppst_professional_development: number;
  // Demand
  demand_signal_count: number;
  // Critical pings (pre-computed)
  critical_pings?: CriticalPing[];
}

export interface CriticalPing {
  region: string;
  severity: "CRITICAL" | "WARNING" | "GAP";
  message: string;
}

// ─────────────────────────────────────────────────────────────
// STARBOT (simplified — query-only)
// ─────────────────────────────────────────────────────────────
export interface ChatRequest {
  message: string;                         // max 500 chars
  region_context: RegionalScore | null;
}

export interface ChatResponse {
  response: string;                        // markdown-formatted
  sources: string[];                       // e.g. ["POLARIS regional_scores — Region VIII"]
}

// ─────────────────────────────────────────────────────────────
// Report Generator
// ─────────────────────────────────────────────────────────────
export type ReportType =
  | "quarterly_performance"
  | "intervention_priority"
  | "executive_summary";

export interface ReportGenerateRequest {
  region: string;                          // must match RegionalScore.region
  report_type: ReportType;
}

export interface ReportGenerateResponse {
  markdown: string;
  filename: string;                        // e.g. "Quarterly_Report_R8.md"
  generated_at: string;                    // ISO 8601
}

// ─────────────────────────────────────────────────────────────
// Profile Extended (Tier 1)
// ─────────────────────────────────────────────────────────────
export type Sex = "Male" | "Female";
export type CivilStatus = "Single" | "Married" | "Separated" | "Widowed";

export interface ProfileExtended {
  deped_id: string;
  // Identity
  name_extension: string | null;           // "JR.", "SR.", "III"
  sex: Sex | null;
  date_of_birth: string | null;            // ISO date
  civil_status: CivilStatus | null;
  // Unmapped Tier 1 (collected, not yet written to PDS)
  place_of_birth: string | null;
  citizenship: string | null;              // default "Filipino"
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  // Contact
  mobile_number: string | null;
  telephone_number: string | null;
  email: string | null;
  // Permanent Address (7 structured fields)
  addr_house_no: string | null;
  addr_street: string | null;
  addr_subdivision: string | null;
  addr_barangay: string | null;
  addr_city: string | null;
  addr_province: string | null;
  addr_zip: string | null;                 // 4 digits
  // Metadata
  completeness_score: number;              // 0–100, motivational
  last_verified_at: string | null;
  updated_at: string;
}

export type ProfileExtendedUpsert = Omit<
  ProfileExtended,
  "deped_id" | "completeness_score" | "last_verified_at" | "updated_at"
>;

// The 9 fields that gate sign-up (must all be non-null)
export const REQUIRED_FOR_SIGNUP: (keyof ProfileExtended)[] = [
  "sex", "date_of_birth", "civil_status",
  "mobile_number", "email",
  "addr_barangay", "addr_city", "addr_province", "addr_zip",
];

// ─────────────────────────────────────────────────────────────
// Training Events
// ─────────────────────────────────────────────────────────────
export type EventSpecificFieldType = "text" | "select";

export interface EventSpecificFieldDef {
  key: string;
  label: string;
  type: EventSpecificFieldType;
  required: boolean;
  max_length?: number;                     // for type=text
  options?: string[];                      // for type=select
}

export type FormKey = "pds" | "authority_to_travel" | "csc_form_6" | "school_clearance";

export interface TrainingEvent {
  id: number;
  program_id: number;
  program_name: string;                    // joined from programs
  subject_area: string;                    // joined from programs

  title: string;
  organizer: string;
  venue: string | null;
  venue_region: string | null;
  start_date: string;                      // ISO date
  end_date: string;                        // ISO date
  registration_deadline: string;           // ISO date

  is_star_partnered: boolean;
  funding_source: string | null;
  required_forms: FormKey[];
  event_specific_fields: EventSpecificFieldDef[];

  description: string | null;
  capacity: number | null;
  slots_remaining: number | null;
}

export interface RecommendedEvent extends TrainingEvent {
  reason_chip: string;                     // e.g. "Closes your Assessment Literacy gap"
  is_eligible: boolean;                    // teacher has eligible nomination
  nomination_id: number | null;
}

// ─────────────────────────────────────────────────────────────
// Event Registrations + Status Machine
// ─────────────────────────────────────────────────────────────
export type RegistrationStatus =
  | "draft"
  | "forms_generated"
  | "submitted"
  | "approved"
  | "attended"
  | "completed"
  | "cancelled";

export interface EventRegistration {
  id: number;
  teacher_id: string;
  event_id: number;
  status: RegistrationStatus;
  event_specific_answers: Record<string, string>;
  nomination_id: number | null;
  generated_pds_path: string | null;
  generated_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  next_action: string;
  created_at: string;
  updated_at: string;
}

// Joined view used by Home tab tracking
export interface ActiveRegistration {
  id: number;
  status: RegistrationStatus;
  next_action: string;
  event: Pick<TrainingEvent,
    "id" | "title" | "organizer" | "venue" | "start_date" | "end_date">;
  submitted_at: string | null;
  approved_at: string | null;
  generated_at: string | null;
}

// ─────────────────────────────────────────────────────────────
// Sign-Up Flow Requests / Responses
// ─────────────────────────────────────────────────────────────
export interface RegisterEventRequest {
  deped_id: string;
  event_specific_answers: Record<string, string>;
}

export interface VerifyResponse {
  verified_at: string;
}

export interface GeneratePDSResponse {
  download_url: string;                    // /downloads/{reg_id}_pds.xlsx
  preview_image_url: string;               // /static/forms/demo_pds_preview.png
  generated_at: string;
  registration: EventRegistration;
}

export interface StatusPatchRequest {
  status: RegistrationStatus;
}

// ─────────────────────────────────────────────────────────────
// Allowed status transitions (enforce both client + server side)
// ─────────────────────────────────────────────────────────────
export const ALLOWED_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  draft:           ["forms_generated", "cancelled"],
  forms_generated: ["submitted", "cancelled"],
  submitted:       ["approved", "cancelled"],
  approved:        ["attended", "cancelled"],
  attended:        ["completed"],
  completed:       [],
  cancelled:       [],
};
