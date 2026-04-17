import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Laptop, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AssignMode = "create" | "existing"
type Modality = "Face-to-Face" | "Online" | "Blended"

type ExistingModule = {
  id: string
  title: string
  host: string
  modality: Modality
  dateLabel: string
  cap: number
  assignedCount: number
  tags: string[]
}

type CreateForm = {
  title: string
  description: string
  trainingTypes: string[]
  trainingTypeInput: string
  host: string
  participantCap: string
  targetLevels: string[]
  subjectTags: string[]
  competencyFocus: string[]
  relevanceNote: string
}

type ModalError = Partial<Record<"title" | "description" | "host" | "participantCap" | "existingModule", string>>

type TrainingModuleAssignmentModalProps = {
  open: boolean
  selectedCount: number
  initialLevels: string[]
  initialSubjects: string[]
  onClose: () => void
  onConfirm: (payload: { mode: AssignMode; title: string }) => void
}

const TRAINING_TYPES = ["INSET", "LAC", "SLAC", "Division Training", "Webinar", "Research", "Biology", "STEM"]

const LEVEL_OPTIONS = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Master Teacher I",
  "Master Teacher II",
  "Master Teacher III",
  "Master Teacher IV",
]

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Earth Science",
  "General Science",
  "Environmental Science",
  "Robotics",
  "Engineering",
  "Technology",
  "ICT",
  "Programming",
  "Calculus",
  "Statistics",
  "Research",
  "STEM",
]

const COMPETENCY_OPTIONS = [
  "Content Knowledge",
  "Curriculum Planning",
  "Research-Based Practice",
  "Assessment Literacy",
  "Professional Development Goals",
]

const EXISTING_MODULES: ExistingModule[] = [
  {
    id: "mod-001",
    title: "Research Coaching for Science Teachers",
    host: "DepEd Region VIII",
    modality: "Online",
    dateLabel: "May 18-20, 2026",
    cap: 30,
    assignedCount: 18,
    tags: ["Research", "Biology", "STEM"],
  },
  {
    id: "mod-002",
    title: "AI in the STEM Classroom",
    host: "Division of Manila",
    modality: "Blended",
    dateLabel: "June 3-5, 2026",
    cap: 25,
    assignedCount: 11,
    tags: ["Programming", "Technology", "STEM"],
  },
  {
    id: "mod-003",
    title: "Mathematics Intervention Design Sprint",
    host: "DepEd Region XI",
    modality: "Online",
    dateLabel: "July 2-4, 2026",
    cap: 35,
    assignedCount: 9,
    tags: ["Mathematics", "Statistics", "Curriculum Planning"],
  },
  {
    id: "mod-004",
    title: "Environmental Science Fieldwork Planning",
    host: "DepEd MIMAROPA",
    modality: "Blended",
    dateLabel: "July 15-17, 2026",
    cap: 22,
    assignedCount: 14,
    tags: ["Environmental Science", "Biology", "Research"],
  },
]

function toggleValue(list: string[], value: string) {
  if (list.includes(value)) return list.filter((entry) => entry !== value)
  return [...list, value]
}

export function TrainingModuleAssignmentModal({
  open,
  selectedCount,
  initialLevels,
  initialSubjects,
  onClose,
  onConfirm,
}: TrainingModuleAssignmentModalProps) {
  const [mode, setMode] = useState<AssignMode>("create")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExistingId, setSelectedExistingId] = useState("")
  const [errors, setErrors] = useState<ModalError>({})
  const [form, setForm] = useState<CreateForm>({
    title: "",
    description: "",
    trainingTypes: [],
    trainingTypeInput: "",
    host: "",
    participantCap: "",
    targetLevels: [],
    subjectTags: [],
    competencyFocus: [],
    relevanceNote: "",
  })

  useEffect(() => {
    if (!open) return
    setMode("create")
    setSearchQuery("")
    setSelectedExistingId("")
    setErrors({})
    setForm({
      title: "",
      description: "",
      trainingTypes: [],
      trainingTypeInput: "",
      host: "",
      participantCap: String(selectedCount || ""),
      targetLevels: initialLevels,
      subjectTags: initialSubjects,
      competencyFocus: [...COMPETENCY_OPTIONS],
      relevanceNote: "",
    })
  }, [initialLevels, initialSubjects, open, selectedCount])

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return EXISTING_MODULES
    return EXISTING_MODULES.filter((module) =>
      `${module.title} ${module.host} ${module.tags.join(" ")} ${module.modality}`
        .toLowerCase()
        .includes(query),
    )
  }, [searchQuery])

  const isDirty = useMemo(() => {
    if (mode !== "create") return selectedExistingId.length > 0
    return Boolean(
      form.title.trim() ||
        form.description.trim() ||
        form.trainingTypes.length ||
        form.trainingTypeInput.trim() ||
        form.host.trim() ||
        form.relevanceNote.trim() ||
        Number(form.participantCap) !== selectedCount ||
        form.targetLevels.length !== initialLevels.length ||
        form.subjectTags.length !== initialSubjects.length,
    )
  }, [form, initialLevels.length, initialSubjects.length, mode, selectedCount, selectedExistingId.length])

  const selectedExistingModule = useMemo(
    () => EXISTING_MODULES.find((module) => module.id === selectedExistingId) ?? null,
    [selectedExistingId],
  )

  if (!open) return null

  const requestClose = () => {
    if (isDirty && !window.confirm("Discard changes?")) return
    onClose()
  }

  const assignDisabledForExisting =
    mode === "existing" &&
    (!selectedExistingModule || selectedExistingModule.cap - selectedExistingModule.assignedCount <= 0)

  const submit = () => {
    if (mode === "existing") {
      if (!selectedExistingModule) {
        setErrors({ existingModule: "Select a module to continue." })
        return
      }
      onConfirm({ mode: "existing", title: selectedExistingModule.title })
      return
    }

    const nextErrors: ModalError = {}
    if (!form.title.trim()) nextErrors.title = "Training title is required."
    if (!form.description.trim()) nextErrors.description = "Description is required."
    if (!form.host.trim()) nextErrors.host = "Host / organizer is required."
    const cap = Number(form.participantCap)
    if (!Number.isFinite(cap) || cap < 1) nextErrors.participantCap = "Participant cap must be at least 1."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onConfirm({ mode: "create", title: form.title.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-blue/55 p-0 md:p-6"
      onClick={(event) => {
        if (event.currentTarget === event.target) requestClose()
      }}
      role="presentation"
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[85vh] md:max-w-[640px] md:rounded-[24px] md:shadow-[0_24px_60px_rgba(26,94,168,0.24)]">
        <header className="border-b border-chart-highlight/50 px-4 pb-3 pt-5 md:px-[22px]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-brand-blue">
                Training Module Assignment
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {selectedCount} selected teachers ready for assignment
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="size-10 rounded-xl border-chart-highlight/80 p-0 text-brand-blue hover:bg-chart-primary/5"
              onClick={requestClose}
              aria-label="Close modal"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="inline-flex rounded-full bg-chart-primary/10 p-1">
            <button
              type="button"
              className={cn(
                "h-9 rounded-full px-5 text-[13px] font-bold transition",
                mode === "create"
                  ? "bg-white text-brand-blue shadow-[0_4px_12px_rgba(26,94,168,0.12)]"
                  : "text-muted-foreground hover:text-brand-blue",
              )}
              onClick={() => {
                setMode("create")
                setErrors({})
              }}
            >
              Create New Module
            </button>
            <button
              type="button"
              className={cn(
                "h-9 rounded-full px-5 text-[13px] font-bold transition",
                mode === "existing"
                  ? "bg-white text-brand-blue shadow-[0_4px_12px_rgba(26,94,168,0.12)]"
                  : "text-muted-foreground hover:text-brand-blue",
              )}
              onClick={() => {
                setMode("existing")
                setErrors({})
              }}
            >
              Select Existing Module
            </button>
          </div>
        </header>

        <div className="polaris-dashboard-scroll flex-1 overflow-y-auto px-4 py-0 md:px-[22px]">
          {mode === "create" ? (
            <div className="space-y-0 pb-4">
              <section className="border-b border-chart-highlight/40 py-[18px]">
                <h3 className="mb-[14px] text-xs font-extrabold uppercase tracking-[0.08em] text-brand-blue">
                  Section 1 - Basic Information
                </h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-[7px] block text-xs font-bold text-brand-blue">
                      Training Title <span className="text-brand-pink">*</span>
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className={cn(
                        "h-[42px] w-full rounded-xl border border-chart-highlight/70 bg-white px-3 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                        errors.title && "border-signal-critical",
                      )}
                      placeholder="AI in the STEM Classroom"
                    />
                    {errors.title ? <span className="mt-1 block text-sm text-signal-critical">{errors.title}</span> : null}
                  </label>

                  <label className="block">
                    <span className="mb-[7px] block text-xs font-bold text-brand-blue">
                      Description <span className="text-brand-pink">*</span>
                    </span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className={cn(
                        "w-full rounded-xl border border-chart-highlight/70 bg-white px-3 py-2.5 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                        errors.description && "border-signal-critical",
                      )}
                      rows={4}
                      placeholder="Brief overview of the training objectives"
                    />
                    {errors.description ? (
                      <span className="mt-1 block text-sm text-signal-critical">{errors.description}</span>
                    ) : null}
                  </label>

                  <div>
                    <span className="mb-[7px] block text-xs font-bold text-brand-blue">Training Type</span>
                    <div className="rounded-xl border border-chart-highlight/70 p-2">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {form.trainingTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 rounded-full bg-chart-primary/15 px-2.5 py-1 text-[11px] font-semibold text-chart-primary"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  trainingTypes: current.trainingTypes.filter((entry) => entry !== type),
                                }))
                              }
                              className="rounded-full p-0.5 hover:bg-chart-primary/20"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={form.trainingTypeInput}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, trainingTypeInput: event.target.value }))
                          }
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return
                            event.preventDefault()
                            const next = form.trainingTypeInput.trim()
                            if (!next || form.trainingTypes.includes(next)) return
                            setForm((current) => ({
                              ...current,
                              trainingTypes: [...current.trainingTypes, next],
                              trainingTypeInput: "",
                            }))
                          }}
                          className="h-[36px] flex-1 rounded-lg border border-chart-highlight/60 px-3 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40"
                          placeholder="Type and press Enter"
                        />
                        <Button
                          type="button"
                          className="h-[32px] rounded-[10px] bg-brand-blue px-4 text-xs font-bold text-white hover:bg-brand-blue/90"
                          onClick={() => {
                            const next = form.trainingTypeInput.trim()
                            if (!next || form.trainingTypes.includes(next)) return
                            setForm((current) => ({
                              ...current,
                              trainingTypes: [...current.trainingTypes, next],
                              trainingTypeInput: "",
                            }))
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {TRAINING_TYPES.filter((type) => !form.trainingTypes.includes(type)).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({ ...current, trainingTypes: [...current.trainingTypes, type] }))
                          }
                          className="rounded-full border border-dashed border-chart-highlight/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-chart-primary/70 hover:text-chart-primary"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-[7px] block text-xs font-bold text-brand-blue">
                      Host / Organizer <span className="text-brand-pink">*</span>
                    </span>
                    <input
                      value={form.host}
                      onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))}
                      className={cn(
                        "h-[42px] w-full rounded-xl border border-chart-highlight/70 bg-white px-3 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                        errors.host && "border-signal-critical",
                      )}
                      placeholder="Division of Manila"
                    />
                    {errors.host ? <span className="mt-1 block text-sm text-signal-critical">{errors.host}</span> : null}
                  </label>
                </div>
              </section>

              <section className="border-b border-chart-highlight/40 py-[18px]">
                <h3 className="mb-[14px] text-xs font-extrabold uppercase tracking-[0.08em] text-brand-blue">
                  Section 4 - Targeting & Capacity
                </h3>

                <div className="mb-4">
                  <span className="mb-2 block text-xs font-bold text-brand-blue">
                    Target Teacher Levels <span className="text-brand-pink">*</span>
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {LEVEL_OPTIONS.map((level) => {
                      const active = form.targetLevels.includes(level)
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              targetLevels: toggleValue(current.targetLevels, level),
                            }))
                          }
                          className={cn(
                            "h-[46px] rounded-xl border px-3 text-left text-[12px] font-semibold transition",
                            active
                              ? "border-chart-primary bg-chart-primary/15 text-brand-blue"
                              : "border-chart-highlight/80 bg-white text-brand-blue",
                          )}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="mb-2 block text-xs font-bold text-brand-blue">
                    Subject / Specialization Tags <span className="text-brand-pink">*</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_OPTIONS.map((subject) => {
                      const active = form.subjectTags.includes(subject)
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              subjectTags: toggleValue(current.subjectTags, subject),
                            }))
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-bold transition",
                            active
                              ? "border-chart-primary bg-chart-primary text-white"
                              : "border-chart-highlight/80 bg-white text-muted-foreground",
                          )}
                        >
                          {subject}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-[7px] block text-xs font-bold text-brand-blue">
                    Participant Cap <span className="text-brand-pink">*</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.participantCap}
                    onChange={(event) => setForm((current) => ({ ...current, participantCap: event.target.value }))}
                    className={cn(
                      "h-[42px] w-full max-w-[360px] rounded-xl border border-chart-highlight/70 bg-white px-3 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40",
                      errors.participantCap && "border-signal-critical",
                    )}
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    No additional teachers can be assigned once this cap is reached.
                  </p>
                  {errors.participantCap ? (
                    <span className="mt-1 block text-sm text-signal-critical">{errors.participantCap}</span>
                  ) : null}
                </label>
              </section>

              <section className="py-[18px]">
                <h3 className="mb-[14px] text-xs font-extrabold uppercase tracking-[0.08em] text-brand-blue">
                  Section 5 - Additional Details
                </h3>
                <div className="mb-4">
                  <span className="mb-2 block text-xs font-bold text-brand-blue">Competency Focus</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {COMPETENCY_OPTIONS.map((option) => {
                      const active = form.competencyFocus.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              competencyFocus: toggleValue(current.competencyFocus, option),
                            }))
                          }
                          className={cn(
                            "h-[46px] rounded-xl border px-3 text-left text-[12px] font-semibold transition",
                            active
                              ? "border-chart-primary bg-chart-primary/15 text-brand-blue"
                              : "border-chart-highlight/80 bg-white text-brand-blue",
                          )}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-[7px] block text-xs font-bold text-brand-blue">Relevance Note</span>
                  <textarea
                    value={form.relevanceNote}
                    onChange={(event) => setForm((current) => ({ ...current, relevanceNote: event.target.value }))}
                    className="w-full rounded-xl border border-chart-highlight/70 bg-white px-3 py-2.5 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40"
                    rows={3}
                    placeholder="This training addresses your Research Proficiency gap."
                  />
                </label>
              </section>
            </div>
          ) : (
            <div className="pb-4 pt-[18px]">
              <div className="mb-4">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-[42px] w-full rounded-xl border border-chart-highlight/70 bg-white px-3 text-[13px] text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/40"
                  placeholder="Search by training title, type, or host..."
                />
              </div>

              <div className="space-y-3">
                {filteredModules.map((module) => {
                  const selected = selectedExistingId === module.id
                  const remaining = Math.max(module.cap - module.assignedCount, 0)
                  const blocked = remaining < selectedCount
                  const progress = Math.min((module.assignedCount / module.cap) * 100, 100)

                  return (
                    <button
                      key={module.id}
                      type="button"
                      disabled={remaining === 0}
                      onClick={() => {
                        setSelectedExistingId(module.id)
                        setErrors({})
                      }}
                      className={cn(
                        "w-full rounded-[18px] border-[1.5px] p-[14px] text-left transition",
                        selected
                          ? "border-chart-primary bg-chart-primary/10"
                          : "border-chart-highlight/80 bg-white",
                        remaining === 0 && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[15px] font-extrabold text-brand-blue">{module.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{module.host}</p>
                        </div>
                        <span
                          className={cn(
                            "relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                            selected ? "border-chart-primary" : "border-chart-highlight",
                          )}
                        >
                          {selected ? <span className="size-2 rounded-full bg-chart-primary" /> : null}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Laptop className="size-[14px]" />
                          {module.modality}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-[14px]" />
                          {module.dateLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-brand-blue">
                        {remaining} / {module.cap} slots remaining
                      </p>
                      <div className="mt-2 h-2 w-full rounded-full bg-chart-highlight/35">
                        <div
                          className="h-full rounded-full bg-chart-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {module.tags.map((tag) => (
                          <span
                            key={`${module.id}-${tag}`}
                            className="rounded-full bg-chart-primary/15 px-2.5 py-1 text-[11px] font-semibold text-chart-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {blocked ? (
                        <p className="mt-2 text-[11px] font-semibold text-signal-critical">
                          This module only has {remaining} remaining slots for {selectedCount} selected teachers.
                        </p>
                      ) : null}
                    </button>
                  )
                })}
                {errors.existingModule ? (
                  <p className="text-sm font-semibold text-signal-critical">{errors.existingModule}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-chart-highlight/50 bg-white px-4 py-4 md:px-[22px]">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={requestClose}
              className="text-sm font-bold text-muted-foreground transition hover:text-brand-blue"
            >
              Cancel
            </button>
            <Button
              type="button"
              disabled={assignDisabledForExisting}
              onClick={submit}
              className="h-[46px] min-w-[210px] rounded-full bg-gradient-to-r from-brand-pink to-brand-baby-pink px-6 text-sm font-extrabold text-white hover:from-brand-pink/90 hover:to-brand-baby-pink/90 disabled:opacity-45"
            >
              Assign to {selectedCount} Teachers
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
