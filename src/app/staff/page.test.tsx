// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import StaffPage from "./page";

afterEach(cleanup);

describe("StaffPage", () => {
  it("shows a clear invalid-session state instead of starting realtime sync", async () => {
    const page = await StaffPage({
      searchParams: Promise.resolve({ session: "not-a-valid-uuid" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "This session link is invalid" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Create a new session" }).getAttribute(
        "href",
      ),
    ).toBe("/");
  });
});
