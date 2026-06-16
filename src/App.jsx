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
  const [opportunities, setOpportunities] = useState([]); // all opportunities loaded so far
  const [loading, setLoading] = useState(true);           // true only during the FIRST page load
  const [error, setError] = useState(false);              // true if a fetch failed
  const [apiTotal, setApiTotal] = useState(0);            // the API's true total count of opportunities
  const [loadingAll, setLoadingAll] = useState(true);     // true while background-loading the rest

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
  // Pagination state. We show one PAGE_SIZE slice of what's loaded so far.
  // totalLoadedPages grows as the background loader brings in more pages.
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

  // There's a "next" page if there are more loaded pages ahead, OR the
  // background loader is still bringing more in.
  const hasNextPage = currentPage < totalLoadedPages || loadingAll;

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
  // Loading strategy: fetch page 1 first and show it immediately (fast first
  // render). Then keep fetching the remaining pages in the BACKGROUND, so the
  // full catalog ends up in memory and search/filter can cover everything —
  // without making the user wait for all of it up front.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (didInitialFetch.current) return; // run once, even under Strict Mode's double-invoke
    didInitialFetch.current = true;

    async function loadAllPages() {
      let url = API_URL;
      let isFirstPage = true;

      try {
        while (url) {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Request failed");
          const json = await res.json();

          // Append this page's results to the growing list.
          setOpportunities((prev) => prev.concat(json.results));
          setApiTotal(json.count);

          // After the FIRST page arrives, drop the main loading flag so the
          // board renders right away. The rest stream in quietly behind it.
          if (isFirstPage) {
            setLoading(false);
            isFirstPage = false;
          }

          url = json.next; // advance to the next page (null = we're done)
        }
      } catch (err) {
        setError(true);
        setLoading(false);
      } finally {
        // Whether we finished or hit the end, background loading is over.
        setLoadingAll(false);
      }
    }

    loadAllPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Navigation handlers. With all pages streaming in via the background loader,
  // paging is now pure local slicing — no fetching needed here.
  // -------------------------------------------------------------------------
  function goToPrevPage() {
    setCurrentPage((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNextPage() {
    setCurrentPage((p) => p + 1);
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

      {/* While the rest of the catalog streams in behind page 1, show a quiet
          status so the user knows search isn't complete yet. */}
      {loadingAll && !error && opportunities.length > 0 && (
        <p className="bg-load-status">
          Loading all opportunities… {opportunities.length.toLocaleString()} of{" "}
          {apiTotal.toLocaleString()} loaded
        </p>
      )}

      <OpportunityList
        opportunities={pagedOpportunities}
        loading={loading && opportunities.length === 0}
        error={error}
        onCategoryClick={handleCategoryClick}
        activeCategory={activeCategory}
      />
      {/* Paging is instant local slicing now, so the Next button never shows a
          loading state. */}
      {!error && opportunities.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          loading={false}
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