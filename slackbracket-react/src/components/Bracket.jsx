import React from 'react'
import { calculateWinProbability } from '../utils/elo'
import TeamCard from './TeamCard'

export default function Bracket({ bracketData, chaosFactor }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {bracketData.map((team, idx) => (
        <TeamCard
          key={idx}
          team={team}
          winProb={calculateWinProbability(team, opponentTeam, chaosFactor)}
        />
      ))}
    </div>
  )
}