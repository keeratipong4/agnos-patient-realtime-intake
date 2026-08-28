# Agnos Front-End Developer Candidate Assignment - Requirements & Project Scope

> **Document Type:** Technical Requirement Document (TRD)  
> **Source:** `../../Candidate Assignment Agnos - Front-end developer.pdf` (kept outside the application repository because it is confidential)  
> **Role:** Front-End Developer Candidate  
> **Company:** Agnos Health  
> **Target Delivery Deadline:** Friday, August 28, 23:59 (Within 3 days of receiving task)

---

## 1. Project Overview & Goal

Develop a **responsive, real-time patient input form and staff monitoring system**.

The application consists of two core views:
1. **Patient Form:** A responsive interface where patients enter personal, demographic, and contact information.
2. **Staff View:** A real-time responsive dashboard where hospital/clinic staff can monitor the patient's data entry live as it happens.

Both interfaces must synchronize in real-time (data entered by the patient reflects immediately on the staff view). The application must be built using modern web standards (Next.js, TailwindCSS) and deployed to a cloud platform.

---

## 2. Functional Requirements

### 2.1 Patient Form (`/patient` or `/`)
A user-friendly, accessible, and responsive form allowing patients to input their personal details:

| Field Name | Type / Format | Requirement | Validation Rules / Notes |
| :--- | :--- | :--- | :--- |
| **First Name** | Text input | **Required** | Trimmed length 1-100 characters; accept Unicode names, spaces, hyphens, and apostrophes |
| **Middle Name** | Text input | *Optional* | If provided, apply the same Unicode-aware length rules as First Name |
| **Last Name** | Text input | **Required** | Trimmed length 1-100 characters; accept Unicode names, spaces, hyphens, and apostrophes |
| **Date of Birth** | Date picker / Date input | **Required** | Valid past date (cannot be future date), age calculation helper |
| **Gender** | Select / Radio / Combobox | **Required** | Male, Female, Other, Prefer not to say |
| **Phone Number** | Tel input | **Required** | Valid phone number format (e.g. Thai/E.164 format `08X-XXX-XXXX` or `+66...`) |
| **Email** | Email input | **Required** | Valid standard email pattern (`name@domain.com`) |
| **Address** | Textarea / Text input | **Required** | Non-empty detailed address |
| **Preferred Language** | Select / Dropdown | **Required** | e.g., Thai, English, etc. |
| **Nationality** | Select / Combobox | **Required** | Standard country list / Thai / Foreigner |
| **Emergency Contact** | Grouped Object | *Optional* | Both fields may be blank; if either Contact Name or Relationship is provided, the other becomes required |
| **Religion** | Select / Text input | *Optional* | Buddhism, Christianity, Islam, Hinduism, Others, None |

#### Form Capabilities:
- **Client-side Form Validation:** Real-time feedback with clear error messages using schema validation (e.g., Zod).
- **Activity State Tracking:** Detects user engagement (typing, field focus, field blur, idle state).
- **Submission Flow:** Submit button with confirmation feedback and success state.
- **Demo Data Notice:** The deployed assignment must display `Demo only — Data is transmitted ephemerally and is not saved to a database or this browser.`

---

### 2.2 Staff View (`/staff`)
A real-time monitoring interface for healthcare personnel to observe patient data entry with minimal latency.

#### Capabilities & Display:
- **Live Field Synchronization:** Displays every field mirroring the patient's input in real-time.
- **Patient Status Indicators:** Clearly shows one of the following states:
  1. 🟢 **Actively filling in:** Patient is currently typing or interacting with form inputs.
  2. 🟡 **Inactive:** Patient is idle (no input/focus for a defined threshold) or has navigated away.
  3. 🔵 **Submitted:** Patient has completed and successfully submitted the form.
- **Visual Feedback:** Highlights active/modified fields dynamically.
- **Responsive Layout:** Optimized for desktop workstations, tablets, and mobile devices used by clinical staff.

---

### 2.3 Real-Time Synchronization Specification
- Must utilize **WebSockets** or a reliable real-time publish-subscribe technology (e.g. Pusher, Supabase Realtime, Socket.io, Ably, Firebase).
- **Live Updates:** Changes should appear on the Staff View without a manual refresh under normal network conditions. Debounce or throttle updates to avoid unnecessary message volume.
- **Late Join / Refresh Recovery:** A Staff View that joins after the Patient has started typing must request and receive the Patient's current form snapshot.
- **Connection Tracking:** Presence handles Patient connection and disconnection only.
- **Patient Lifecycle Tracking:** Application events handle `actively_filling`, `inactive`, and `submitted` independently from connection presence.
- **Session Isolation:** Each test session uses an unguessable session identifier shared through the Patient and Staff URLs.
- **No Persistent Storage in the Assignment Scope:** Draft and submitted data remain ephemeral. Database persistence and browser storage are intentionally excluded from the required implementation.

---

## 3. Tech Stack Requirements

| Layer | Required Tech | Recommended Tooling |
| :--- | :--- | :--- |
| **Framework** | **Next.js** | Next.js (App Router), React 18/19, TypeScript |
| **Styling** | **TailwindCSS** | TailwindCSS + `shadcn/ui` + `Lucide Icons` |
| **Form & Validation** | React Form Solution | `React Hook Form` + `Zod` |
| **Real-Time Layer** | WebSockets / Real-time | `Pusher Channels` / `Supabase Realtime` / `Socket.io` |
| **Deployment** | Cloud Frontend Platform | **Vercel** (Primary recommendation) / Netlify |

---

## 4. Deliverables

1. **Code Repository:** GitHub (or similar) repository link containing well-structured, readable code with setup and run instructions. The repository may be public or private as long as reviewers are given access.
2. **Deployed Application:** Live production URL accessible to reviewers.
3. **`README.md` Documentation:** Comprehensive documentation covering:
   - Project overview
   - Local setup & running instructions
   - Description of any bonus features implemented
   - **Development Planning Documentation (Explicitly required):**
     - **Project Structure:** Explanation of directory and file architecture.
     - **Design:** UI/UX decisions made for various screen sizes (mobile/desktop).
     - **Component Architecture:** Key components, their relationships, and responsibilities.
     - **Real-Time Synchronization Flow:** Detailed explanation/diagram of how data and status events propagate between patient and staff views.

---

## 5. Evaluation Criteria

1. **Responsiveness:** Fluid and intuitive adaptation across mobile, tablet, and desktop viewports.
2. **Code Quality:** Clean, modular, well-organized code adhering to modern TypeScript, React, and Next.js best practices.
3. **Functionality:** Flawless fulfillment of all form fields, validations, real-time sync, and accurate status tracking.
4. **UX/UI:** Clean, professional HealthTech design (intuitive UX for both patient and staff).
5. **Deployment:** Stable, publicly accessible cloud deployment.

---

## 6. Scope Boundaries

### Required for Submission (P0)
- Patient and Staff routes joined by an unguessable session ID.
- All assignment form fields and validation rules.
- Real-time field updates and a full-snapshot recovery handshake.
- Separate connection state and patient activity state.
- Responsive Patient and Staff interfaces.
- Production deployment, repository, README, and required planning documentation.

### Optional Only After Successful Deployment (P2)
- Split-screen demo route.
- Multi-patient management or a room switcher.
- Database persistence and submission history.
- Authentication and private-channel authorization.
- Browser draft persistence.
- Quick-fill, audio notifications, print/export, and progress indicators.

These optional items must not delay or destabilize the required submission.
