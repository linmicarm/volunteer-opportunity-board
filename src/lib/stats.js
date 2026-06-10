export function totalOpportunities(opportunities) {
  return opportunities.length;
}

export function remoteCount(opportunities) {
  return opportunities.filter((opp) => opp.remote_or_online === true).length;
}
