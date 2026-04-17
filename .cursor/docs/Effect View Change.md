# **POLARIS Impact Effect Analytics: Implementation Guide**

## **1\. Metric: Regional Economic Opportunity Cost (EOC)**

**Narrative:** "The So What." Quantifies the lifetime productivity lost when students fail to reach proficiency due to a lack of specialized teachers.

### **The Formula**

EOC \= S \* (1 \- P) \* L

### **Variables & Computation**

| Variable | Name | Logic / Source | Type |
| :---- | :---- | :---- | :---- |
| **S** | Student Population | **Action:** Add student\_pop to regional\_scores. (e.g., Region VIII ≈ 1.2M). | Int |
| **P** | Proficiency Rate | avg\_nat\_score / 100\. | Float |
| **L** | Annual Loss per Student | Constant: **₱290,000**. (Skilled Salary \- Low-Wage Trap). | Constant |

### **Data Grounding & Sources**

* **The Salary Delta:** High-skill professional average (₱537k) vs. Median/Low-skill worker (₱247k).  
* **Source:** [Tivazo Philippines Salary Guide 2025/2026](https://tivazo.com/blogs/average-salary-in-philippines-2025-guide/).  
* **The Proficiency Cliff:** National assessments show Grade 12 proficiency is as low as **0.4%**.  
* **Source:** [EDCOM II "Turning Point" Report 2026](https://edcom2.gov.ph/edcom-ii-releases-turning-point-report-unveils-10-year-national-roadmap-to-reverse-education-crisis/).

## **2\. Metric: Learning-Adjusted Years of Schooling (LAYS)**

**Narrative:** "The Diagnostic." Shows that "Seat Time ≠ Learning." A student may spend 12 years in school but only learn the equivalent of 5.68 years.

### **The Formula**

LAYS \= 12 \* (avg\_nat\_score / 75.0)  
Learning Gap \= 12 \- LAYS

### **Data Grounding & Sources**

* **The Reality:** Philippine students face a **5.5-year learning gap** by age 15\.  
* **Source:** [World Bank Human Capital Index: Philippines Data](https://www.google.com/search?q=https://data.worldbank.org/indicator/NW.HCA.LAYS?locations%3DPH).  
* **Mastery Plunge:** Proficiency drops from 30% in Grade 3 to 1% in Grade 10\.  
* **Source:** [EDCOM II Report (Year 2 Findings)](https://edcom2.gov.ph/edcom-ii-releases-turning-point-report-unveils-10-year-national-roadmap-to-reverse-education-crisis/).

## **3\. Metric: Annual Government Revenue Leak (Tax Loss)**

**Narrative:** "The Hook for Officials." The direct reduction in the government's budget because students aren't reaching high-income tax brackets.

### **The Formula**

Tax Loss \= EOC \* 0.144

### **Data Grounding & Sources**

* **Tax Effort:** The Philippines maintains a **14.38% Tax-to-GDP ratio**.  
* **Source:** [Bureau of the Treasury (BTr) Fiscal Performance 2024/2025](https://www.treasury.gov.ph/wp-content/uploads/2025/02/COR-Press-Release-FY-2024.pdf).

## **4\. System Implementation & NEW UI Placement**

### **Backend Action Plan (You)**

1. **DB Migration:** Add student\_pop, economic\_loss, and lays\_score to regional\_scores.  
2. **Logic:** Pre-calculate these in your regional rollup logic.  
3. **PITCH\_MODE:** Ensure "Region VIII" has these populated with high-impact numbers (e.g., ₱37B Tax Loss).

### **Frontend Action Plan (Teammate)**

**NEW PRIORITY:** Replace the "Critical Pings / AI Reports" column (Panel 1\) with the **Impact Overview Card**.

1. **The "Impact At A Glance" Card:**  
   * **Contextual Switching:** If activeRegion is null, show **National Aggregate**. If activeRegion is selected, show **Regional Specifics**.  
   * **Top Metric:** **₱{economic\_loss}B** (label: "Annual GDP Opportunity Cost"). Use a bold, red "Alert" style.  
   * **Secondary Metric:** **₱{tax\_loss}B** (label: "Annual Revenue Leak").  
   * **Visual Widget:** A "Learning Gap" indicator showing **{learning\_gap} Years Lost** with a progress bar.  
2. **Visual Style:** Use bg-slate-900 or a deep secondary color to make this panel "pop" more than the rest of the dashboard.

## **5\. Winning Pitch Story**

"Most solutions start with where the teachers are. POLARIS starts with what the **Education Crisis is costing the Philippines**. We show a **₱261 Billion annual economic loss** and a **6-year learning gap** immediately on the dashboard. This ensures that administrators like Maricris aren't just looking at dots on a map—they are looking at a roadmap for national recovery."