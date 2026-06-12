// ===========================================================================
// Header.jsx — the masthead. Purely presentational: it displays the total
// opportunity count it receives as a prop. The total is the API's true
// catalog count (not just what's loaded so far), formatted with commas.
// ===========================================================================

function Header({ total }) {
  return (
    <header>
      <h1>Volunteer Opportunity Board</h1>
      <p>{total.toLocaleString()} opportunities available</p>
    </header>
  );
}

export default Header;