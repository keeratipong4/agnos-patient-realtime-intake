import type { PatientFormData } from "@/types";

export function createValidFullFormData(): PatientFormData {
  return {
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
  };
}
