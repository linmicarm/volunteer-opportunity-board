// ===========================================================================
// Pagination.jsx — Previous / Next controls for on-demand paging.
//
// Because pages are fetched as needed, the TOTAL number of pages isn't known
// up front. So instead of "Page X of Y" we show "Page X" and simply enable
// or disable Next based on whether more results exist (loaded or fetchable).
// Owns no state; everything comes in as props and clicks report back up.
// ===========================================================================

function Pagination({ currentPage, hasNextPage, onPrev, onNext, loading }) {
  const isFirst = currentPage <= 1;

  return (
    <div className="pagination">
      <button className="page-btn" onClick={onPrev} disabled={isFirst}>
        ← Prev
      </button>

      <span className="page-status">Page {currentPage}</span>

      <button
        className="page-btn"
        onClick={onNext}
        disabled={!hasNextPage || loading}
      >
        {loading ? "Loading…" : "Next →"}
      </button>
    </div>
  );
}

export default Pagination;