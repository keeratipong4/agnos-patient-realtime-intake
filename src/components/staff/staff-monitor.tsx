"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { useStaffSync } from "@/hooks/use-staff-sync";
import type {
  ConnectionStatus,
  PatientFormData,
  PatientFormFieldPath,
  PatientStatus,
} from "@/types";

const WAITING_FOR_INPUT = "Waiting for input";

const PATIENT_STATUS_STYLES: Record<PatientStatus, string> = {
  actively_filling: "border-emerald-200 bg-emerald-50 text-emerald-800",
  inactive: "border-amber-200 bg-amber-50 text-amber-800",
  submitted: "border-blue-200 bg-blue-50 text-blue-800",
};

const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  actively_filling: "Actively filling",
  inactive: "Inactive",
  submitted: "Submitted",
};

const GENDER_LABELS: Record<PatientFormData["gender"], string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const NATIONALITY_LABELS: Record<string, string> = {
  thai: "Thai",
  non_thai: "Non-Thai / international",
};

const LANGUAGE_LABELS: Record<string, string> = {
  thai: "Thai",
  english: "English",
  other: "Other",
};

const RELIGION_LABELS: Record<string, string> = {
  buddhism: "Buddhism",
  christianity: "Christianity",
  islam: "Islam",
  hinduism: "Hinduism",
  other: "Other",
  none: "None",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Parent",
  spouse: "Spouse / partner",
  sibling: "Sibling",
  child: "Child",
  friend: "Friend",
  caregiver: "Caregiver",
  other: "Other",
};

type DashboardState = {
  description: string;
  title: string;
  tone: "blue" | "emerald" | "amber" | "slate";
};

type FieldHighlight = {
  label: "Patient working here" | "Last active field" | "Latest update";
  mode: "active" | "static";
} | null;

function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${PATIENT_STATUS_STYLES[status]}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {status === "actively_filling"
          ? "↻"
          : status === "submitted"
            ? "✓"
            : "—"}
      </span>
      {PATIENT_STATUS_LABELS[status]}
    </span>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function formatDateOfBirth(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatOption(value: string | undefined, labels: Record<string, string>) {
  if (!value) {
    return value;
  }

  return labels[value] ?? value;
}

function hasAnyInput(formData: Partial<PatientFormData>) {
  return Object.values(formData).some((value) => {
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (value && typeof value === "object") {
      return Object.values(value).some(
        (nestedValue) =>
          typeof nestedValue === "string" && nestedValue.trim().length > 0,
      );
    }

    return false;
  });
}

function getConnectionDescription(
  connectionStatus: ConnectionStatus,
  patientStatus: PatientStatus,
) {
  if (connectionStatus === "connecting") {
    return "Opening the realtime channel and requesting the latest Patient snapshot.";
  }

  if (connectionStatus === "connected") {
    return "The Patient browser is connected to this session.";
  }

  if (patientStatus === "submitted") {
    return "The Patient browser is disconnected. Submitted values remain locked below.";
  }

  return "The Patient browser is not connected. Last received values remain visible.";
}

function getPatientDescription(patientStatus: PatientStatus) {
  if (patientStatus === "actively_filling") {
    return "The Patient is currently interacting with the intake form.";
  }

  if (patientStatus === "submitted") {
    return "The final intake was submitted and is displayed as a read-only summary.";
  }

  return "No active form interaction is currently being reported.";
}

function getDashboardState(
  connectionStatus: ConnectionStatus,
  patientStatus: PatientStatus,
  hasInput: boolean,
): DashboardState {
  if (patientStatus === "submitted") {
    return {
      description:
        "Final Patient values are locked in this Staff view. Connection changes and later draft events cannot replace them.",
      title: "Submission received",
      tone: "blue",
    };
  }

  if (connectionStatus === "connecting") {
    return {
      description:
        "The dashboard is joining the session and asking the Patient for the latest form snapshot.",
      title: "Connecting to live session",
      tone: "slate",
    };
  }

  if (connectionStatus === "disconnected") {
    return hasInput
      ? {
          description:
            "Live updates are paused. The last values received remain visible while the dashboard waits for the Patient to reconnect.",
          title: "Patient disconnected",
          tone: "amber",
        }
      : {
          description:
            "Open the matching Patient link to begin this ephemeral intake session.",
          title: "Waiting for Patient",
          tone: "amber",
        };
  }

  if (patientStatus === "actively_filling") {
    return {
      description:
        "Changes are arriving live. The latest field is marked with a text label as well as a stronger outline.",
      title: "Patient actively filling form",
      tone: "emerald",
    };
  }

  return {
    description:
      "The Patient remains connected, but no recent form interaction is being reported.",
    title: "Patient inactive",
    tone: "amber",
  };
}

function MonitorField({
  displayValue,
  field,
  highlight,
  label,
}: {
  displayValue?: string;
  field: PatientFormFieldPath;
  highlight: FieldHighlight;
  label: string;
}) {
  const hasValue = Boolean(displayValue?.trim());
  const isHighlighted = highlight !== null;

  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 transition sm:p-5 ${
        isHighlighted
          ? `border-teal-500 bg-teal-50 outline-2 outline-offset-2 outline-teal-200 ${
              highlight.mode === "active" ? "active-field-pulse" : ""
            }`
          : "border-slate-200 bg-white"
      }`}
      data-field={field}
      data-highlight-mode={highlight?.mode ?? "none"}
      data-recent-field={isHighlighted ? "true" : "false"}
    >
      <dt className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        <span>{label}</span>
        {highlight ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-2.5 py-1 text-[0.7rem] tracking-normal text-white normal-case">
            <span aria-hidden="true">
              {highlight.mode === "active" ? "↻" : "•"}
            </span>
            {highlight.label}
          </span>
        ) : null}
      </dt>
      <dd
        className={`mt-3 break-words text-base font-semibold leading-6 ${
          hasValue ? "text-slate-950" : "italic text-slate-400"
        }`}
      >
        {hasValue ? displayValue : WAITING_FOR_INPUT}
      </dd>
    </div>
  );
}

function MonitorSection({
  children,
  description,
  eyebrow,
  id,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {eyebrow}
        </p>
        <h2
          className="mt-2 text-xl font-bold tracking-tight text-slate-950"
          id={id}
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </header>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function StatusPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export function StaffMonitor({ sessionId }: { sessionId: string }) {
  const {
    connectionStatus,
    focusedField,
    formData,
    lastActivityAt,
    lastChangedField,
    patientStatus,
    submittedAt,
    syncError,
  } = useStaffSync(sessionId);
  const dashboardState = getDashboardState(
    connectionStatus,
    patientStatus,
    hasAnyInput(formData),
  );
  const stateStyles: Record<DashboardState["tone"], string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    slate: "border-slate-200 bg-slate-100 text-slate-900",
  };
  const getFieldHighlight = (
    field: PatientFormFieldPath,
  ): FieldHighlight => {
    if (patientStatus === "submitted") {
      return null;
    }

    const isHighlighted = focusedField
      ? focusedField === field
      : lastChangedField === field ||
        (lastChangedField === "emergencyContact" &&
          field.startsWith("emergencyContact."));

    if (!isHighlighted) {
      return null;
    }

    const mode =
      connectionStatus === "connected" &&
      patientStatus === "actively_filling"
        ? "active"
        : "static";

    return {
      label: focusedField
        ? mode === "active"
          ? "Patient working here"
          : "Last active field"
        : "Latest update",
      mode,
    };
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
      <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">
              Agnos Health · Staff monitoring
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Live patient intake
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Follow this session field by field. Values are read-only here and
              remain ephemeral throughout the demo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Session code
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-200">
              {sessionId}
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="Live session status"
        className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.15fr]"
      >
        <StatusPanel
          description={getConnectionDescription(
            connectionStatus,
            patientStatus,
          )}
          title="Connection status"
        >
          <StatusBadge status={connectionStatus} />
        </StatusPanel>
        <StatusPanel
          description={getPatientDescription(patientStatus)}
          title="Patient status"
        >
          <PatientStatusBadge status={patientStatus} />
        </StatusPanel>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Session activity
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-500">
                Last activity
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {lastActivityAt ? (
                  <time dateTime={lastActivityAt}>
                    {formatTimestamp(lastActivityAt)}
                  </time>
                ) : (
                  "Not reported yet"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">
                Submitted at
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {submittedAt ? (
                  <time dateTime={submittedAt}>
                    {formatTimestamp(submittedAt)}
                  </time>
                ) : (
                  "Not submitted"
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section
        aria-live="polite"
        className={`mt-5 rounded-2xl border p-5 ${stateStyles[dashboardState.tone]}`}
        role="status"
      >
        <h2 className="font-bold">{dashboardState.title}</h2>
        <p className="mt-1 text-sm leading-6">{dashboardState.description}</p>
      </section>

      {syncError ? (
        <div
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950"
          role="alert"
        >
          <strong>Realtime connection needs attention.</strong> {syncError}
        </div>
      ) : null}

      <div
        aria-label={
          patientStatus === "submitted"
            ? "Submitted patient summary"
            : "Live patient summary"
        }
        className="mt-5 grid gap-5 lg:grid-cols-2"
      >
        <div className="lg:col-span-2">
          <MonitorSection
            description="Identity and demographic details mirror the first section of the Patient Form."
            eyebrow="Section 1 of 3"
            id="personal-identification-heading"
            title="Personal identification"
          >
            <MonitorField
              displayValue={formData.firstName}
              field="firstName"
              highlight={getFieldHighlight("firstName")}
              label="First name"
            />
            <MonitorField
              displayValue={formData.middleName}
              field="middleName"
              highlight={getFieldHighlight("middleName")}
              label="Middle name"
            />
            <MonitorField
              displayValue={formData.lastName}
              field="lastName"
              highlight={getFieldHighlight("lastName")}
              label="Last name"
            />
            <MonitorField
              displayValue={formatDateOfBirth(formData.dateOfBirth)}
              field="dateOfBirth"
              highlight={getFieldHighlight("dateOfBirth")}
              label="Date of birth"
            />
            <MonitorField
              displayValue={
                formData.gender
                  ? GENDER_LABELS[formData.gender]
                  : formData.gender
              }
              field="gender"
              highlight={getFieldHighlight("gender")}
              label="Gender"
            />
            <MonitorField
              displayValue={formatOption(
                formData.nationality,
                NATIONALITY_LABELS,
              )}
              field="nationality"
              highlight={getFieldHighlight("nationality")}
              label="Nationality"
            />
            <MonitorField
              displayValue={formatOption(
                formData.preferredLanguage,
                LANGUAGE_LABELS,
              )}
              field="preferredLanguage"
              highlight={getFieldHighlight("preferredLanguage")}
              label="Preferred language"
            />
            <MonitorField
              displayValue={formatOption(formData.religion, RELIGION_LABELS)}
              field="religion"
              highlight={getFieldHighlight("religion")}
              label="Religion"
            />
          </MonitorSection>
        </div>

        <MonitorSection
          description="Contact details continue updating while the Patient completes the form."
          eyebrow="Section 2 of 3"
          id="contact-information-heading"
          title="Contact information"
        >
          <MonitorField
            displayValue={formData.phoneNumber}
            field="phoneNumber"
            highlight={getFieldHighlight("phoneNumber")}
            label="Phone number"
          />
          <MonitorField
            displayValue={formData.email}
            field="email"
            highlight={getFieldHighlight("email")}
            label="Email address"
          />
          <div className="sm:col-span-2">
            <MonitorField
              displayValue={formData.address}
              field="address"
              highlight={getFieldHighlight("address")}
              label="Full address"
            />
          </div>
        </MonitorSection>

        <MonitorSection
          description="These optional values are shown individually while sharing one realtime field group."
          eyebrow="Section 3 of 3"
          id="emergency-contact-heading"
          title="Emergency contact"
        >
          <MonitorField
            displayValue={formData.emergencyContact?.name}
            field="emergencyContact.name"
            highlight={getFieldHighlight("emergencyContact.name")}
            label="Contact name"
          />
          <MonitorField
            displayValue={formatOption(
              formData.emergencyContact?.relationship,
              RELATIONSHIP_LABELS,
            )}
            field="emergencyContact.relationship"
            highlight={getFieldHighlight("emergencyContact.relationship")}
            label="Relationship"
          />
        </MonitorSection>
      </div>

      <footer className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Demo data is transmitted ephemerally and is not saved to a database
          or this browser.
        </p>
        <Link
          className="font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          href="/"
        >
          Return to session launcher
        </Link>
      </footer>
    </main>
  );
}
