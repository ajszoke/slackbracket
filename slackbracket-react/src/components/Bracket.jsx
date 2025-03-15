import React from 'react'
import TeamCard from './TeamCard'

export default function Bracket({ bracketData }) {
  const regions = ["East", "West", "South", "Midwest"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {regions.map(region => (
        <div key={region}>
          <h2 className="text-xl font-bold">{region}</h2>
          <div className="space-y-2 mt-3">
            {bracketData
              .filter(team => team.region === region)
              .sort((a, b) => a.seed - b.seed)
              .map(team => <TeamCard key={team.team} team={team} />)
          }
          </div>
        </div>
      ))}
    </div>
  );
}