// ===========================================================================
// App.jsx — the root component and the "brain" of the whole application.
//
// This component OWNS all shared state and passes data DOWN to children as
// props. Children never modify state directly; instead App hands them
// functions (onAdd, onDelete) that they CALL. This is React's core pattern:
// data flows down, events flow up.
// ===========================================================================

import "./App.css";
import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import OpportunityList from "./components/OpportunityList.jsx";
import Footer from "./components/Footer.jsx";
import AddOpportunityForm from "./components/AddOpportunityForm.jsx";
import MyOpportunities from "./components/MyOpportunities.jsx";
import Toolbar from "./components/Toolbar.jsx";
import { totalOpportunities, remoteCount } from "./lib/stats.js";
import {
  matchesSearch,
  filterByCategory,
  sortOpportunities,
} from "./lib/filters.js";

// The public API we fetch volunteer opportunities from.
const API_URL = "https://www.volunteerconnector.org/api/search/";

function App() {
  // --- State: the API data and its three lifecycle flags ---
  const [opportunities, setOpportunities] = useState([]); // fetched list
  const [loading, setLoading] = useState(true); // true while fetch is in flight
  const [error, setError] = useState(false); // true if the fetch failed

  // --- State: the user's own created opportunities (persisted to localStorage) ---
  const [myOpportunities, setMyOpportunities] = useState([]);

  // --- State: the toolbar controls (search box, active category, sort order) ---
  const [search, setSearch] = useState(""); // text typed in the search box
  const [activeCategory, setActiveCategory] = useState(null); // a category clicked from a sticker, or null for "all"
  const [sortBy, setSortBy] = useState("default"); // "default" | "date" | "remote"

  // -------------------------------------------------------------------------
  // Derived data: we never store the *filtered* list in state. Instead we
  // recompute it on every render from the source list + the active controls.
  // This keeps a single source of truth (the full list) and avoids the bugs
  // that come from trying to keep a second filtered copy in sync.
  // -------------------------------------------------------------------------
  const visibleOpportunities = sortOpportunities(
    filterByCategory(
      opportunities.filter((opp) => matchesSearch(opp, search)),
      activeCategory,
    ),
    sortBy,
  );

  // -------------------------------------------------------------------------
  // Effect 1: fetch the API data ONCE, when the component first mounts.
  // The empty dependency array [] means "run after the first render only."
  // -------------------------------------------------------------------------
  useEffect(() => {
    // We define an async function inside the effect (the effect callback
    // itself can't be async) and then call it.
    async function loadOpportunities() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Request failed"); // turn 404/500 into a thrown error
        const json = await res.json();
        setOpportunities(json.results); // the array lives under the `results` key
      } catch (err) {
        setError(true); // any failure flips the error flag
      } finally {
        setLoading(false); // runs on success OR failure — loading is over either way
      }
    }
    loadOpportunities();
  }, []);

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
      <Header
        total={totalOpportunities(opportunities)}
        remote={remoteCount(opportunities)}
      />

      {/* The toolbar groups search + sort + the active-filter chip together. */}
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeCategory={activeCategory}
        onClearCategory={() => setActiveCategory(null)}
        shownCount={visibleOpportunities.length}
        totalCount={opportunities.length}
      />

      <h2>Browse Opportunities</h2>
      <OpportunityList
        opportunities={visibleOpportunities}
        loading={loading}
        error={error}
        onCategoryClick={handleCategoryClick}
        activeCategory={activeCategory}
      />

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
