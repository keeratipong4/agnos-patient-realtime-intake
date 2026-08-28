import { z } from "zod";

import type { EmergencyContact, PatientFormData } from "@/types";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .refine(
    (value) => Array.from(graphemeSegmenter.segment(value)).length <= 100,
    "Name must be 100 characters or fewer",
  );

const blankStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalNameSchema = z.preprocess(
  blankStringToUndefined,
  nameSchema.optional(),
);

const optionalTrimmedStringSchema = z.preprocess(
  blankStringToUndefined,
  z.string().trim().optional(),
);

const requiredTrimmedStringSchema = z
  .string()
  .trim()
  .min(1, "This field is required");

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address");

const phoneNumberSchema = z
  .string()
  .trim()
  .refine((value) => {
    const compactPhoneNumber = value.replace(/[\s()-]/g, "");

    return (
      /^0[689]\d{8}$/.test(compactPhoneNumber) ||
      /^\+[1-9]\d{7,14}$/.test(compactPhoneNumber)
    );
  }, "Enter a valid Thai mobile or E.164 phone number");

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function getLocalIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const dateOfBirthSchema = z
  .string()
  .trim()
  .refine(isValidIsoDate, "Enter a valid date of birth")
  .refine(
    (value) => isValidIsoDate(value) && value < getLocalIsoDate(new Date()),
    "Date of birth must be in the past",
  );

const emergencyContactSchema = z
  .object({
    name: optionalNameSchema,
    relationship: optionalTrimmedStringSchema,
  })
  .superRefine((contact, context) => {
    if (contact.name && !contact.relationship) {
      context.addIssue({
        code: "custom",
        path: ["relationship"],
        message: "Relationship is required when a contact name is provided",
      });
    }

    if (contact.relationship && !contact.name) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Contact name is required when a relationship is provided",
      });
    }
  })
  .transform((contact): EmergencyContact | undefined => {
    if (contact.name && contact.relationship) {
      return {
        name: contact.name,
        relationship: contact.relationship,
      };
    }

    return undefined;
  });

export const patientFormSchema: z.ZodType<PatientFormData> = z.object({
  firstName: nameSchema,
  middleName: optionalNameSchema,
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  phoneNumber: phoneNumberSchema,
  email: emailSchema,
  address: requiredTrimmedStringSchema,
  preferredLanguage: requiredTrimmedStringSchema,
  nationality: requiredTrimmedStringSchema,
  emergencyContact: emergencyContactSchema.optional(),
  religion: optionalTrimmedStringSchema,
});
