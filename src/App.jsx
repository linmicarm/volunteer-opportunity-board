// ===========================================================================
// App.jsx — the root component and the "brain" of the whole application.
//
// This component OWNS all shared state and passes data DOWN to children as
// props. Children never modify state directly; instead App hands them
// functions (onAdd, onDelete) that they CALL. This is React's core pattern:
// data flows down, events flow up.
// ===========================================================================

import "./App.css";
import { useState, useEffect, useRef } from "react";
import Header from "./components/Header.jsx";
import OpportunityList from "./components/OpportunityList.jsx";
import Footer from "./components/Footer.jsx";
import AddOpportunityForm from "./components/AddOpportunityForm.jsx";
import MyOpportunities from "./components/MyOpportunities.jsx";
import Toolbar from "./components/Toolbar.jsx";
import Pagination from "./components/Pagination.jsx";
import { matchesSearch, filterByCategory, sortOpportunities } from "./lib/filters.js";

// The public API we fetch volunteer opportunities from.
const API_URL = "https://www.volunteerconnector.org/api/search/";

function App() {
  // --- State: the API data and its lifecycle flags ---
  const [opportunities, setOpportunities] = useState([]); // fetched so far (grows as you page)
  const [loading, setLoading] = useState(true);           // true while a page is being fetched
  const [error, setError] = useState(false);              // true if a fetch failed
  const [nextUrl, setNextUrl] = useState(null);           // URL of the next page to fetch (null = no more)
  const [apiTotal, setApiTotal] = useState(0);            // the API's true total count of opportunities

  // --- State: the user's own created opportunities (persisted to localStorage) ---
  const [myOpportunities, setMyOpportunities] = useState([]);

  // --- State: the toolbar controls (search box, active category, sort order) ---
  const [search, setSearch] = useState("");           // text typed in the search box
  const [activeCategory, setActiveCategory] = useState(null); // a category clicked from a sticker, or null for "all"
  const [sortBy, setSortBy] = useState("default");    // "default" | "date" | "remote"

  // --- State: which page of results is currently being viewed ---
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6; // how many cards to show per page

  // A ref that survives re-renders without triggering them. We use it to make
  // sure the initial fetch runs only ONCE, even though React's Strict Mode
  // runs effects twice in development (which would otherwise load page 1
  // twice and make pages 1 and 2 look identical).
  const didInitialFetch = useRef(false);

  // -------------------------------------------------------------------------
  // Derived data: we never store the *filtered* list in state. Instead we
  // recompute it on every render from the source list + the active controls.
  // This keeps a single source of truth (the full list) and avoids the bugs
  // that come from trying to keep a second filtered copy in sync.
  // -------------------------------------------------------------------------
  const visibleOpportunities = sortOpportunities(
    filterByCategory(
      opportunities.filter((opp) => matchesSearch(opp, search)),
      activeCategory
    ),
    sortBy
  );

  // -------------------------------------------------------------------------
  // Pagination state. We only show one PAGE_SIZE slice of what's been loaded.
  // Because we load pages on demand, "total pages" is NOT known up front — we
  // only know there's more to fetch if nextUrl is not null.
  // -------------------------------------------------------------------------
  const totalLoadedPages = Math.max(
    1,
    Math.ceil(visibleOpportunities.length / PAGE_SIZE)
  );
  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedOpportunities = visibleOpportunities.slice(
    sliceStart,
    sliceStart + PAGE_SIZE
  );

  // There's a "next" page available if either we have more already-loaded
  // pages ahead of the current one, OR the API has more pages to fetch.
  const hasNextPage = currentPage < totalLoadedPages || nextUrl !== null;

  // Range for the "Showing 1–6 of 1,353" count. rangeStart/rangeEnd describe
  // which slice of the full catalog the current page represents.
  const rangeStart = pagedOpportunities.length === 0 ? 0 : sliceStart + 1;
  const rangeEnd = sliceStart + pagedOpportunities.length;

  // If the filters change, snap back to page 1 so we're never stranded on a
  // page that no longer exists for the filtered results.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, sortBy]);

  // -------------------------------------------------------------------------
  // fetchPage: fetch ONE page from a given URL, append its results to what we
  // already have, and remember the URL of the page after it. Shared by both
  // the initial load and the "Next" button.
  // -------------------------------------------------------------------------
  async function fetchPage(url) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      // Append this page's results to the running list.
      setOpportunities((prev) => prev.concat(json.results));
      // Remember where the NEXT page lives (or null if this was the last).
      setNextUrl(json.next);
      // The API reports the true total in every response; capture it once.
      setApiTotal(json.count);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Effect 1: fetch only the FIRST page on mount, so the board appears fast.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (didInitialFetch.current) return; // already fetched — skip Strict Mode's 2nd run
    didInitialFetch.current = true;
    fetchPage(API_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Navigation handlers. Going to the previous page never needs a fetch.
  // Going to the next page fetches more from the API only if we don't already
  // have enough loaded to fill that page.
  // -------------------------------------------------------------------------
  function goToPrevPage() {
    setCurrentPage((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function goToNextPage() {
    const nextPage = currentPage + 1;
    // How many items do we need loaded to fill the page we're moving to?
    const needed = nextPage * PAGE_SIZE;
    // If we don't have enough AND the API has more, fetch the next page first.
    if (visibleOpportunities.length < needed && nextUrl) {
      await fetchPage(nextUrl);
    }
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // -------------------------------------------------------------------------
  // Effect 2: LOAD the user's saved opportunities from localStorage once,
  // on mount, so they survive a page refresh.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("myOpportunities");
    if (saved) {
      // localStorage only stores strings, so we parse it back into an array.
      setMyOpportunities(JSON.parse(saved));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Effect 3: SAVE the user's opportunities whenever they change.
  // The dependency [myOpportunities] means "re-run whenever this array
  // changes" — i.e. after every add or delete. This single effect covers
  // both, so delete needs no separate localStorage code.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Convert the array to a string for storage.
    localStorage.setItem("myOpportunities", JSON.stringify(myOpportunities));
  }, [myOpportunities]);

  // --- Event handler: add a new user opportunity ---
  function handleAdd(newOpp) {
    // Stamp a unique id so React keys and delete-by-id work. crypto.randomUUID()
    // is built into modern browsers and guarantees uniqueness.
    const withId = { ...newOpp, id: crypto.randomUUID() };
    // Build a NEW array (spread the old + append) — never mutate state directly.
    setMyOpportunities((prev) => [...prev, withId]);
  }

  // --- Event handler: delete a user opportunity by id ---
  function handleDelete(id) {
    // .filter() keeps everything EXCEPT the matching id, returning a new array.
    setMyOpportunities((prev) => prev.filter((opp) => opp.id !== id));
  }

  // --- Event handler: clicking a category sticker toggles that filter ---
  function handleCategoryClick(category) {
    // If the clicked category is already active, clicking again clears it.
    setActiveCategory((current) => (current === category ? null : category));
  }

  return (
    <div className="app">
      <Header total={apiTotal} />

      {/* The toolbar groups search + sort + the active-filter chip together. */}
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeCategory={activeCategory}
        onClearCategory={() => setActiveCategory(null)}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        apiTotal={apiTotal}
        isFiltered={Boolean(search) || Boolean(activeCategory)}
        filteredCount={visibleOpportunities.length}
      />

      <h2>Browse Opportunities</h2>
      <OpportunityList
        opportunities={pagedOpportunities}
        loading={loading && opportunities.length === 0}
        error={error}
        onCategoryClick={handleCategoryClick}
        activeCategory={activeCategory}
      />
      {/* Pagination shows once the first page has loaded. During a later page
          fetch the cards stay visible and only the Next button shows Loading. */}
      {!error && opportunities.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          loading={loading}
        />
      )}

      <h2 className="centered-heading">Post Your Own</h2>
      <p className="form-intro">
        Know of an opportunity? Pin it to the board for others to find.
      </p>
      <AddOpportunityForm onAdd={handleAdd} />

      <h2 className="centered-heading">My Opportunities</h2>
      <MyOpportunities
        opportunities={myOpportunities}
        onDelete={handleDelete}
        onCategoryClick={handleCategoryClick}
        activeCategory={activeCategory}
      />

      <Footer />
    </div>
  );
}

export default App;