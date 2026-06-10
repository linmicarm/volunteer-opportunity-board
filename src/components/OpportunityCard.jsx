// ===========================================================================
// OpportunityCard.jsx — displays ONE opportunity as a "flyer pinned to a
// board." Reused by both OpportunityList (API data) and MyOpportunities
// (user data). The same component behaves differently based on which props
// it receives: it only shows a delete button when given an onDelete function.
// ===========================================================================

import { formatLocation } from "../lib/formatLocation.js";
import { formatDate } from "../lib/formatDate.js";
import { categoryColor } from "../lib/categoryColor.js";
import { getCategories } from "../lib/filters.js";

function OpportunityCard({
  opportunity,
  onDelete,
  onCategoryClick,
  activeCategory,
}) {
  // Pull the fields we need off the opportunity object.
  const {
    id,
    title,
    description,
    organization,
    dates,
    audience,
    remote_or_online,
  } = opportunity;

  // getCategories handles both data shapes (API activities array vs. the
  // user's single category string) and returns a clean, deduped list.
  const categories = getCategories(opportunity);

  // Location: API cards carry an `audience` object; user cards carry a plain
  // `location` string. Use whichever is present.
  const location = audience
    ? formatLocation(audience)
    : opportunity.location || "Location not specified";

  // Date display. API cards have a pre-formatted `dates` string. User cards
  // have separate startDate/endDate ISO strings, which we format and join
  // into the same "Start - End" range style as the API.
  let dateRange;
  if (dates) {
    dateRange = dates; // API: already a readable range
  } else if (opportunity.startDate) {
    dateRange =
      formatDate(opportunity.startDate) + " - " + formatDate(opportunity.endDate);
  } else {
    dateRange = "Flexible";
  }

  return (
    <article className="card">
      {/* decorative pushpin */}
      <span className="pin" aria-hidden="true"></span>

      {/* a "Remote" stamp, shown only when the role is remote */}
      {remote_or_online && <span className="remote-flag">Remote</span>}

      <h3>{title}</h3>
      <p className="org">{organization?.name || "Community Submission"}</p>

      {/* Category stickers. Each is a button so it can be clicked to filter
          the board by that category. The active one gets an extra class. */}
      <div className="tags">
        {categories.map((cat) => (
          <button
            key={cat}
            className={
              "tag tag-" +
              categoryColor(cat) +
              (cat === activeCategory ? " tag-active" : "")
            }
            onClick={() => onCategoryClick && onCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="desc">{description}</p>

      {/* Metadata as a description list (semantically correct for
          label/value pairs). formatDate normalises user-entered ISO dates
          to a readable form while leaving API date ranges untouched. */}
      <dl className="meta">
        <div>
          <dt>When</dt>
          <dd>{dateRange}</dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>{location}</dd>
        </div>
      </dl>

      {/* The delete button only renders when an onDelete function was passed
          (i.e. for the user's own opportunities, not API ones). */}
      {onDelete && (
        <button className="delete-btn" onClick={() => onDelete(id)}>
          Remove flyer
        </button>
      )}
    </article>
  );
}

export default OpportunityCard;