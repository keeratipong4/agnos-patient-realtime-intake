// @vitest-environment jsdom

import { act } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const syncMocks = vi.hoisted(() => ({
  focusField: vi.fn(),
  patchField: vi.fn(),
  submitForm: vi.fn(),
  updatePatientStatus: vi.fn(),
  usePatientSync: vi.fn(),
}));

vi.mock("@/hooks/use-patient-sync", () => ({
  usePatientSync: syncMocks.usePatientSync,
}));

import { PatientForm } from "./patient-form";

const sessionId = "00000000-0000-4000-8000-000000000001";

function renderPatientForm() {
  return render(<PatientForm sessionId={sessionId} />);
}

function completeRequiredFields() {
  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: "สมชาย" },
  });
  fireEvent.change(screen.getByLabelText(/last name/i), {
    target: { value: "ใจดี" },
  });
  fireEvent.change(screen.getByLabelText(/date of birth/i), {
    target: { value: "1990-05-20" },
  });
  fireEvent.change(screen.getByLabelText(/^gender/i), {
    target: { value: "male" },
  });
  fireEvent.change(screen.getByLabelText(/nationality/i), {
    target: { value: "thai" },
  });
  fireEvent.change(screen.getByLabelText(/preferred language/i), {
    target: { value: "thai" },
  });
  fireEvent.change(screen.getByLabelText(/phone number/i), {
    target: { value: "081-234-5678" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "somchai@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/full address/i), {
    target: { value: "123 ถนนสุขุมวิท กรุงเทพฯ" },
  });
}

describe("PatientForm", () => {
  beforeEach(() => {
    syncMocks.focusField.mockReset();
    syncMocks.patchField.mockReset();
    syncMocks.submitForm.mockReset().mockResolvedValue(true);
    syncMocks.updatePatientStatus.mockReset();
    syncMocks.usePatientSync.mockReset().mockReturnValue({
      connectionStatus: "connected",
      focusField: syncMocks.focusField,
      formData: {},
      patchField: syncMocks.patchField,
      patientStatus: "inactive",
      submitForm: syncMocks.submitForm,
      syncError: null,
      updatePatientStatus: syncMocks.updatePatientStatus,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders every contracted field in accessible, responsive sections", () => {
    renderPatientForm();

    expect(
      screen.getByRole("heading", { name: "Personal identification" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Emergency contact" }),
    ).toBeDefined();

    [
      /first name/i,
      /middle name/i,
      /last name/i,
      /date of birth/i,
      /^gender/i,
      /nationality/i,
      /preferred language/i,
      /^religion/i,
      /phone number/i,
      /email address/i,
      /full address/i,
      /contact name/i,
      /^relationship/i,
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeDefined();
    });

    expect(screen.getByRole("note").textContent).toBe(
      "Demo only — Data is transmitted ephemerally and is not saved to a database or this browser.",
    );
  });

  it("reports field focus immediately without showing lifecycle status badges", () => {
    renderPatientForm();

    fireEvent.focus(screen.getByLabelText(/first name/i));
    fireEvent.focus(screen.getByLabelText(/last name/i));
    fireEvent.focus(screen.getByLabelText(/contact name/i));
    fireEvent.focus(screen.getByLabelText(/^relationship/i));

    expect(syncMocks.focusField).toHaveBeenNthCalledWith(1, "firstName");
    expect(syncMocks.focusField).toHaveBeenNthCalledWith(2, "lastName");
    expect(syncMocks.focusField).toHaveBeenNthCalledWith(
      3,
      "emergencyContact.name",
    );
    expect(syncMocks.focusField).toHaveBeenNthCalledWith(
      4,
      "emergencyContact.relationship",
    );
    expect(screen.queryByText("Inactive")).toBeNull();
    expect(screen.queryByText("Actively filling")).toBeNull();
  });

  it("shows inline validation feedback on blur", async () => {
    renderPatientForm();
    const phoneInput = screen.getByLabelText(/phone number/i);

    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.blur(phoneInput);

    expect(
      await screen.findByText(/enter a valid thai mobile or e\.164 phone number/i),
    ).toBeDefined();
    expect(phoneInput.getAttribute("aria-invalid")).toBe("true");
    expect(phoneInput.getAttribute("aria-describedby")).toBe(
      "phone-number-help phone-number-error",
    );
  });

  it("blocks invalid submission and validates emergency-contact mutual dependency", async () => {
    renderPatientForm();
    completeRequiredFields();

    fireEvent.change(screen.getByLabelText(/contact name/i), {
      target: { value: "สมหญิง ใจดี" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^submit$/i }),
    );

    expect(
      await screen.findByText(
        /relationship is required when a contact name is provided/i,
      ),
    ).toBeDefined();
    expect(syncMocks.submitForm).not.toHaveBeenCalled();
  });

  it("broadcasts only the scoped top-level field that changed", async () => {
    renderPatientForm();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Suda" },
    });

    await waitFor(() => {
      expect(syncMocks.patchField).toHaveBeenCalledWith("firstName", "Suda");
    });
    expect(syncMocks.patchField).not.toHaveBeenCalledWith(
      "lastName",
      expect.anything(),
    );
  });

  it("broadcasts emergency-contact changes as the contracted nested object", async () => {
    renderPatientForm();

    fireEvent.change(screen.getByLabelText(/contact name/i), {
      target: { value: "Anong Jaidee" },
    });

    await waitFor(() => {
      expect(syncMocks.patchField).toHaveBeenCalledWith("emergencyContact", {
        name: "Anong Jaidee",
        relationship: "",
      });
    });
  });

  it("transitions from active to inactive after five seconds without activity", () => {
    vi.useFakeTimers();
    renderPatientForm();

    fireEvent.focus(screen.getByLabelText(/first name/i));
    expect(syncMocks.updatePatientStatus).toHaveBeenCalledWith(
      "actively_filling",
    );

    act(() => {
      vi.advanceTimersByTime(4_999);
    });
    expect(syncMocks.updatePatientStatus).not.toHaveBeenCalledWith("inactive");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(syncMocks.updatePatientStatus).toHaveBeenCalledWith("inactive");
  });

  it("marks the patient inactive on window blur and when the document is hidden", () => {
    vi.useFakeTimers();
    renderPatientForm();
    const firstNameInput = screen.getByLabelText(/first name/i);

    fireEvent.focus(firstNameInput);
    window.dispatchEvent(new Event("blur"));
    expect(syncMocks.updatePatientStatus).toHaveBeenLastCalledWith("inactive");

    fireEvent.focus(firstNameInput);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(syncMocks.updatePatientStatus).toHaveBeenLastCalledWith("inactive");
  });

  it("submits normalized valid data and locks every field in a confirmed state", async () => {
    renderPatientForm();
    completeRequiredFields();

    fireEvent.click(
      screen.getByRole("button", { name: /^submit$/i }),
    );

    await waitFor(() => {
      expect(syncMocks.submitForm).toHaveBeenCalledTimes(1);
    });
    expect(syncMocks.submitForm).toHaveBeenCalledWith({
      address: "123 ถนนสุขุมวิท กรุงเทพฯ",
      dateOfBirth: "1990-05-20",
      email: "somchai@example.com",
      emergencyContact: undefined,
      firstName: "สมชาย",
      gender: "male",
      lastName: "ใจดี",
      middleName: undefined,
      nationality: "thai",
      phoneNumber: "081-234-5678",
      preferredLanguage: "thai",
      religion: undefined,
    });

    expect(
      await screen.findByText("Submission Confirmed"),
    ).toBeDefined();
    const fieldset = document.querySelector("fieldset");
    expect(fieldset).not.toBeNull();
    expect((fieldset as HTMLFieldSetElement).disabled).toBe(true);
    expect(
      screen.getByRole("button", { name: /submission confirmed/i }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
  });
});
