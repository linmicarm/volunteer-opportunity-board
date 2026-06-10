import OpportunityCard from "./OpportunityCard.jsx";

function MyOpportunities({ opportunities, onDelete }) {
  if (opportunities.length === 0) {
    return <p>You haven't added any opportunities yet.</p>;
  }

  return (
    <div className="list">
      {opportunities.map((opp) => (
        <OpportunityCard key={opp.id} opportunity={opp} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default MyOpportunities;