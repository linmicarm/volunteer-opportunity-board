# Volunteer Opportunity Board

A React application that helps users discover volunteer opportunities from a public API and post their own. Built for Week 9, combining React components, state, effects, API integration, full CRUD operations, localStorage persistence, and responsive design.

---

<img width="1386" height="907" alt="image" src="https://github.com/user-attachments/assets/788372db-7d96-4fb2-bf04-5e94a999e916" />

---

## What It Does
 
- **Browse** real volunteer opportunities pulled live from the Volunteer Connector API
- **Page** through results six at a time, loading more on demand for a fast first render
- **Search** opportunities by title
- **Filter** by category — click any colored category sticker to narrow the board
- **Sort** by soonest date or remote-first
- **Post your own** opportunities through a form
- **Delete** opportunities you've posted
- **Persist** your posted opportunities across page refreshes using the browser's localStorage
---
 
## Getting Started
 
This project uses [Vite](https://vitejs.dev/). You'll need [Node.js](https://nodejs.org/) installed.
 
```bash
# 1. Install dependencies (creates node_modules/)
npm install
 
# 2. Start the development server
npm run dev
 
# 3. Open the local URL it prints (usually http://localhost:5173)
```
 
Other scripts:
 
```bash
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # run ESLint
```
 
---
 
## The API
 
Data comes from the public **Volunteer Connector** search endpoint:
 
```
https://www.volunteerconnector.org/api/search/
```
 
The response is an object shaped like `{ count, next, previous, results: [...] }`. The app reads the `results` array for opportunities, uses `count` to display the true catalog total, and follows the `next` URL to load further pages on demand. Each opportunity includes a title, description, organization (nested object), an `activities` array (each with its own category), a human-readable `dates` string, an `audience` object describing location, and a `remote_or_online` boolean.
 
A key challenge was that this data is **inconsistent**: the `audience` field has a different shape depending on whether an opportunity is national, regional, or local, and categories live inside a nested array rather than a single field. The app handles this with helper functions (see below).
 
---
 
## Project Structure
 
```
src/
├── App.jsx                      # Root component — owns all shared state
├── App.css                      # All styling (the riso / bulletin-board theme)
├── index.css                    # Minimal base reset
├── components/
│   ├── Header.jsx               # Masthead + total opportunity count
│   ├── Toolbar.jsx              # Search box, sort dropdown, filter chip, result count
│   ├── OpportunityList.jsx      # Renders the API list; handles loading/error/empty states
│   ├── OpportunityCard.jsx      # A single opportunity "flyer" — reused by both lists
│   ├── Pagination.jsx           # Prev / Next controls for on-demand paging
│   ├── AddOpportunityForm.jsx   # The "post your own" form
│   ├── MyOpportunities.jsx      # Renders the user's posted opportunities
│   └── Footer.jsx               # Static footer
└── lib/                         # Business logic, kept out of the components
    ├── formatLocation.js        # Turns the messy `audience` object into a clean string
    ├── formatDate.js            # Formats ISO dates; leaves API date strings untouched
    ├── categoryColor.js         # Maps a category to a consistent sticker color
    └── filters.js               # Search, category filter, and sort logic
```
 
### Component Responsibilities
 
`App` is the "brain." It owns all shared state (the API list, the user's list, the search term, the active category, the sort order) and defines the functions that change that state. Every other component receives data and functions as props. This follows React's core rule: **data flows down (as props), and events flow up (as function calls)**. Children never modify state directly — they call functions that App handed them.
 
`OpportunityCard` is intentionally **reused** by both `OpportunityList` (API data) and `MyOpportunities` (user data). The same component behaves differently based on its props: it only shows a delete button when it receives an `onDelete` function, so API cards have no delete button while user cards do.
 
---
 
## How Key Features Work
 
**Fetching (loading & error states).** A `useEffect` with an empty dependency array runs the fetch once when the app loads. The fetch lives in a `try / catch / finally` block: `try` requests the data, `catch` flips an error flag, and `finally` flips off the loading flag no matter what. Three pieces of state (`loading`, `error`, `opportunities`) track the request, and `OpportunityList` renders one of three views accordingly.
 
**Creating opportunities.** `AddOpportunityForm` keeps its own local state for the in-progress field values (nothing else needs them until submit). On submit it calls `onAdd`, which App uses to stamp a unique `id` (via `crypto.randomUUID()`) and append the new opportunity to its list.
 
**Deleting.** `handleDelete` uses `.filter()` to build a new array containing everything except the matching `id`.
 
**localStorage persistence.** Two effects handle this: one **loads** saved opportunities once on mount, and one **saves** the list whenever it changes. Because saving is triggered by any change to the list, deleting is automatically persisted too — no extra code needed. Since localStorage only stores strings, the app uses `JSON.stringify` to save and `JSON.parse` to load.
 
**Search, filter, and sort.** Rather than storing a separate "filtered list" in state (which would risk getting out of sync), the visible list is **recomputed on every render** from the full list plus the active controls. The logic lives in `lib/filters.js`.
 
**Pagination & background loading.** The API is paginated and holds over 1,300 opportunities. To balance a fast first render against full-catalog search, the app fetches **page 1 first and displays it immediately**, then quietly fetches every remaining page in the **background**, appending each as it arrives. A small status line ("Loading all opportunities… 340 of 1,353 loaded") shows progress and disappears when done. Because search, filter, and pagination all read from the growing list, they automatically cover more of the catalog as it streams in — and the full set within a few seconds. Paging itself is instant local slicing. The toolbar shows a production-style "Showing 1–6 of 1,353" range using the API's true `count`, and a `useRef` guard ensures the loader runs only once despite React Strict Mode's double-invoke in development.
 
---
 
## Business Logic (lib/)
 
All non-trivial logic is separated into the `lib/` folder so the components stay focused on rendering:
 
- **`formatLocation`** — handles the inconsistent `audience` shapes (national / regional / local / missing) and returns a clean display string, guarding against a missing object so it can't crash the render.
- **`formatCategories` / `getCategories`** — pulls categories out of the nested `activities` array, removes duplicates with a `Set`, and returns clean strings.
- **`formatDate`** — formats user-entered ISO dates ("2026-06-15" → "June 15, 2026") while leaving the API's pre-formatted date ranges untouched. Appends a local-time marker to avoid an off-by-one-day timezone bug.
- **`categoryColor`** — deterministically maps each category to one of four colors, so the same category always gets the same sticker color.
- **`filters`** — the search, category-filter, and sort logic, plus a `getCategories` helper that normalizes the two different category shapes (API vs. user-created).
---
 
## What I Learned
 
- **Lifting state up.** Deciding where each piece of state should live — shared data in `App`, in-progress form values local to the form — based on which components actually need it.
- **The fetch lifecycle.** Modeling a network request as three states (loading / success / error) and using `try/catch/finally` so the loading flag always clears.
- **`useEffect` dependency arrays.** Understanding the difference between `[]` (run once on mount) and `[someValue]` (re-run when that value changes), and using both deliberately for the fetch, the localStorage load, and the localStorage save.
- **Immutable state updates.** Always building new arrays/objects (with spread and `.filter()`) instead of mutating state in place.
- **Controlled form inputs.** Wiring inputs so React state is the single source of truth, and using one change handler for many fields via the `name` attribute and a computed property key.
- **Defensive coding against messy real-world data.** Guarding against missing fields so one bad record can't crash the whole list.
---
 
## Stretch Features (beyond the rubric)
 
- **Click-to-filter categories** — clicking a category sticker filters the entire board to that category; an active-filter chip shows the current filter and clears it.
- **Sort controls** — sort by soonest date or float remote roles to the top.
- **Result count** — a "Showing X of Y" readout so the filtering is legible.
- **Staggered entrance animation** — cards "drop and pin" onto the board on load (and respect `prefers-reduced-motion` for accessibility).
- **Custom riso / bulletin-board visual theme** — hand-written CSS with a paper-grain background, pushpins, hard offset shadows, and colored category stickers, rather than a UI library.
- **On-demand pagination** — results load six at a time; the first page renders instantly and further pages are fetched only when the user navigates to them, rather than loading all 1,300+ at once.
- **Date ranges** — user-posted opportunities capture a start and end date, displayed in the same format as the API's ranges.
---
 
## Test Cases
 
Manual checks to confirm everything works:
 
| What to test | Steps | Expected result |
|---|---|---|
| API loads | Open the app | Cards appear after a brief "Loading…" message |
| Loading state | Throttle network in dev tools, reload | "Loading Opportunities…" shows first |
| Error state | Disconnect from the internet, reload | "Unable to load volunteer opportunities" shows |
| Search | Type a word from a title | List narrows to matching titles |
| Category filter | Click a category sticker | Board filters to that category; chip appears |
| Clear filter | Click the chip's × | Full list returns |
| Sort | Choose "Remote first" / "Date" | Order changes accordingly |
| Pagination | Click "Next" | Next 6 cards load; page number advances; scrolls to top |
| Pagination (back) | Page forward, then click "Prev" | Previous page returns instantly with no re-fetch |
| Create | Fill the form and submit | New card appears under "My Opportunities" |
| Required fields | Submit with a blank field | Browser blocks submit and prompts |
| Delete | Click "Remove flyer" on a posted card | Card disappears immediately |
| **Persistence** | Add an opportunity, then refresh (F5) | The opportunity is still there |
| **Persistence (delete)** | Delete one, then refresh | It stays gone |
 
---
 
## What I'd Do Differently / Future Improvements
 
- **True server-side search.** The Volunteer Connector API has no free-text search parameter — it only filters by category/cause IDs. To make typed search cover the whole catalog, the app loads all pages in the background and searches them client-side. This works well, but means there's a brief window during initial load where search is still incomplete (shown by the loading status). A fuller solution would use an API that supports server-side text queries, so the browser wouldn't need the entire dataset in memory.
- **Validate the date range.** The form currently allows an end date earlier than the start date. A check in the submit handler could prevent that.
- **Edit functionality.** The app supports create, read, and delete; adding *update* would complete full CRUD.
- **Avoid prop drilling.** As the app grew, the category-click function gets passed through several layers. React Context would clean this up in a larger app.
- **Extract a custom hook.** The fetch logic could be moved into a reusable `useFetch` hook.
- **Tests.** The `lib/` helpers are pure functions and would be straightforward to unit test.

---
 
## Built With
 
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Volunteer Connector API](https://www.volunteerconnector.org/)
