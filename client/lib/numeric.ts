export function sanitizeNumericInput(next: string): string {
  const sanitized = next.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  return parts.length > 2
    ? `${parts[0]}.${parts.slice(1).join("")}`
    : sanitized;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
