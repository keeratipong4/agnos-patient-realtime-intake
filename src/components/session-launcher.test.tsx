// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionLauncher } from "./session-launcher";

const sessionId = "00000000-0000-4000-8000-000000000001";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SessionLauncher", () => {
  it("presents one clear action before a session is created", () => {
    render(<SessionLauncher />);

    expect(
      screen.getByRole("button", { name: "Create new session" }),
    ).toBeDefined();
    expect(screen.queryByRole("link", { name: /patient view/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /staff view/i })).toBeNull();
  });

  it("reveals two views paired to the same generated session", () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(sessionId);
    render(<SessionLauncher />);

    fireEvent.click(
      screen.getByRole("button", { name: "Create new session" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "One session, two synchronized views",
      }),
    ).toBeDefined();
    expect(screen.getByText(sessionId)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /open patient view/i }).getAttribute(
        "href",
      ),
    ).toBe(`/patient?session=${sessionId}`);
    expect(
      screen.getByRole("link", { name: /open staff view/i }).getAttribute(
        "href",
      ),
    ).toBe(`/staff?session=${sessionId}`);
  });
});
