// ===========================================================================
// filters.js — business logic for searching, filtering, and sorting the
// opportunity list. Kept out of the components so the UI stays simple and
// this logic can be reused and tested on its own.
// ===========================================================================

// Pull a flat list of category strings off an opportunity, handling BOTH
// shapes: API opportunities store categories inside an `activities` array,
// while user-created ones store a single `category` string.
export function getCategories(opp) {
  if (opp.activities && opp.activities.length > 0) {
    return [...new Set(opp.activities.map((a) => a.category))];
  }
  if (opp.category) {
    return [opp.category];
  }
  return [];
}

// Does this opportunity match the search text? We match on the title and
// lowercase both sides so capitalisation never breaks the match. An empty
// search string matches everything (because "".includes("") is true).
export function matchesSearch(opp, search) {
  const title = (opp.title || "").toLowerCase();
  return title.includes(search.toLowerCase());
}

// Keep only opportunities that contain the active category. If no category
// is active (null), return the list unchanged.
export function filterByCategory(list, activeCategory) {
  if (!activeCategory) return list;
  return list.filter((opp) => getCategories(opp).includes(activeCategory));
}

// Return a NEW sorted array (we copy with [...] first so we never mutate the
// original). "default" leaves order untouched; "remote" floats remote roles
// to the top; "date" sorts by start date ascending where possible.
export function sortOpportunities(list, sortBy) {
  const copy = [...list];

  if (sortBy === "remote") {
    // true sorts before false: (b - a) puts remote (true = 1) first.
    return copy.sort(
      (a, b) => Number(b.remote_or_online) - Number(a.remote_or_online)
    );
  }

  if (sortBy === "date") {
    return copy.sort((a, b) => {
      const da = Date.parse(a.dates || a.date) || 0;
      const db = Date.parse(b.dates || b.date) || 0;
      return da - db; // earliest first
    });
  }

  return copy; // "default" — original order
}