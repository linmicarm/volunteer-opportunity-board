function Header({ total, remote }) {
  return (
    <header>
      <h1>Volunteer Opportunity Board</h1>
      <p>{total} opportunities · {remote} remote</p>
    </header>
  );
}

export default Header;