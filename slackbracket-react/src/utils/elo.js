export function calculateWinProbability(teamA, teamB, neutralSite = true, chaosFactor = 0.5, venue = null) {
    const eloDiff = teamAEloDiff(teamA, teamB, venue, neutral);
    const baseProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  
    // Chaos Control (0 = chalk, 1 = chaos)
    return baseProb * (1 - chaosFactor) + (0.5 * chaosFactor);
  }
  
  function eloDiff(teamA, teamB, venue, neutral) {
    const homeBonus = neutral ? 0 : teamA.homeCourt;
    const adjustedEloDiff = teamA.elo - teamB.elo + (neutral ? 0 : homeBonusForVenue(teamA, venue));
    return adjustedEloDiff;
  }