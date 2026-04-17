import { useMemo, useState } from "react"
import { Filter, Shuffle, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Teacher = {
  id: number
  firstName: string
  lastName: string
  position: string
  school: string
  regionCode: string
  tags: string[]
  score: number
}

type SortMode = "highToLow" | "lowToHigh" | "random"

type AssignmentFilters = {
  minParticipants: string
  maxParticipants: string
  selectedCompetencies: string[]
  selectedLevels: string[]
  selectedSubjects: string[]
  selectedRegion: string
  schoolQuery: string
  sortMode: SortMode
  randomSeed: number
}

type TeacherAssignmentProps = {
  onAssignTeachers?: (teacherIds: number[]) => void
}

const COMPETENCY_MAP: Record<string, string[]> = {
  "Content Knowledge": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Earth Science",
    "General Science",
    "Calculus",
    "STEM",
  ],
  "Curriculum Planning": [
    "Biology",
    "Chemistry",
    "General Science",
    "Environmental Science",
    "STEM",
  ],
  "Research-Based Practice": ["Research", "Statistics", "STEM"],
  "Assessment Literacy": ["Mathematics", "Statistics", "Calculus", "Research"],
  "Professional Development Goals": [
    "Technology",
    "ICT",
    "Programming",
    "Robotics",
    "Engineering",
  ],
}

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

const LEVEL_OPTIONS = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Master Teacher I",
  "Master Teacher II",
]

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "NCR", label: "NCR" },
  { value: "CAR", label: "CAR" },
  { value: "I", label: "I (Ilocos Region)" },
  { value: "II", label: "II (Cagayan Valley)" },
  { value: "III", label: "III (Central Luzon)" },
  { value: "IV-A", label: "IV-A (CALABARZON)" },
  { value: "IV-B", label: "IV-B (MIMAROPA)" },
  { value: "V", label: "V (Bicol Region)" },
  { value: "VI", label: "VI (Western Visayas)" },
  { value: "VII", label: "VII (Central Visayas)" },
  { value: "VIII", label: "VIII (Eastern Visayas)" },
  { value: "IX", label: "IX (Zamboanga Peninsula)" },
  { value: "X", label: "X (Northern Mindanao)" },
  { value: "XI", label: "XI (Davao Region)" },
  { value: "XII", label: "XII (SOCCSKSARGEN)" },
  { value: "XIII", label: "XIII (Caraga)" },
  { value: "BARMM", label: "BARMM" },
]

const MOCK_TEACHERS: Teacher[] = [
  {
    id: 1,
    firstName: "Franchezca",
    lastName: "Banayad",
    position: "Teacher III",
    school: "Manila Science High School",
    regionCode: "NCR",
    tags: ["Programming", "Calculus", "Physics"],
    score: 82,
  },
  {
    id: 2,
    firstName: "Renato",
    lastName: "Cruz",
    position: "Master Teacher II",
    school: "Makati Science High School",
    regionCode: "NCR",
    tags: ["Mathematics", "STEM", "Physics"],
    score: 85,
  },
  {
    id: 3,
    firstName: "Ana",
    lastName: "Reyes",
    position: "Teacher III",
    school: "Quezon City Science High School",
    regionCode: "NCR",
    tags: ["Biology", "Chemistry"],
    score: 79,
  },
  {
    id: 4,
    firstName: "Gloria",
    lastName: "Dela Cruz",
    position: "Master Teacher I",
    school: "Pasig City Science High School",
    regionCode: "NCR",
    tags: ["Research", "Statistics", "STEM"],
    score: 91,
  },
  {
    id: 5,
    firstName: "Maria",
    lastName: "Santos",
    position: "Master Teacher II",
    school: "Taguig Science High School",
    regionCode: "NCR",
    tags: ["Robotics", "Engineering", "Technology"],
    score: 87,
  },
  {
    id: 6,
    firstName: "Noel",
    lastName: "Dizon",
    position: "Teacher II",
    school: "Caloocan City Science High School",
    regionCode: "NCR",
    tags: ["Mathematics", "Statistics"],
    score: 68,
  },
  {
    id: 7,
    firstName: "Alvin",
    lastName: "Villafuerte",
    position: "Teacher I",
    school: "Marikina Science High School",
    regionCode: "NCR",
    tags: ["ICT", "Programming"],
    score: 90,
  },
  {
    id: 8,
    firstName: "Wilfredo",
    lastName: "Baccay",
    position: "Teacher III",
    school: "Baguio City National High School",
    regionCode: "CAR",
    tags: ["Physics", "Calculus"],
    score: 83,
  },
  {
    id: 9,
    firstName: "Mary Ann",
    lastName: "Tagel",
    position: "Teacher II",
    school: "Benguet State Laboratory School",
    regionCode: "CAR",
    tags: ["Environmental Science", "Biology"],
    score: 66,
  },
  {
    id: 10,
    firstName: "Romeo",
    lastName: "Pascual",
    position: "Teacher II",
    school: "Ilocos Norte National High School",
    regionCode: "I",
    tags: ["Technology", "ICT"],
    score: 76,
  },
  {
    id: 11,
    firstName: "Benjamin",
    lastName: "Macaraeg",
    position: "Teacher II",
    school: "San Fernando City Science High School",
    regionCode: "I",
    tags: ["Physics", "Engineering"],
    score: 71,
  },
  {
    id: 12,
    firstName: "Loreta",
    lastName: "Cabanayan",
    position: "Teacher I",
    school: "La Union Integrated School",
    regionCode: "I",
    tags: ["Biology", "General Science"],
    score: 62,
  },
  {
    id: 13,
    firstName: "Eduardo",
    lastName: "Ramos",
    position: "Teacher I",
    school: "Tuguegarao National High School",
    regionCode: "II",
    tags: ["Earth Science", "General Science"],
    score: 52,
  },
  {
    id: 14,
    firstName: "Wilhelmina",
    lastName: "Espinosa",
    position: "Teacher II",
    school: "Cagayan National High School",
    regionCode: "II",
    tags: ["Biology", "Research"],
    score: 63,
  },
  {
    id: 15,
    firstName: "Emmanuel",
    lastName: "Ocampo",
    position: "Teacher III",
    school: "Angeles City Science High School",
    regionCode: "III",
    tags: ["Chemistry", "Research"],
    score: 84,
  },
  {
    id: 16,
    firstName: "Lilibeth",
    lastName: "Aquino",
    position: "Teacher I",
    school: "Tarlac National High School",
    regionCode: "III",
    tags: ["Biology", "General Science"],
    score: 44,
  },
  {
    id: 17,
    firstName: "Nena",
    lastName: "Baluyot",
    position: "Master Teacher I",
    school: "Bulacan State Laboratory High School",
    regionCode: "III",
    tags: ["Chemistry", "Research", "STEM"],
    score: 86,
  },
  {
    id: 18,
    firstName: "Juan",
    lastName: "Dela Cruz",
    position: "Teacher I",
    school: "Batangas National High School",
    regionCode: "IV-A",
    tags: ["Environmental Science", "Biology"],
    score: 64,
  },
  {
    id: 19,
    firstName: "Erlinda",
    lastName: "Soriano",
    position: "Teacher II",
    school: "Batangas City Integrated High School",
    regionCode: "IV-A",
    tags: ["Biology", "Environmental Science"],
    score: 61,
  },
  {
    id: 20,
    firstName: "Renaldo",
    lastName: "Mendez",
    position: "Master Teacher II",
    school: "Cavite Science Integrated School",
    regionCode: "IV-A",
    tags: ["Robotics", "STEM", "Engineering"],
    score: 83,
  },
  {
    id: 21,
    firstName: "Cheryl",
    lastName: "Lacuesta",
    position: "Teacher I",
    school: "Rizal National High School",
    regionCode: "IV-A",
    tags: ["Mathematics", "Statistics"],
    score: 55,
  },
  {
    id: 22,
    firstName: "Danilo",
    lastName: "Atienza",
    position: "Teacher I",
    school: "Puerto Princesa City National High School",
    regionCode: "IV-B",
    tags: ["Earth Science", "Environmental Science"],
    score: 49,
  },
  {
    id: 23,
    firstName: "Maureen",
    lastName: "Valdez",
    position: "Teacher III",
    school: "Oriental Mindoro National High School",
    regionCode: "IV-B",
    tags: ["Biology", "General Science"],
    score: 74,
  },
  {
    id: 24,
    firstName: "Gilbert",
    lastName: "Macapagal",
    position: "Teacher I",
    school: "Legazpi City National High School",
    regionCode: "V",
    tags: ["Earth Science", "General Science"],
    score: 46,
  },
  {
    id: 25,
    firstName: "Honeylyn",
    lastName: "Abella",
    position: "Teacher II",
    school: "Camarines Sur Science High School",
    regionCode: "V",
    tags: ["Biology", "Research"],
    score: 73,
  },
  {
    id: 26,
    firstName: "Carlo",
    lastName: "Villanueva",
    position: "Teacher II",
    school: "Iloilo National High School",
    regionCode: "VI",
    tags: ["Mathematics", "Physics", "Calculus"],
    score: 58,
  },
  {
    id: 27,
    firstName: "Michelle",
    lastName: "Gerona",
    position: "Teacher I",
    school: "Roxas City National High School",
    regionCode: "VI",
    tags: ["ICT", "Technology"],
    score: 65,
  },
  {
    id: 28,
    firstName: "Orlando",
    lastName: "Jabagat",
    position: "Master Teacher I",
    school: "Bacolod City National High School",
    regionCode: "VI",
    tags: ["STEM", "Research", "Statistics"],
    score: 88,
  },
  {
    id: 29,
    firstName: "Miguel",
    lastName: "Reyes",
    position: "Teacher II",
    school: "Cebu City Science High School",
    regionCode: "VII",
    tags: ["Programming", "Calculus", "Physics"],
    score: 72,
  },
  {
    id: 30,
    firstName: "Teresa",
    lastName: "Gutierrez",
    position: "Teacher III",
    school: "Bohol Integrated School",
    regionCode: "VII",
    tags: ["Biology", "General Science"],
    score: 66,
  },
  {
    id: 31,
    firstName: "Kristine",
    lastName: "Ybanez",
    position: "Teacher I",
    school: "Dumaguete City Science High School",
    regionCode: "VII",
    tags: ["Chemistry", "Biology"],
    score: 54,
  },
  {
    id: 32,
    firstName: "Danica",
    lastName: "Alvero",
    position: "Teacher III",
    school: "Eastern Visayas Regional Science High School",
    regionCode: "VIII",
    tags: ["Mathematics", "Statistics"],
    score: 80,
  },
  {
    id: 33,
    firstName: "Marvin",
    lastName: "Abad",
    position: "Teacher II",
    school: "Tacloban City National High School",
    regionCode: "VIII",
    tags: ["Environmental Science", "Biology"],
    score: 62,
  },
  {
    id: 34,
    firstName: "Antonio",
    lastName: "Lopez",
    position: "Teacher I",
    school: "Zamboanga del Sur National High School",
    regionCode: "IX",
    tags: ["General Science"],
    score: 48,
  },
  {
    id: 35,
    firstName: "Crispin",
    lastName: "Salvador",
    position: "Master Teacher II",
    school: "Zamboanga City Science High School",
    regionCode: "IX",
    tags: ["Mathematics", "STEM"],
    score: 89,
  },
  {
    id: 36,
    firstName: "Rochelle",
    lastName: "Matalang",
    position: "Teacher II",
    school: "Pagadian City Integrated School",
    regionCode: "IX",
    tags: ["ICT", "Technology"],
    score: 67,
  },
  {
    id: 37,
    firstName: "Geraldine",
    lastName: "Busa",
    position: "Teacher II",
    school: "Cagayan de Oro National High School",
    regionCode: "X",
    tags: ["Physics", "STEM"],
    score: 70,
  },
  {
    id: 38,
    firstName: "Victor",
    lastName: "Anonas",
    position: "Teacher III",
    school: "Bukidnon Science High School",
    regionCode: "X",
    tags: ["Environmental Science", "Research"],
    score: 76,
  },
  {
    id: 39,
    firstName: "Priscilla",
    lastName: "Abao",
    position: "Teacher I",
    school: "Iligan City East National High School",
    regionCode: "X",
    tags: ["Biology", "General Science"],
    score: 53,
  },
  {
    id: 40,
    firstName: "Luisa",
    lastName: "Marquez",
    position: "Master Teacher I",
    school: "Davao City National High School",
    regionCode: "XI",
    tags: ["Technology", "Engineering"],
    score: 88,
  },
  {
    id: 41,
    firstName: "Melchor",
    lastName: "Sarmiento",
    position: "Teacher II",
    school: "Tagum National Comprehensive High School",
    regionCode: "XI",
    tags: ["Calculus", "Mathematics"],
    score: 69,
  },
  {
    id: 42,
    firstName: "Joel",
    lastName: "Tamayo",
    position: "Teacher III",
    school: "Koronadal National Comprehensive High School",
    regionCode: "XII",
    tags: ["Chemistry", "Research"],
    score: 75,
  },
  {
    id: 43,
    firstName: "April Mae",
    lastName: "Sumagul",
    position: "Teacher II",
    school: "Kidapawan City Science High School",
    regionCode: "XII",
    tags: ["Mathematics", "Physics"],
    score: 72,
  },
  {
    id: 44,
    firstName: "Rodelyn",
    lastName: "Palao",
    position: "Teacher I",
    school: "General Santos City High School",
    regionCode: "XII",
    tags: ["General Science", "Biology"],
    score: 57,
  },
  {
    id: 45,
    firstName: "Reniel",
    lastName: "Quimno",
    position: "Teacher I",
    school: "Butuan City School of Arts and Trades",
    regionCode: "XIII",
    tags: ["Technology", "ICT"],
    score: 60,
  },
  {
    id: 46,
    firstName: "Hazel",
    lastName: "Jamero",
    position: "Teacher III",
    school: "Surigao del Norte National High School",
    regionCode: "XIII",
    tags: ["Environmental Science", "Biology"],
    score: 74,
  },
  {
    id: 47,
    firstName: "Paolo",
    lastName: "Seronay",
    position: "Teacher II",
    school: "Bislig City National High School",
    regionCode: "XIII",
    tags: ["Engineering", "Robotics"],
    score: 78,
  },
  {
    id: 48,
    firstName: "Farida",
    lastName: "Ampatuan",
    position: "Teacher I",
    school: "Lamitan City National High School",
    regionCode: "BARMM",
    tags: ["General Science", "Biology"],
    score: 47,
  },
  {
    id: 49,
    firstName: "Jamaloden",
    lastName: "Macaraya",
    position: "Teacher II",
    school: "Marawi City National High School",
    regionCode: "BARMM",
    tags: ["Mathematics", "Statistics"],
    score: 59,
  },
  {
    id: 50,
    firstName: "Hadja",
    lastName: "Salik",
    position: "Master Teacher I",
    school: "Maguindanao Integrated School",
    regionCode: "BARMM",
    tags: ["Research", "STEM"],
    score: 81,
  },
]

const DEFAULT_FILTERS: AssignmentFilters = {
  minParticipants: "",
  maxParticipants: "",
  selectedCompetencies: Object.keys(COMPETENCY_MAP),
  selectedLevels: LEVEL_OPTIONS,
  selectedSubjects: [],
  selectedRegion: "all",
  schoolQuery: "",
  sortMode: "highToLow",
  randomSeed: 0,
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.trim().charAt(0)
  const lastInitial = lastName.trim().charAt(0)
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

function getScoreMeta(score: number) {
  if (score >= 75) {
    return { label: "Strong", colorClass: "text-signal-good", dotClass: "bg-signal-good" }
  }
  if (score >= 55) {
    return {
      label: "Developing",
      colorClass: "text-signal-warning",
      dotClass: "bg-signal-warning",
    }
  }
  return {
    label: "Needs Support",
    colorClass: "text-signal-critical",
    dotClass: "bg-signal-critical",
  }
}

function shuffleWithSeed<T>(list: T[], seed: number): T[] {
  if (list.length <= 1) return list
  const next = [...list]
  let randomSeed = seed || 1
  const random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

export default function TeacherAssignment({
  onAssignTeachers = () => undefined,
}: TeacherAssignmentProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [subjectQuery, setSubjectQuery] = useState("")
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<number>>(new Set())

  const filteredTeachers = useMemo(() => {
    const normalizedSchoolQuery = appliedFilters.schoolQuery.trim().toLowerCase()
    const selectedCompetencies = appliedFilters.selectedCompetencies
    const selectedSubjects = appliedFilters.selectedSubjects

    let next = MOCK_TEACHERS.filter((teacher) => {
      const competencyPasses =
        selectedCompetencies.length > 0 &&
        selectedCompetencies.some((competency) =>
          teacher.tags.some((tag) => COMPETENCY_MAP[competency]?.includes(tag)),
        )
      const levelPasses = appliedFilters.selectedLevels.includes(teacher.position)
      const subjectPasses =
        selectedSubjects.length === 0 ||
        teacher.tags.some((tag) => selectedSubjects.includes(tag))
      const regionPasses =
        appliedFilters.selectedRegion === "all" ||
        teacher.regionCode === appliedFilters.selectedRegion
      const schoolPasses =
        normalizedSchoolQuery.length === 0 ||
        teacher.school.toLowerCase().includes(normalizedSchoolQuery)

      return competencyPasses && levelPasses && subjectPasses && regionPasses && schoolPasses
    })

    if (appliedFilters.sortMode === "highToLow") {
      next = [...next].sort((a, b) => b.score - a.score)
    } else if (appliedFilters.sortMode === "lowToHigh") {
      next = [...next].sort((a, b) => a.score - b.score)
    } else {
      next = shuffleWithSeed(next, appliedFilters.randomSeed)
    }

    let minParticipants = parsePositiveInt(appliedFilters.minParticipants)
    let maxParticipants = parsePositiveInt(appliedFilters.maxParticipants)

    if (minParticipants && maxParticipants && minParticipants > maxParticipants) {
      ;[minParticipants, maxParticipants] = [maxParticipants, minParticipants]
    }

    if (minParticipants && maxParticipants) {
      const startIndex = Math.max(minParticipants - 1, 0)
      return next.slice(startIndex, Math.max(startIndex, maxParticipants))
    }

    if (maxParticipants) {
      return next.slice(0, maxParticipants)
    }

    if (minParticipants && next.length < minParticipants) {
      return []
    }

    return next
  }, [appliedFilters])

  const visibleTeacherIds = useMemo(
    () => new Set(filteredTeachers.map((teacher) => teacher.id)),
    [filteredTeachers],
  )

  const selectedVisibleCount = useMemo(
    () =>
      filteredTeachers.reduce(
        (total, teacher) => total + (selectedTeacherIds.has(teacher.id) ? 1 : 0),
        0,
      ),
    [filteredTeachers, selectedTeacherIds],
  )

  const allVisibleSelected =
    filteredTeachers.length > 0 && selectedVisibleCount === filteredTeachers.length
  const hasVisibleSelection = selectedVisibleCount > 0

  const filteredSubjectOptions = useMemo(() => {
    const normalizedQuery = subjectQuery.trim().toLowerCase()
    if (!normalizedQuery) return SUBJECT_OPTIONS
    return SUBJECT_OPTIONS.filter((subject) => subject.toLowerCase().includes(normalizedQuery))
  }, [subjectQuery])

  const activeSelectedIds = useMemo(
    () => [...selectedTeacherIds].filter((id) => visibleTeacherIds.has(id)),
    [selectedTeacherIds, visibleTeacherIds],
  )

  const updateDraftFilters = <K extends keyof AssignmentFilters>(
    key: K,
    value: AssignmentFilters[K],
  ) => {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const toggleDraftItem = (
    key: "selectedCompetencies" | "selectedLevels" | "selectedSubjects",
    value: string,
  ) => {
    setDraftFilters((current) => {
      const source = current[key]
      const next = source.includes(value)
        ? source.filter((entry) => entry !== value)
        : [...source, value]
      return { ...current, [key]: next }
    })
  }

  const applyFilters = () => {
    setAppliedFilters({
      ...draftFilters,
      randomSeed: Date.now(),
    })
    setSelectedTeacherIds((current) => {
      const next = new Set<number>()
      current.forEach((id) => {
        if (visibleTeacherIds.has(id)) next.add(id)
      })
      return next
    })
  }

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setSelectedTeacherIds(new Set())
    setSubjectQuery("")
  }

  const toggleSelection = (teacherId: number) => {
    if (!visibleTeacherIds.has(teacherId)) return
    setSelectedTeacherIds((current) => {
      const next = new Set(current)
      if (next.has(teacherId)) {
        next.delete(teacherId)
      } else {
        next.add(teacherId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedTeacherIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        filteredTeachers.forEach((teacher) => next.delete(teacher.id))
      } else {
        filteredTeachers.forEach((teacher) => next.add(teacher.id))
      }
      return next
    })
  }

  const handleAssignSelected = () => {
    if (activeSelectedIds.length === 0) return
    onAssignTeachers(activeSelectedIds)
  }

  const handleAssignSingleTeacher = (teacherId: number) => {
    setSelectedTeacherIds((current) => {
      const next = new Set(current)
      next.add(teacherId)
      return next
    })
    onAssignTeachers([teacherId])
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-6 bg-white pb-0">
      <header className="flex items-start justify-between gap-4 rounded-2xl border border-chart-primary/20 bg-chart-primary/10 px-5 py-4">
        <div>
          <h1 className="font-heading text-display-dashboard font-extrabold text-brand-blue">
            Teacher Assignment System
          </h1>
          <p className="mt-1 text-content text-muted-foreground">
            Showing {filteredTeachers.length} of {MOCK_TEACHERS.length} teachers
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          className="gap-2 border border-brand-blue bg-brand-blue text-white hover:bg-brand-blue/90"
          onClick={() => setIsFilterOpen((current) => !current)}
        >
          <SlidersHorizontal className="size-4" />
          Filter
        </Button>
      </header>

      <div className="polaris-dashboard-scroll flex h-[800px] min-h-0 gap-card-gap overflow-y-auto">
        <section className="min-h-0 min-w-0 flex-1">
          {filteredTeachers.length === 0 ? (
            <div className="flex h-full min-h-52 items-center justify-center rounded-md border border-dashed border-chart-highlight/70 p-8 text-center text-content text-muted-foreground">
              No teachers match the current filter settings.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedTeacherIds.has(teacher.id)
                const scoreMeta = getScoreMeta(teacher.score)

                return (
                  <article
                    key={teacher.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSelection(teacher.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        toggleSelection(teacher.id)
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer flex-col gap-3 rounded-[16px] border border-l-4 p-4 transition-all duration-200 ease-in-out",
                      "border-chart-highlight/70 border-l-brand-pink bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-chart-primary",
                      isSelected && "border-brand-pink/80 bg-brand-pink/5",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(teacher.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${teacher.firstName} ${teacher.lastName}`}
                      className="absolute right-4 top-4 size-4 rounded border border-chart-highlight/70 bg-white accent-brand-pink"
                    />

                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-brand-baby-pink text-sm font-semibold text-brand-blue">
                        {getInitials(teacher.firstName, teacher.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-blue">
                          <span>{teacher.firstName}</span>{" "}
                          <span style={{ filter: "blur(5px)" }}>{teacher.lastName}</span>
                        </p>
                        <span className="mt-1 inline-flex rounded-full border border-chart-primary/35 bg-chart-primary/15 px-2 py-0.5 text-xs font-semibold text-chart-primary">
                          {teacher.position}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">{teacher.school}</p>

                    <p className="text-xs text-muted-foreground">
                      Region: <span className="font-semibold text-brand-blue">{teacher.regionCode}</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {teacher.tags.map((tag) => (
                        <span
                          key={`${teacher.id}-${tag}`}
                          className="rounded-full bg-chart-primary/15 px-2 py-0.5 text-[11px] font-medium text-chart-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("inline-flex size-2.5 rounded-full", scoreMeta.dotClass)} />
                      <span className="text-muted-foreground">Priority score:</span>
                      <span className={cn("font-semibold", scoreMeta.colorClass)}>
                        {teacher.score} ({scoreMeta.label})
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="mt-auto h-11 w-full rounded-[22px] bg-gradient-to-r from-brand-pink to-brand-baby-pink text-white hover:from-brand-pink/90 hover:to-brand-baby-pink/90"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleAssignSingleTeacher(teacher.id)
                      }}
                    >
                      Assign
                    </Button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {isFilterOpen ? (
          <aside className="flex min-h-0 w-[330px] shrink-0 flex-col border-l border-chart-highlight/70 pl-6 pr-5 pb-5 pt-0">
            <div className="sticky top-0 z-20 -mx-5 mb-4 border-b border-chart-highlight/70 bg-white/95 px-5 pb-3 pt-2 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Filter className="size-4 shrink-0 text-brand-blue" />
                  <p className="truncate text-sm font-semibold uppercase tracking-wide text-brand-blue">
                    Filter
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 whitespace-nowrap px-2 text-[11px] bg-gradient-to-r from-brand-pink to-brand-baby-pink text-white hover:from-brand-pink/90 hover:to-brand-baby-pink/90"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 whitespace-nowrap px-2 text-[11px] border-brand-blue text-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5 pb-4">
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                  Number of Participants
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={draftFilters.minParticipants}
                    onChange={(event) => updateDraftFilters("minParticipants", event.target.value)}
                    placeholder="MIN"
                    className="h-9 w-full rounded-lg border border-chart-highlight/70 bg-white px-3 text-sm text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/50"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    min={1}
                    value={draftFilters.maxParticipants}
                    onChange={(event) => updateDraftFilters("maxParticipants", event.target.value)}
                    placeholder="MAX"
                    className="h-9 w-full rounded-lg border border-chart-highlight/70 bg-white px-3 text-sm text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/50"
                  />
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                  Competency Area
                </h2>
                {Object.keys(COMPETENCY_MAP).map((competency) => (
                  <label key={competency} className="flex items-start gap-2 text-sm text-brand-blue">
                    <input
                      type="checkbox"
                      checked={draftFilters.selectedCompetencies.includes(competency)}
                      onChange={() => toggleDraftItem("selectedCompetencies", competency)}
                      className="mt-0.5 size-4 accent-chart-primary"
                    />
                    <span>{competency}</span>
                  </label>
                ))}
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                  Teacher Level
                </h2>
                {LEVEL_OPTIONS.map((level) => (
                  <label key={level} className="flex items-start gap-2 text-sm text-brand-blue">
                    <input
                      type="checkbox"
                      checked={draftFilters.selectedLevels.includes(level)}
                      onChange={() => toggleDraftItem("selectedLevels", level)}
                      className="mt-0.5 size-4 accent-chart-primary"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                  Subject / Specialization
                </h2>
                <input
                  type="text"
                  value={subjectQuery}
                  onChange={(event) => setSubjectQuery(event.target.value)}
                  placeholder="Search subjects..."
                  className="h-9 w-full rounded-lg border border-chart-highlight/70 bg-white px-3 text-sm text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/50"
                />
                <div className="flex flex-wrap gap-1.5 pr-1">
                  {filteredSubjectOptions.map((subject) => {
                    const selected = draftFilters.selectedSubjects.includes(subject)
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleDraftItem("selectedSubjects", subject)}
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border-chart-primary bg-chart-primary text-white"
                            : "border-chart-highlight/70 bg-white text-brand-blue hover:border-chart-primary/70 hover:text-chart-primary",
                        )}
                      >
                        {subject}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Region</h2>
                <select
                  value={draftFilters.selectedRegion}
                  onChange={(event) => updateDraftFilters("selectedRegion", event.target.value)}
                  className="h-9 w-full rounded-lg border border-chart-highlight/70 bg-white px-3 text-sm text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/50"
                >
                  {REGION_OPTIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">School</h2>
                <input
                  type="text"
                  value={draftFilters.schoolQuery}
                  onChange={(event) => updateDraftFilters("schoolQuery", event.target.value)}
                  placeholder="Search school name..."
                  className="h-9 w-full rounded-lg border border-chart-highlight/70 bg-white px-3 text-sm text-brand-blue outline-none transition focus-visible:ring-2 focus-visible:ring-chart-primary/50"
                />
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                  Priority Sort
                </h2>
                <label className="flex items-center gap-2 text-sm text-brand-blue">
                  <input
                    type="radio"
                    name="priority-sort"
                    checked={draftFilters.sortMode === "highToLow"}
                    onChange={() => updateDraftFilters("sortMode", "highToLow")}
                    className="size-4 accent-chart-primary"
                  />
                  <span>High - Low</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-blue">
                  <input
                    type="radio"
                    name="priority-sort"
                    checked={draftFilters.sortMode === "lowToHigh"}
                    onChange={() => updateDraftFilters("sortMode", "lowToHigh")}
                    className="size-4 accent-chart-primary"
                  />
                  <span>Low - High</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-blue">
                  <input
                    type="radio"
                    name="priority-sort"
                    checked={draftFilters.sortMode === "random"}
                    onChange={() => updateDraftFilters("sortMode", "random")}
                    className="size-4 accent-chart-primary"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    Random <Shuffle className="size-3.5" />
                  </span>
                </label>
              </section>
            </div>

          </aside>
        ) : null}
      </div>

      <footer className="fixed bottom-0 left-[72px] right-0 z-30 border-t border-chart-highlight/70 bg-white px-6 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            <strong className="font-semibold text-brand-blue">{selectedVisibleCount}</strong> of{" "}
            {filteredTeachers.length} teachers selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "relative h-10 min-w-[168px] justify-center rounded-[22px] border px-6 text-sm font-semibold shadow-none transition-colors",
                hasVisibleSelection
                  ? "border-brand-blue !bg-brand-blue text-white hover:!bg-brand-blue/90 hover:text-white"
                  : "border-brand-blue !bg-white text-brand-blue hover:!bg-brand-blue/5 hover:text-brand-blue",
              )}
              disabled={filteredTeachers.length === 0}
              onClick={handleSelectAll}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-4 inline-flex size-4 items-center justify-center rounded-[3px] border border-dashed",
                  hasVisibleSelection ? "border-white/85" : "border-brand-blue",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-[2px]",
                    hasVisibleSelection ? "bg-white/90" : "bg-brand-blue/90",
                  )}
                />
              </span>
              <span aria-hidden className="absolute right-4 size-4" />
              <span className="w-full text-center leading-none">
                {allVisibleSelected ? "Deselect All" : "Select All"}
              </span>
            </Button>
            <Button
              type="button"
              className="h-10 min-w-[168px] justify-center rounded-[22px] bg-gradient-to-r from-brand-pink to-brand-baby-pink px-6 text-sm font-semibold text-white hover:from-brand-pink/90 hover:to-brand-baby-pink/90"
              disabled={activeSelectedIds.length === 0}
              onClick={handleAssignSelected}
            >
              Assign Training
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
