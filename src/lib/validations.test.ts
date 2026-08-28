import { afterEach, describe, expect, it, vi } from "vitest";

import { patientFormSchema } from "./validations";

afterEach(() => {
  vi.useRealTimers();
});

function createValidPatientData() {
  return {
    firstName: "สมชาย",
    lastName: "ใจดี",
    dateOfBirth: "1990-05-20",
    gender: "male",
    phoneNumber: "081-234-5678",
    email: "somchai@example.com",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ",
    preferredLanguage: "thai",
    nationality: "thai",
  };
}

describe("patientFormSchema", () => {
  it("accepts a complete patient form", () => {
    const result = patientFormSchema.safeParse({
      firstName: "สมชาย",
      middleName: "เจมส์",
      lastName: "ใจดี",
      dateOfBirth: "1990-05-20",
      gender: "male",
      phoneNumber: "081-234-5678",
      email: "somchai@example.com",
      address: "123 ถนนสุขุมวิท กรุงเทพฯ",
      preferredLanguage: "thai",
      nationality: "thai",
      emergencyContact: {
        name: "สมหญิง ใจดี",
        relationship: "spouse",
      },
      religion: "buddhism",
    });

    expect(result.success).toBe(true);
  });

  it("trims names while accepting Unicode characters and punctuation", () => {
    const result = patientFormSchema.parse({
      firstName: "  ณัฐชนน O'Connor-สุวรรณ  ",
      middleName: "  李 小龍  ",
      lastName: "  García Márquez  ",
      dateOfBirth: "1988-11-02",
      gender: "other",
      phoneNumber: "+66812345678",
      email: "patient@example.com",
      address: "88 Bangkok, Thailand",
      preferredLanguage: "english",
      nationality: "thai",
    });

    expect(result).toMatchObject({
      firstName: "ณัฐชนน O'Connor-สุวรรณ",
      middleName: "李 小龍",
      lastName: "García Márquez",
    });
  });

  it("rejects a required name that is empty after trimming", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      firstName: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      lastName: "ก".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("accepts 100 Unicode grapheme characters outside the BMP", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      firstName: "𐐀".repeat(100),
    });

    expect(result.success).toBe(true);
  });

  it("normalizes blank optional strings to undefined", () => {
    const result = patientFormSchema.parse({
      ...createValidPatientData(),
      middleName: "   ",
      religion: "   ",
    });

    expect([result.middleName, result.religion]).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("rejects required text fields that are blank after trimming", () => {
    const requiredFields = [
      "address",
      "preferredLanguage",
      "nationality",
    ] as const;
    const results = requiredFields.map((field) =>
      patientFormSchema.safeParse({
        ...createValidPatientData(),
        [field]: "   ",
      }),
    );

    expect(results.map((result) => result.success)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("rejects an invalid email address", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      email: "somchai@",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a phone number outside Thai mobile and E.164 formats", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      phoneNumber: "12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a date of birth that is not a real calendar date", () => {
    const result = patientFormSchema.safeParse({
      ...createValidPatientData(),
      dateOfBirth: "2020-02-30",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a date of birth that is today or in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28, 12));

    const results = ["2026-08-28", "2026-08-29"].map((dateOfBirth) =>
      patientFormSchema.safeParse({
        ...createValidPatientData(),
        dateOfBirth,
      }),
    );

    expect(results.map((result) => result.success)).toEqual([false, false]);
  });

  it("accepts an empty Emergency Contact and normalizes it to undefined", () => {
    const result = patientFormSchema.parse({
      ...createValidPatientData(),
      emergencyContact: {
        name: "   ",
        relationship: "   ",
      },
    });

    expect(result.emergencyContact).toBeUndefined();
  });

  it("rejects a partial Emergency Contact at the missing paired field", () => {
    const results = [
      { name: "สมหญิง ใจดี", relationship: "" },
      { name: "", relationship: "spouse" },
    ].map((emergencyContact) =>
      patientFormSchema.safeParse({
        ...createValidPatientData(),
        emergencyContact,
      }),
    );

    expect(
      results.map((result) =>
        result.success
          ? []
          : result.error.issues.map((issue) => issue.path.join(".")),
      ),
    ).toEqual([
      ["emergencyContact.relationship"],
      ["emergencyContact.name"],
    ]);
  });
});
