"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useState, type FocusEvent } from "react";
import {
  useForm,
  type FieldError as HookFormFieldError,
} from "react-hook-form";
import { z } from "zod";

import { StatusBadge } from "@/components/common/status-badge";
import { FormSection } from "@/components/patient/form-section";
import { PatientFormBroadcaster } from "@/components/patient/patient-field-sync";
import { useIdleTracker } from "@/hooks/use-idle-tracker";
import { usePatientSync } from "@/hooks/use-patient-sync";
import { isPatientFormFieldPath } from "@/lib/realtime-events";
import { patientFormSchema } from "@/lib/validations";
import type { PatientFormData } from "@/types";

const EMPTY_FORM_VALUES: PatientFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "" as PatientFormData["gender"],
  phoneNumber: "",
  email: "",
  address: "",
  preferredLanguage: "",
  nationality: "",
  emergencyContact: {
    name: "",
    relationship: "",
  },
  religion: "",
};

const INPUT_BASE_CLASS =
  "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600";

// Zod preprocessors intentionally accept unknown input, while every value
// produced by these browser controls is a PatientFormData-compatible string.
const patientFormResolverSchema = patientFormSchema as unknown as z.ZodType<
  PatientFormData,
  PatientFormData
>;

function getInputClass(hasError: boolean) {
  return `${INPUT_BASE_CLASS} ${
    hasError
      ? "border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-100"
      : "border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
  }`;
}

function getYesterdayIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function FieldLabel({
  children,
  htmlFor,
  optional = false,
}: {
  children: React.ReactNode;
  htmlFor: string;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-slate-800" htmlFor={htmlFor}>
      {children}
      {optional ? (
        <>
          {" "}
          <span className="ml-2 font-normal text-slate-500">Optional</span>
        </>
      ) : (
        <span className="ml-1 text-rose-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function FieldError({
  error,
  id,
}: {
  error?: HookFormFieldError;
  id: string;
}) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-medium text-rose-700" id={id}>
      {error.message}
    </p>
  );
}

export function PatientForm({ sessionId }: { sessionId: string }) {
  const {
    connectionStatus,
    focusField,
    patchField,
    patientStatus,
    submitForm,
    syncError,
    updatePatientStatus,
  } = usePatientSync(sessionId);
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocked = submissionConfirmed || patientStatus === "submitted";
  const maxDateOfBirth = useMemo(() => getYesterdayIsoDate(), []);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PatientFormData>({
    defaultValues: EMPTY_FORM_VALUES,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(patientFormResolverSchema),
  });

  const { recordActivity } = useIdleTracker({
    disabled: isLocked,
    onStatusChange: updatePatientStatus,
  });

  const handleFormFocus = (event: FocusEvent<HTMLFormElement>) => {
    const focusedField = event.target.name;

    if (isPatientFormFieldPath(focusedField)) {
      focusField(focusedField);
    }

    recordActivity();
  };

  const handleValidSubmit = handleSubmit(async (finalData) => {
    setIsSubmitting(true);

    try {
      await submitForm(finalData);
      setSubmissionConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-7 sm:px-8 sm:py-12">
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Agnos Health · Patient intake
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Tell us about yourself
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Complete the form below so the care team can follow your intake in
            real time. Required fields are marked with an asterisk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Realtime connection">
          <StatusBadge status={connectionStatus} />
        </div>
      </header>

      <div
        className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        role="note"
      >
        <strong>Demo only —</strong> Data is transmitted ephemerally and is not
        saved to a database or this browser.
      </div>

      {syncError ? (
        <div
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"
          role="status"
        >
          <strong>Realtime connection needs attention.</strong> {syncError}
        </div>
      ) : null}

      {isLocked ? (
        <div
          className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950"
          role="status"
        >
          <p className="font-bold">Submission Confirmed</p>
          <p className="mt-1 text-sm leading-6">
            Your demo intake has been submitted and is now locked against
            further changes.
          </p>
        </div>
      ) : null}

      <form
        aria-busy={isSubmitting}
        className="rounded-3xl border border-slate-200 bg-white px-5 shadow-sm sm:px-9"
        noValidate
        onChangeCapture={recordActivity}
        onFocusCapture={handleFormFocus}
        onInputCapture={recordActivity}
        onSubmit={handleValidSubmit}
      >
        <PatientFormBroadcaster control={control} patchField={patchField} />

        <fieldset className="m-0 min-w-0 border-0 p-0" disabled={isLocked}>
          <legend className="sr-only">Patient intake information</legend>

          <FormSection
            description="Use fake details for this demonstration. Names may contain Thai or other Unicode characters."
            eyebrow="Section 1 of 3"
            title="Personal identification"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <input
                  {...register("firstName")}
                  aria-describedby={errors.firstName ? "first-name-error" : undefined}
                  aria-invalid={Boolean(errors.firstName)}
                  autoComplete="given-name"
                  className={getInputClass(Boolean(errors.firstName))}
                  id="first-name"
                  placeholder="e.g. Somchai"
                  type="text"
                />
                <FieldError error={errors.firstName} id="first-name-error" />
              </div>

              <div>
                <FieldLabel htmlFor="middle-name" optional>
                  Middle name
                </FieldLabel>
                <input
                  {...register("middleName")}
                  aria-describedby={errors.middleName ? "middle-name-error" : undefined}
                  aria-invalid={Boolean(errors.middleName)}
                  autoComplete="additional-name"
                  className={getInputClass(Boolean(errors.middleName))}
                  id="middle-name"
                  placeholder="If applicable"
                  type="text"
                />
                <FieldError error={errors.middleName} id="middle-name-error" />
              </div>

              <div>
                <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                <input
                  {...register("lastName")}
                  aria-describedby={errors.lastName ? "last-name-error" : undefined}
                  aria-invalid={Boolean(errors.lastName)}
                  autoComplete="family-name"
                  className={getInputClass(Boolean(errors.lastName))}
                  id="last-name"
                  placeholder="e.g. Jaidee"
                  type="text"
                />
                <FieldError error={errors.lastName} id="last-name-error" />
              </div>

              <div>
                <FieldLabel htmlFor="date-of-birth">Date of birth</FieldLabel>
                <input
                  {...register("dateOfBirth")}
                  aria-describedby={
                    errors.dateOfBirth
                      ? "date-of-birth-help date-of-birth-error"
                      : "date-of-birth-help"
                  }
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  autoComplete="bday"
                  className={getInputClass(Boolean(errors.dateOfBirth))}
                  id="date-of-birth"
                  max={maxDateOfBirth}
                  type="date"
                />
                <p className="mt-2 text-sm text-slate-500" id="date-of-birth-help">
                  Date must be in the past.
                </p>
                <FieldError error={errors.dateOfBirth} id="date-of-birth-error" />
              </div>

              <div>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <select
                  {...register("gender")}
                  aria-describedby={errors.gender ? "gender-error" : undefined}
                  aria-invalid={Boolean(errors.gender)}
                  className={getInputClass(Boolean(errors.gender))}
                  id="gender"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <FieldError error={errors.gender} id="gender-error" />
              </div>

              <div>
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <select
                  {...register("nationality")}
                  aria-describedby={errors.nationality ? "nationality-error" : undefined}
                  aria-invalid={Boolean(errors.nationality)}
                  className={getInputClass(Boolean(errors.nationality))}
                  id="nationality"
                >
                  <option value="">Select nationality</option>
                  <option value="thai">Thai</option>
                  <option value="non_thai">Non-Thai / international</option>
                </select>
                <FieldError error={errors.nationality} id="nationality-error" />
              </div>

              <div>
                <FieldLabel htmlFor="preferred-language">
                  Preferred language
                </FieldLabel>
                <select
                  {...register("preferredLanguage")}
                  aria-describedby={errors.preferredLanguage ? "preferred-language-error" : undefined}
                  aria-invalid={Boolean(errors.preferredLanguage)}
                  className={getInputClass(Boolean(errors.preferredLanguage))}
                  id="preferred-language"
                >
                  <option value="">Select language</option>
                  <option value="thai">Thai</option>
                  <option value="english">English</option>
                  <option value="other">Other</option>
                </select>
                <FieldError
                  error={errors.preferredLanguage}
                  id="preferred-language-error"
                />
              </div>

              <div>
                <FieldLabel htmlFor="religion" optional>
                  Religion
                </FieldLabel>
                <select
                  {...register("religion")}
                  aria-describedby={errors.religion ? "religion-error" : undefined}
                  aria-invalid={Boolean(errors.religion)}
                  className={getInputClass(Boolean(errors.religion))}
                  id="religion"
                >
                  <option value="">Select if you wish</option>
                  <option value="buddhism">Buddhism</option>
                  <option value="christianity">Christianity</option>
                  <option value="islam">Islam</option>
                  <option value="hinduism">Hinduism</option>
                  <option value="other">Other</option>
                  <option value="none">None</option>
                </select>
                <FieldError error={errors.religion} id="religion-error" />
              </div>
            </div>
          </FormSection>

          <FormSection
            description="Provide contact details that staff can follow as you complete this demo intake."
            eyebrow="Section 2 of 3"
            title="Contact information"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="phone-number">Phone number</FieldLabel>
                <input
                  {...register("phoneNumber")}
                  aria-describedby={
                    errors.phoneNumber
                      ? "phone-number-help phone-number-error"
                      : "phone-number-help"
                  }
                  aria-invalid={Boolean(errors.phoneNumber)}
                  autoComplete="tel"
                  className={getInputClass(Boolean(errors.phoneNumber))}
                  id="phone-number"
                  inputMode="tel"
                  placeholder="081-234-5678 or +66812345678"
                  type="tel"
                />
                <p className="mt-2 text-sm text-slate-500" id="phone-number-help">
                  Thai mobile or international E.164 format.
                </p>
                <FieldError error={errors.phoneNumber} id="phone-number-error" />
              </div>

              <div>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <input
                  {...register("email")}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className={getInputClass(Boolean(errors.email))}
                  id="email"
                  inputMode="email"
                  placeholder="patient@example.com"
                  type="email"
                />
                <FieldError error={errors.email} id="email-error" />
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="address">Full address</FieldLabel>
                <textarea
                  {...register("address")}
                  aria-describedby={errors.address ? "address-error" : undefined}
                  aria-invalid={Boolean(errors.address)}
                  autoComplete="street-address"
                  className={`${getInputClass(Boolean(errors.address))} min-h-28 resize-y`}
                  id="address"
                  placeholder="House number, street, district, province, postal code"
                  rows={4}
                />
                <FieldError error={errors.address} id="address-error" />
              </div>
            </div>
          </FormSection>

          <FormSection
            description="This section is optional. If you enter a name or relationship, both fields are required."
            eyebrow="Section 3 of 3"
            title="Emergency contact"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="emergency-contact-name" optional>
                  Contact name
                </FieldLabel>
                <input
                  {...register("emergencyContact.name")}
                  aria-describedby={errors.emergencyContact?.name ? "emergency-contact-name-error" : undefined}
                  aria-invalid={Boolean(errors.emergencyContact?.name)}
                  autoComplete="off"
                  className={getInputClass(Boolean(errors.emergencyContact?.name))}
                  id="emergency-contact-name"
                  placeholder="Full name"
                  type="text"
                />
                <FieldError
                  error={errors.emergencyContact?.name}
                  id="emergency-contact-name-error"
                />
              </div>

              <div>
                <FieldLabel htmlFor="emergency-contact-relationship" optional>
                  Relationship
                </FieldLabel>
                <select
                  {...register("emergencyContact.relationship")}
                  aria-describedby={errors.emergencyContact?.relationship ? "emergency-contact-relationship-error" : undefined}
                  aria-invalid={Boolean(errors.emergencyContact?.relationship)}
                  className={getInputClass(Boolean(errors.emergencyContact?.relationship))}
                  id="emergency-contact-relationship"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse / partner</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="other">Other</option>
                </select>
                <FieldError
                  error={errors.emergencyContact?.relationship}
                  id="emergency-contact-relationship-error"
                />
              </div>
            </div>
          </FormSection>

          <div className="border-t border-slate-200 py-7">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto sm:min-w-48"
              disabled={isSubmitting || isLocked}
              type="submit"
            >
              {isLocked
                ? "Submission confirmed"
                : isSubmitting
                  ? "Submitting…"
                  : "Submit"}
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The form is checked for errors before the final demo submission.
            </p>
          </div>
        </fieldset>
      </form>

      <footer className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-all">
          Session: <span className="font-mono text-xs">{sessionId}</span>
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
