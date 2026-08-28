const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function getSessionId(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value) || !isValidSessionId(value)) {
    return null;
  }

  return value.toLowerCase();
}

export function getSessionChannelName(sessionId: string): string {
  return `patient-session-${sessionId}`;
}
