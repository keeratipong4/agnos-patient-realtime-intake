// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSupabaseBrowserClient } from "./supabase";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalPublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function restoreEnvironmentVariable(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("getSupabaseBrowserClient", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://test-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "test-publishable-key";
  });

  afterEach(() => {
    restoreEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", originalUrl);
    restoreEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      originalPublishableKey,
    );
    vi.restoreAllMocks();
  });

  it("isolates the auth namespace of each realtime client", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const firstClient = getSupabaseBrowserClient();
    const secondClient = getSupabaseBrowserClient();

    expect(firstClient).not.toBeNull();
    expect(secondClient).not.toBeNull();
    expect(firstClient).not.toBe(secondClient);
    expect(warn.mock.calls.flat().join(" ")).not.toContain(
      "Multiple GoTrueClient instances detected",
    );
  });
});
