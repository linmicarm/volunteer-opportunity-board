export function formatLocation(audience) {
  if (!audience) return "Location not specified";
  if (audience.scope === "national") return "National";
  if (audience.scope === "regional") return audience.regions.join(", ");
  if (audience.scope === "local") return "Local";
  return "Location not specified";
}

export function formatCategories(activities) {
  if (!activities || activities.length === 0) return "Uncategorized";
  return [...new Set(activities.map((a) => a.category))].join(", ");
}