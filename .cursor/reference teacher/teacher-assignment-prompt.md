# Prompt: Build the Teacher Assignment System Page

## Context & Constraints

You are adding a new **Teacher Assignment System** page to this existing project. Before writing a single line of code:

1. **Audit the existing codebase** — identify the component framework, styling approach (CSS modules, Tailwind, styled-components, plain CSS, etc.), routing library, icon library, font stack, and color tokens/design variables already in use.
2. **Locate the existing navigation component** — find whatever sidebar, top bar, or nav component the project already has, and use it as-is. Do not create a new navigation component. This page must slot in alongside the existing navigation exactly the way every other page in the project does.
3. **Match the existing design system exactly** — use the same spacing scale, border-radius, color variables, button variants, input styles, shadow tokens, and font choices already present in the codebase. Do not introduce any new design tokens or utility classes that don't already exist. If the project has a component library (e.g. a shared `Button`, `Input`, `Modal`, `Badge`), use those components.
4. **No database, no API calls, no backend integration** — all teacher data and training module data are local mock arrays defined inside the component/page file itself. The **only external connection** this page makes is when the user confirms an assignment: at that point, call a single callback prop (or emit a single event, or call a single handler — match whatever pattern the project uses for inter-component communication) named `onAssignmentConfirmed`, passing the assignment payload described below. Everything else is purely local UI state.
5. **File placement** — add the new page file(s) adjacent to other page files in the project. Add a route entry following the same pattern as existing routes. Do not restructure the project.

---

## What to Build

### Page: Teacher Assignment System

A full-page view that lets an admin browse a list of teachers, filter and sort them, select one or more, and then assign a training program to the selected group.

---

### Layout

The page uses the **existing project navigation** (sidebar, top bar, or whatever the project has). Inside that shell:

- **Page header area** — page title "Teacher Assignment System" using the heading style already in the project, with a subtitle showing the current result count (e.g. "Showing 50 of 50 teachers"). On the right side of the header: a single **Filter toggle button** that shows/hides the filter panel.
- **Content area** — a two-column flex layout: the left column holds the scrollable card grid; the right column is the collapsible filter panel. When the filter panel is hidden, the card grid takes full width.
- **Fixed bottom action bar** — always visible at the bottom of the viewport (above any existing bottom chrome if the project has any). Contains: a selection count label ("X of Y teachers selected"), a **Select All / Deselect All** button, and the primary **Assign Training** button.

---

### Teacher Cards (Card Grid)

Display teacher records in a responsive auto-fill grid. Each card shows:

- A **selection checkbox** (top-right corner of the card). Clicking the card or the checkbox toggles selection. Selected cards get a distinct visual treatment (border highlight, tinted background) using the project's accent/primary color.
- **Avatar** — a circle with the teacher's initials (derived from first + last name). Use the project's avatar or placeholder pattern if one exists.
- **Name** — display first name fully; apply a blur filter to the last name (CSS `filter: blur(5px)`) for privacy in this UI.
- **Position/Level** — e.g. "Teacher III", "Master Teacher II". Style as a colored badge using the project's badge/tag component or the accent color.
- **School name** — muted secondary text.
- **Subject tags** — a wrapping list of small pill badges (e.g. "Mathematics", "Physics", "STEM"). Use the project's tag/chip component.
- **Priority score** — a small indicator showing the numeric score (0–100) with a semantic color: score ≥ 75 = success/green, score 55–74 = warning/orange, score < 55 = danger/red. Label: "Strong", "Developing", or "Needs Support".
- **Per-card "Assign" button** — a compact button at the card bottom. Clicking it selects that teacher (if not already selected) and immediately opens the Assign Training modal with that teacher pre-selected.

---

### Filter Panel (right sidebar, toggleable)

A panel that slides in from the right (or appears inline, matching the project's panel/drawer pattern). Contains:

**1. Number of Participants** — two number inputs (MIN / MAX) that filter the card grid by… *(leave this as a UI-only filter for now; it controls how many results are shown from the current filtered set, not a teacher property).*

**2. Competency Area** — a group of checkboxes. All checked by default. Options:
- Content Knowledge
- Curriculum Planning
- Research-Based Practice
- Assessment Literacy
- Professional Development Goals

Each competency maps to a set of subject tags (define this mapping locally):
- Content Knowledge → Mathematics, Physics, Chemistry, Biology, Earth Science, General Science, Calculus, STEM
- Curriculum Planning → Biology, Chemistry, General Science, Environmental Science, STEM
- Research-Based Practice → Research, Statistics, STEM
- Assessment Literacy → Mathematics, Statistics, Calculus, Research
- Professional Development Goals → Technology, ICT, Programming, Robotics, Engineering

When a competency is unchecked, teachers whose tags have no overlap with that competency's tags are filtered out. Multiple checked competencies use OR logic.

**3. Teacher Level** — checkboxes, all checked by default. Options: Teacher I, Teacher II, Teacher III, Master Teacher I, Master Teacher II.

**4. Subject / Specialization** — a searchable tag chip selector. Available subjects: Mathematics, Physics, Chemistry, Biology, Earth Science, General Science, Environmental Science, Robotics, Engineering, Technology, ICT, Programming, Calculus, Statistics, Research, STEM. No chip selected = show all. One or more selected = show only teachers whose tags include at least one selected subject.

**5. Region** — a dropdown. Options: All Regions, NCR, CAR, I (Ilocos Region), II (Cagayan Valley), III (Central Luzon), IV-A (CALABARZON), IV-B (MIMAROPA), V (Bicol Region), VI (Western Visayas), VII (Central Visayas), VIII (Eastern Visayas), IX (Zamboanga Peninsula), X (Northern Mindanao), XI (Davao Region), XII (SOCCSKSARGEN), XIII (Caraga), BARMM.

**6. School** — a text input that filters by school name (case-insensitive substring match).

**7. Priority Sort** — single-select radio options: High → Low (default), Low → High, Random.

**8. Apply / Clear All** — two buttons at the bottom of the filter panel. Apply triggers a re-render of the card grid with current filter values. Clear All resets all filters to defaults and re-renders.

---

### Assign Training Modal

Triggered by the bottom action bar's **Assign Training** button, or by a per-card **Assign** button. If no teachers are selected and the bottom button is clicked, show an inline toast/notification ("Select at least one teacher first") — do not open the modal.

The modal is a centered overlay dialog using the project's modal/dialog component or pattern. It has:

**Header:**
- Title: "Assign Training" (use the project's modal title style)
- Subtitle: "X teacher(s) selected" 
- A close/dismiss button (top-right corner)
- Two tabs: **Create New** | **Assign Existing** — use the project's tab component if available

**Tab: Create New**

A form with the following sections and fields. Use the project's form field components (label + input, label + select, etc.).

*Section: Training Details*
- **Title** (required text input)
- **Description** (textarea)
- **Training Type** (tag-entry widget: user types a type and presses Enter or a small "Add" button to create a pill tag; pills are removable; pre-populate suggestions: INSET, LAC, SLAC, Division Training, Webinar)
- **Hosting Organization** (text input)

*Section: Schedule & Delivery*
- **Modality** (segmented control or radio pills): Face-to-Face | Online | Blended
- **Venue** (text input, shown when modality is Face-to-Face or Blended)
- **Online Platform** (text input, shown when modality is Online or Blended)
- **Meeting Link** (URL input, shown when modality is Online or Blended)
- **Schedule Type** (segmented control): Single Day | Multi-Day Range | Session Breakdown
  - Single Day: show a date picker input
  - Multi-Day Range: show start date + end date inputs
  - Session Breakdown: show a dynamic list of session cards (Day 1, Day 2, …). Each session card has: date input, start time, end time, topic text input, and a "Remove" button (disabled when only 1 session remains). An "Add Session" button appends a new session.
- **Duration** (text input, auto-suggest based on schedule: "1 day" for single day; "N days" for multi-day range; "N sessions" for session breakdown — but allow the user to override)

*Section: Targeting*
- **Target Levels** (multi-select chip group) — pre-filled with the distinct positions of the currently selected teachers. Options are all teacher levels. Toggle individual chips.
- **Subject Tags** (multi-select chip group) — pre-filled with the union of all tags from selected teachers. Options are all subjects listed above. Toggle individual chips.
- **Participant Cap** (number input) — pre-filled with the count of currently selected teachers.
- **Competency Focus** (multi-select chip group) — pre-filled by deriving competencies from selected teachers' tags using the mapping above. Options are the 5 competency areas.
- **Relevance Notes** (textarea, optional)

*Section: Contact*
- **Contact Person** (text input)
- **Contact Details** (text input, e.g. email or phone)

**Tab: Assign Existing**

- A search input that filters the list of existing training modules by title.
- A scrollable list of module cards. Each module card shows:
  - Title and host
  - Modality badge and date label
  - A capacity progress bar (assignedCount / cap) with a label ("18/30 slots filled" or "FULL" when at capacity)
  - Subject tag pills
  - A radio/select indicator — clicking the card selects it exclusively
  - Modules at full capacity are visually dimmed and cannot be selected

Existing modules (define as a local constant):
```
[
  { id: 'mod-001', title: 'Research Coaching for Science Teachers', host: 'DepEd Region VIII', modality: 'Online', dateLabel: 'May 18–20, 2026', cap: 30, assignedCount: 18, tags: ['Research', 'Biology', 'STEM'] },
  { id: 'mod-002', title: 'AI in the STEM Classroom', host: 'Division of Manila', modality: 'Blended', dateLabel: 'June 3–5, 2026', cap: 25, assignedCount: 11, tags: ['Programming', 'Technology', 'STEM'] },
  { id: 'mod-003', title: 'Laboratory Safety and Chemistry Assessment', host: 'DepEd Region III', modality: 'Face-to-Face', dateLabel: 'June 11, 2026', cap: 20, assignedCount: 20, tags: ['Chemistry', 'Assessment Literacy'] },
  { id: 'mod-004', title: 'Mathematics Intervention Design Sprint', host: 'DepEd Region XI', modality: 'Online', dateLabel: 'July 2–4, 2026', cap: 35, assignedCount: 9, tags: ['Mathematics', 'Statistics', 'Curriculum Planning'] },
  { id: 'mod-005', title: 'Environmental Science Fieldwork Planning', host: 'DepEd MIMAROPA', modality: 'Blended', dateLabel: 'July 15–17, 2026', cap: 22, assignedCount: 14, tags: ['Environmental Science', 'Biology', 'Research'] }
]
```

**Modal Footer:**
- Left: a "Cancel" text button that closes the modal (with a "discard changes?" confirmation if the Create New form has any non-default values entered)
- Right: primary **"Confirm Assignment"** button
  - Disabled when: on Create New tab and Title is empty, OR on Assign Existing tab and no module is selected
  - On click: validate required fields; if valid, call `onAssignmentConfirmed(payload)` (see below), close the modal, deselect all teachers, and show a success toast

---

### The Assignment Payload (`onAssignmentConfirmed`)

This is the **only point of integration** with the rest of the project. When the user confirms, call this handler with:

```js
{
  mode: 'create' | 'existing',
  teacherIds: number[],          // ids of selected teachers
  // if mode === 'create':
  newTraining: {
    title: string,
    description: string,
    trainingTypes: string[],
    host: string,
    modality: 'Face-to-Face' | 'Online' | 'Blended',
    venue: string,
    onlinePlatform: string,
    meetingLink: string,
    scheduleType: 'Single Day' | 'Multi-Day Range' | 'Session Breakdown',
    singleDate: string,
    rangeStart: string,
    rangeEnd: string,
    sessions: { date: string, startTime: string, endTime: string, topic: string }[],
    duration: string,
    targetLevels: string[],
    subjectTags: string[],
    participantCap: number,
    competencyFocus: string[],
    relevanceNote: string,
    contactPerson: string,
    contactDetails: string
  },
  // if mode === 'existing':
  existingModuleId: string
}
```

Do not perform any save, fetch, or mutation inside the page itself. Simply call the handler and let the parent/routing layer decide what to do with it.

---

### Mock Teacher Data

Define this as a local constant in the page file. Use these 50 records exactly:

```js
[
  { id: 1, firstName: 'Franchezca', lastName: 'Banayad', position: 'Teacher III', school: 'Manila Science High School', regionCode: 'NCR', tags: ['Programming', 'Calculus', 'Physics'], score: 82 },
  { id: 2, firstName: 'Renato', lastName: 'Cruz', position: 'Master Teacher II', school: 'Makati Science High School', regionCode: 'NCR', tags: ['Mathematics', 'STEM', 'Physics'], score: 85 },
  { id: 3, firstName: 'Ana', lastName: 'Reyes', position: 'Teacher III', school: 'Quezon City Science High School', regionCode: 'NCR', tags: ['Biology', 'Chemistry'], score: 79 },
  { id: 4, firstName: 'Gloria', lastName: 'Dela Cruz', position: 'Master Teacher I', school: 'Pasig City Science High School', regionCode: 'NCR', tags: ['Research', 'Statistics', 'STEM'], score: 91 },
  { id: 5, firstName: 'Maria', lastName: 'Santos', position: 'Master Teacher II', school: 'Taguig Science High School', regionCode: 'NCR', tags: ['Robotics', 'Engineering', 'Technology'], score: 87 },
  { id: 6, firstName: 'Noel', lastName: 'Dizon', position: 'Teacher II', school: 'Caloocan City Science High School', regionCode: 'NCR', tags: ['Mathematics', 'Statistics'], score: 68 },
  { id: 7, firstName: 'Alvin', lastName: 'Villafuerte', position: 'Teacher I', school: 'Marikina Science High School', regionCode: 'NCR', tags: ['ICT', 'Programming'], score: 90 },
  { id: 8, firstName: 'Wilfredo', lastName: 'Baccay', position: 'Teacher III', school: 'Baguio City National High School', regionCode: 'CAR', tags: ['Physics', 'Calculus'], score: 83 },
  { id: 9, firstName: 'Mary Ann', lastName: 'Tagel', position: 'Teacher II', school: 'Benguet State Laboratory School', regionCode: 'CAR', tags: ['Environmental Science', 'Biology'], score: 66 },
  { id: 10, firstName: 'Romeo', lastName: 'Pascual', position: 'Teacher II', school: 'Ilocos Norte National High School', regionCode: 'I', tags: ['Technology', 'ICT'], score: 76 },
  { id: 11, firstName: 'Benjamin', lastName: 'Macaraeg', position: 'Teacher II', school: 'San Fernando City Science High School', regionCode: 'I', tags: ['Physics', 'Engineering'], score: 71 },
  { id: 12, firstName: 'Loreta', lastName: 'Cabanayan', position: 'Teacher I', school: 'La Union Integrated School', regionCode: 'I', tags: ['Biology', 'General Science'], score: 62 },
  { id: 13, firstName: 'Eduardo', lastName: 'Ramos', position: 'Teacher I', school: 'Tuguegarao National High School', regionCode: 'II', tags: ['Earth Science', 'General Science'], score: 52 },
  { id: 14, firstName: 'Wilhelmina', lastName: 'Espinosa', position: 'Teacher II', school: 'Cagayan National High School', regionCode: 'II', tags: ['Biology', 'Research'], score: 63 },
  { id: 15, firstName: 'Emmanuel', lastName: 'Ocampo', position: 'Teacher III', school: 'Angeles City Science High School', regionCode: 'III', tags: ['Chemistry', 'Research'], score: 84 },
  { id: 16, firstName: 'Lilibeth', lastName: 'Aquino', position: 'Teacher I', school: 'Tarlac National High School', regionCode: 'III', tags: ['Biology', 'General Science'], score: 44 },
  { id: 17, firstName: 'Nena', lastName: 'Baluyot', position: 'Master Teacher I', school: 'Bulacan State Laboratory High School', regionCode: 'III', tags: ['Chemistry', 'Research', 'STEM'], score: 86 },
  { id: 18, firstName: 'Juan', lastName: 'Dela Cruz', position: 'Teacher I', school: 'Batangas National High School', regionCode: 'IV-A', tags: ['Environmental Science', 'Biology'], score: 64 },
  { id: 19, firstName: 'Erlinda', lastName: 'Soriano', position: 'Teacher II', school: 'Batangas City Integrated High School', regionCode: 'IV-A', tags: ['Biology', 'Environmental Science'], score: 61 },
  { id: 20, firstName: 'Renaldo', lastName: 'Mendez', position: 'Master Teacher II', school: 'Cavite Science Integrated School', regionCode: 'IV-A', tags: ['Robotics', 'STEM', 'Engineering'], score: 83 },
  { id: 21, firstName: 'Cheryl', lastName: 'Lacuesta', position: 'Teacher I', school: 'Rizal National High School', regionCode: 'IV-A', tags: ['Mathematics', 'Statistics'], score: 55 },
  { id: 22, firstName: 'Danilo', lastName: 'Atienza', position: 'Teacher I', school: 'Puerto Princesa City National High School', regionCode: 'IV-B', tags: ['Earth Science', 'Environmental Science'], score: 49 },
  { id: 23, firstName: 'Maureen', lastName: 'Valdez', position: 'Teacher III', school: 'Oriental Mindoro National High School', regionCode: 'IV-B', tags: ['Biology', 'General Science'], score: 74 },
  { id: 24, firstName: 'Gilbert', lastName: 'Macapagal', position: 'Teacher I', school: 'Legazpi City National High School', regionCode: 'V', tags: ['Earth Science', 'General Science'], score: 46 },
  { id: 25, firstName: 'Honeylyn', lastName: 'Abella', position: 'Teacher II', school: 'Camarines Sur Science High School', regionCode: 'V', tags: ['Biology', 'Research'], score: 73 },
  { id: 26, firstName: 'Carlo', lastName: 'Villanueva', position: 'Teacher II', school: 'Iloilo National High School', regionCode: 'VI', tags: ['Mathematics', 'Physics', 'Calculus'], score: 58 },
  { id: 27, firstName: 'Michelle', lastName: 'Gerona', position: 'Teacher I', school: 'Roxas City National High School', regionCode: 'VI', tags: ['ICT', 'Technology'], score: 65 },
  { id: 28, firstName: 'Orlando', lastName: 'Jabagat', position: 'Master Teacher I', school: 'Bacolod City National High School', regionCode: 'VI', tags: ['STEM', 'Research', 'Statistics'], score: 88 },
  { id: 29, firstName: 'Miguel', lastName: 'Reyes', position: 'Teacher II', school: 'Cebu City Science High School', regionCode: 'VII', tags: ['Programming', 'Calculus', 'Physics'], score: 72 },
  { id: 30, firstName: 'Teresa', lastName: 'Gutierrez', position: 'Teacher III', school: 'Bohol Integrated School', regionCode: 'VII', tags: ['Biology', 'General Science'], score: 66 },
  { id: 31, firstName: 'Kristine', lastName: 'Ybanez', position: 'Teacher I', school: 'Dumaguete City Science High School', regionCode: 'VII', tags: ['Chemistry', 'Biology'], score: 54 },
  { id: 32, firstName: 'Danica', lastName: 'Alvero', position: 'Teacher III', school: 'Eastern Visayas Regional Science High School', regionCode: 'VIII', tags: ['Mathematics', 'Statistics'], score: 80 },
  { id: 33, firstName: 'Marvin', lastName: 'Abad', position: 'Teacher II', school: 'Tacloban City National High School', regionCode: 'VIII', tags: ['Environmental Science', 'Biology'], score: 62 },
  { id: 34, firstName: 'Antonio', lastName: 'Lopez', position: 'Teacher I', school: 'Zamboanga del Sur National High School', regionCode: 'IX', tags: ['General Science'], score: 48 },
  { id: 35, firstName: 'Crispin', lastName: 'Salvador', position: 'Master Teacher II', school: 'Zamboanga City Science High School', regionCode: 'IX', tags: ['Mathematics', 'STEM'], score: 89 },
  { id: 36, firstName: 'Rochelle', lastName: 'Matalang', position: 'Teacher II', school: 'Pagadian City Integrated School', regionCode: 'IX', tags: ['ICT', 'Technology'], score: 67 },
  { id: 37, firstName: 'Geraldine', lastName: 'Busa', position: 'Teacher II', school: 'Cagayan de Oro National High School', regionCode: 'X', tags: ['Physics', 'STEM'], score: 70 },
  { id: 38, firstName: 'Victor', lastName: 'Anonas', position: 'Teacher III', school: 'Bukidnon Science High School', regionCode: 'X', tags: ['Environmental Science', 'Research'], score: 76 },
  { id: 39, firstName: 'Priscilla', lastName: 'Abao', position: 'Teacher I', school: 'Iligan City East National High School', regionCode: 'X', tags: ['Biology', 'General Science'], score: 53 },
  { id: 40, firstName: 'Luisa', lastName: 'Marquez', position: 'Master Teacher I', school: 'Davao City National High School', regionCode: 'XI', tags: ['Technology', 'Engineering'], score: 88 },
  { id: 41, firstName: 'Melchor', lastName: 'Sarmiento', position: 'Teacher II', school: 'Tagum National Comprehensive High School', regionCode: 'XI', tags: ['Calculus', 'Mathematics'], score: 69 },
  { id: 42, firstName: 'Joel', lastName: 'Tamayo', position: 'Teacher III', school: 'Koronadal National Comprehensive High School', regionCode: 'XII', tags: ['Chemistry', 'Research'], score: 75 },
  { id: 43, firstName: 'April Mae', lastName: 'Sumagul', position: 'Teacher II', school: 'Kidapawan City Science High School', regionCode: 'XII', tags: ['Mathematics', 'Physics'], score: 72 },
  { id: 44, firstName: 'Rodelyn', lastName: 'Palao', position: 'Teacher I', school: 'General Santos City High School', regionCode: 'XII', tags: ['General Science', 'Biology'], score: 57 },
  { id: 45, firstName: 'Reniel', lastName: 'Quimno', position: 'Teacher I', school: 'Butuan City School of Arts and Trades', regionCode: 'XIII', tags: ['Technology', 'ICT'], score: 60 },
  { id: 46, firstName: 'Hazel', lastName: 'Jamero', position: 'Teacher III', school: 'Surigao del Norte National High School', regionCode: 'XIII', tags: ['Environmental Science', 'Biology'], score: 74 },
  { id: 47, firstName: 'Paolo', lastName: 'Seronay', position: 'Teacher II', school: 'Bislig City National High School', regionCode: 'XIII', tags: ['Engineering', 'Robotics'], score: 78 },
  { id: 48, firstName: 'Farida', lastName: 'Ampatuan', position: 'Teacher I', school: 'Lamitan City National High School', regionCode: 'BARMM', tags: ['General Science', 'Biology'], score: 47 },
  { id: 49, firstName: 'Jamaloden', lastName: 'Macaraya', position: 'Teacher II', school: 'Marawi City National High School', regionCode: 'BARMM', tags: ['Mathematics', 'Statistics'], score: 59 },
  { id: 50, firstName: 'Hadja', lastName: 'Salik', position: 'Master Teacher I', school: 'Maguindanao Integrated School', regionCode: 'BARMM', tags: ['Research', 'STEM'], score: 81 }
]
```

---

### Behavior Summary

| Action | Result |
|---|---|
| Click card / card checkbox | Toggle teacher selection; update bottom bar count |
| Click per-card Assign button | Select that teacher + open modal |
| Click Filter toggle button | Show/hide filter panel |
| Click Apply Filters | Re-filter and re-sort the card grid |
| Click Clear All | Reset all filters to defaults, re-filter |
| Click Select All | Select all currently visible teachers |
| Click Select All (when all selected) | Deselect all |
| Click Assign Training (no selection) | Show toast, do not open modal |
| Click Assign Training (with selection) | Open modal with selected teachers pre-loaded |
| Switch modal tab | Preserve form state in both tabs |
| Modality change | Show/hide venue vs. platform/link fields |
| Schedule Type change | Show/hide date / date-range / session fields |
| Add/remove session | Dynamically update session list |
| Confirm (Create New, no title) | Show validation error on title field |
| Confirm (Assign Existing, no module) | Button remains disabled |
| Confirm (valid) | Call `onAssignmentConfirmed(payload)`, close modal, deselect all, show success toast |
| Close modal (dirty create form) | Show "Discard changes?" confirmation before closing |

---

### What NOT to do

- Do not create a new navigation bar, sidebar, or layout shell — use what already exists.
- Do not write any database queries, API calls, mutations, or server actions inside this page.
- Do not introduce new third-party dependencies unless the project already uses them.
- Do not create a separate design system or override existing CSS variables/tokens.
- Do not hardcode any colors, fonts, spacing, or shadows that aren't already defined in the project.
- Do not build any feature beyond what is described here.