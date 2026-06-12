// ===========================================================================
// Toolbar.jsx — groups the board's controls in one place: the search box,
// a sort dropdown, a results count, and a chip showing the currently active
// category filter (with a button to clear it).
//
// Like all the display components, it owns no data of its own — everything
// comes in as props, and user actions are reported back up via callbacks.
// ===========================================================================

function Toolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  activeCategory,
  onClearCategory,
  rangeStart,
  rangeEnd,
  apiTotal,
  isFiltered,
  filteredCount,
}) {
  // The count text adapts to context:
  //  - Filtering (search or category active): we can only filter what's been
  //    loaded so far, so we report the number of matches found.
  //  - Browsing normally: show the production-standard "Showing X–Y of TOTAL"
  //    range, where TOTAL is the API's true catalog count.
  let countText;
  if (isFiltered) {
    countText = `${filteredCount} match${filteredCount === 1 ? "" : "es"} in loaded results`;
  } else {
    countText = `Showing ${rangeStart}–${rangeEnd} of ${apiTotal.toLocaleString()}`;
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        {/* Controlled search input: its value comes from state, and every
            keystroke reports the new value up via onSearchChange. */}
        <input
          type="text"
          className="search-input"
          placeholder="Search opportunities by title…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {/* Sort dropdown — also controlled by state in App. */}
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="default">Sort: Default</option>
          <option value="date">Sort: Date (soonest)</option>
          <option value="remote">Sort: Remote first</option>
        </select>
      </div>

      <div className="toolbar-row toolbar-status">
        <span className="result-count">{countText}</span>

        {/* The active category filter only appears when one is set. Clicking
            the × clears it. */}
        {activeCategory && (
          <button className="filter-chip" onClick={onClearCategory}>
            {activeCategory} <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Toolbar;