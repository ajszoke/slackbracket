export function calculateWinProbability(teamA, teamB, chaosFactor = 0.25, neutral = true) {
    const homeBonus = neutral ? 0 : teamA.homeCourt
    const eloDiff = (teamA.elo + homeBonus) - teamB.elo
    const baseProbability = 1 / (1 + Math.pow(10, -eloDiff / 400))
  
    return baseProbability * (1 - chaosFactor) + (0.5 * chaosFactor)
  }