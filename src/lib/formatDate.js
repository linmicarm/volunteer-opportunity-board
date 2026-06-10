// ===========================================================================
// formatDate.js — business logic for displaying dates consistently.
//
// User-created opportunities store an ISO date from <input type="date">
// (e.g. "2026-06-15"). API opportunities store a human-readable range
// (e.g. "March 27, 2026 - June 30, 2026"). This helper formats the former
// nicely and leaves the latter untouched, so both display cleanly.
// ===========================================================================

export function formatDate(value) {
  if (!value) return "Flexible";

  // Only ISO dates ("2026-06-15") should be reformatted. If it doesn't match
  // that exact shape, it's already human-readable API text — return as-is.
  const isISO = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!isISO) return value;

  // Appending "T00:00" forces parsing in LOCAL time. Without it, the date is
  // read as UTC midnight and can roll back a day in western timezones.
  const date = new Date(value + "T00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
