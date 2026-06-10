import OpportunityCard from "./OpportunityCard.jsx";

function OpportunityList({ opportunities, loading, error }) {
  if (loading) return <p>Loading Opportunities…</p>;
  if (error) return <p>Unable to load volunteer opportunities</p>;
  if (opportunities.length === 0) return <p>No opportunities found.</p>;

  return (
    <div className="list">
      {opportunities.map((opp) => (
        <OpportunityCard key={opp.id} opportunity={opp} />
      ))}
    </div>
  );
}

export default OpportunityList;