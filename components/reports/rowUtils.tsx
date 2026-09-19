// app/(dashboard)/reports/components/rowUtils.ts
//
// The exact field names in each report's `rows[]` aren't confirmed yet (the
// Swagger screenshots didn't expose a response schema). These helpers let the
// UI degrade gracefully — showing "—" instead of crashing — for whichever
// key name the API actually uses, and make it a one-line fix per column once
// the real shape is confirmed (just add/reorder the candidate keys).

export function pick(row: Record<string, unknown>, keys: string[], fallback = "—"): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return fallback;
}

export function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export function fmtNairaCell(row: Record<string, unknown>, keys: string[]): string {
  const n = pickNumber(row, keys);
  return n == null ? "—" : `₦${n.toLocaleString()}`;
}

/** Reads a number out of the flat `summary` object by candidate key names, e.g. pickSummary(summary, ["totalTasAgents"]). */
export function pickSummary(summary: Record<string, number> | undefined | null, keys: string[]): number | undefined {
  if (!summary) return undefined;
  for (const k of keys) {
    const v = summary[k];
    if (typeof v === "number") return v;
  }
  return undefined;
}

/** Handles either a flat field ("clientName") or a nested object ({ client: { name } }). */
export function pickNested(row: Record<string, unknown>, path: string[], fallback = "—"): string {
  let cur: unknown = row;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return fallback;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur == null || cur === "" ? fallback : String(cur);
}

/**
 * Case-insensitive, whitespace-trimmed equality for filter dropdowns.
 * Needed because real API values are inconsistently cased (e.g. TAS rows come
 * back as status: "active" while the UI dropdown option is "Active") — a
 * strict === comparison would silently filter everything to zero results.
 */
export function matchesFilter(value: string, option: string): boolean {
  return value.trim().toLowerCase() === option.trim().toLowerCase();
}

/** Formats an ISO date string (e.g. "2026-07-31T17:25:25.168Z") as "31/07/2026". Falls back to the raw value if it isn't parseable. */
export function formatDate(row: Record<string, unknown>, keys: string[], fallback = "—"): string {
  const raw = pick(row, keys, "");
  if (!raw) return fallback;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/**
 * Builds filter-dropdown options from whatever distinct values actually exist
 * in the currently loaded rows, for fields where the backend doesn't return a
 * fixed enum (e.g. Transactions' `type` is free text like "job_posting",
 * "Expert Premium Monthly Subscription", "Payment for job posting: Ironing").
 * A hardcoded option list would silently mismatch and filter to zero results.
 */
export function uniqueValues(rows: Record<string, unknown>[], keys: string[], allLabel = "All"): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = pick(row, keys, "");
    if (v) seen.add(v);
  }
  return [allLabel, ...Array.from(seen).sort()];
}