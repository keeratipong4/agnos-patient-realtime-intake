# UI/UX Design System & Responsive Strategy

> **Project:** Agnos Health - Real-Time Patient Intake & Staff Monitoring System  
> **Document Version:** 1.2.0
> **Target Audience:** Reviewers, Evaluators, and Frontend Developers

---

## 1. Design Philosophy & Brand Identity

The application embraces a **Clean, Modern HealthTech aesthetic** inspired by Agnos Health's digital medical experience:
- **Trust & Professionalism:** Deep Medical Navy (`#0F172A`) paired with Healthcare Teal (`#0D9488` / `#06B6D4`).
- **Clarity & Low Cognitive Load:** Ample whitespace, high-contrast readable typography, subtle borders, and soft container shadows.
- **Immediate State Feedback:** Color-coded status badges and pulsing field highlights to draw clinical staff attention to live user actions without being overwhelming.

---

## 2. Color Palette & Design Tokens

| Token | Hex / HSL | Usage |
| :--- | :--- | :--- |
| **Primary (Agnos Teal)** | `#0D9488` (Teal-600) | Primary actions, submit buttons, focused input rings, brand accents. |
| **Primary Light** | `#F0FDFA` (Teal-50) | Highlight background, active field pulses, active tab backgrounds. |
| **Background (Slate-50)** | `#F8FAFC` | Main app background, subtle neutral canvas. |
| **Surface / Card** | `#FFFFFF` | Form containers and staff monitor cards. |
| **Border / Divider** | `#E2E8F0` (Slate-200) | Card outlines, input borders, structural separators. |
| **Text Primary** | `#0F172A` (Slate-900) | Main headings, input text, critical labels. |
| **Text Muted** | `#64748B` (Slate-500) | Helper text, field placeholders, timestamps, secondary captions. |

### Status Indicator Colors:
- 🟢 **Actively Filling In:** `#16A34A` (Green-600) with gentle radar pulse animation (`animate-ping` / `pulse`).
- 🟡 **Inactive / Idle:** `#D97706` (Amber-600) with static clock badge.
- 🔵 **Submitted:** `#2563EB` (Blue-600) with checkmark icon badge.

---

## 3. Responsive Layout Strategy across Viewports

```
+------------------------------------------------------------------------------------+
| Screen Size         | Patient Form Layout             | Staff Monitor Layout       |
+---------------------+---------------------------------+----------------------------+
| Mobile (< 768px)    | 1 Column Linear Flow            | 1 Column Condensed Cards   |
|                     | Full-width touch inputs         | Status Summary at Top      |
|                     | Clear full-width Submit action  | Stacked field groups       |
+---------------------+---------------------------------+----------------------------+
| Tablet (768px-1024px)| 2 Column Grid for short fields | 2 Column Grid Overview     |
|                     | (e.g. First / Last name)        | Side-by-side key metrics   |
+---------------------+---------------------------------+----------------------------+
| Desktop (>= 1024px) | Centered max-w-2xl Card         | 2 Column Dashboard         |
|                     | Grouped form sections           | Live field highlights      |
+------------------------------------------------------------------------------------+
```

---

## 4. Landing Page UX Design Details

1. **One Initial Action:** Before a session exists, the page shows one centered
   `Create new session` action. Patient and Staff are not presented as independent
   feature cards.
2. **Progressive Disclosure:** After UUID creation, the same card changes to a
   `Session ready` state and reveals the paired Patient and Staff links.
3. **Shared-Session Explanation:** Supporting text states that both links are two
   synchronized views of the same session. The UUID appears once as shared context.
4. **Responsive Focus:** The single card stays centered at every breakpoint; paired
   role links stack on mobile and share one row on wider screens.

---

## 5. Patient Form UX Design Details

1. **Logical Sectioning:**
   - **Section 1: Personal Identification** (First, Middle, Last Name, DOB, Gender, Nationality, Religion).
   - **Section 2: Contact Information** (Phone Number, Email, Full Address, Preferred Language).
   - **Section 3: Emergency Contact (Optional)** (Contact Name, Relationship dropdown).
2. **Inline Real-Time Validation:** Error messages appear on blur or submit attempt with red accent borders (`border-red-500`) and clear, human-readable helper text.
3. **Conditional Emergency Contact Validation:** Both Emergency Contact fields may remain blank, but completing either one requires the other.
4. **Demo Notice:** A visible notice reads `Demo only — Data is transmitted ephemerally and is not saved to a database or this browser.`

---

## 6. Staff Monitoring View UX Design Details

1. **Prominent Status Header:**
   - Displays Connection Health (`Connecting` / `Connected` / `Disconnected`) independently from Patient Status (`Active` / `Inactive` / `Submitted`) and the Session Code.
2. **Live Field Pulse Animation:**
   - When the patient modifies a field, the corresponding card row flashes with a temporary subtle teal glow (`bg-teal-50 border-teal-300 transition-all duration-500`) that fades back to white after 1.5 seconds.
3. **Empty State Handling:**
   - Fields that have not yet been touched display a soft placeholder (`"Waiting for input..."`) rather than empty white gaps.
4. **Submission Lock State:**
   - Once submitted, the staff view transitions into a read-only summary with a timestamp. A later Patient disconnect does not overwrite the Submitted state.

---

## 7. Accessibility and Evaluator Experience

- The landing page exposes only one action before session creation, then generates
  paired Patient and Staff links and explains that they are two views of the same
  session to be opened in separate tabs or windows.
- Every input has a visible label and associated validation message.
- Keyboard focus remains visible throughout the form and dashboard.
- Status is communicated using text and icons in addition to color.
- Motion used for field updates respects `prefers-reduced-motion` and is not required to understand the state.
- Empty, connecting, disconnected, invalid-session, and submission states all include clear explanatory text.
