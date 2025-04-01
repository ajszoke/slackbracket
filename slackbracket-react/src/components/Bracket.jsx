import React from 'react'
import TeamCard from './TeamCard'
import AdvancedTeam from './AdvancedTeam'

// First round matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const roundMatchups = {
  1: [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]],
  2: [[1,8],[5,4],[6,3],[7,2]],  // Second round example
  3: [[1,5],[6,7]],              // Sweet 16 example
  4: [[1,6]],                    // Elite 8 example
  5: [[0,0]],                    // Final Four
  6: [[0,0]]                     // Championship
};

export default function Bracket({ 
  bracketData, 
  chaosFactor, 
  winners, 
  setWinners, 
  onSelectWinner, 
  currentRound = 1,
  allRounds = {} 
}) {
  const regions = ["East", "West", "South", "Midwest"];
  
  // Helper to find a team that advanced from a previous round
  const findAdvancedTeam = (region, seedFromPreviousRound) => {
    if (currentRound === 1) return null;
    
    // Look for this team in the previous round's winners
    const previousRoundWinners = allRounds[currentRound - 1] || {};
    const key = `${region}-${seedFromPreviousRound}`;
    const teamName = previousRoundWinners[key];
    
    if (!teamName) return null;
    
    // Find the full team data
    return bracketData.find(t => t.region === region && t.team === teamName);
  };
  
  // Get matchups for the current round
  const matchups = roundMatchups[currentRound] || roundMatchups[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 py-8">
      {regions.map(region => {
        const teams = bracketData.filter(team => team.region === region);
        
        return (
          <div key={region} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{region}</h2>
            
            <div className="space-y-4">
              {currentRound === 1 && (
                // First round - use seed-based matchups
                matchups.map(([seedA, seedB]) => {
                  const teamA = teams.find(t => t.seed === seedA);
                  const teamB = teams.find(t => t.seed === seedB);
                  if (!teamA || !teamB) return null;
                  
                  return (
                    <div key={seedA} className="mb-6">
                      <TeamCard 
                        team={teamA} 
                        opponent={teamB} 
                        chaosFactor={chaosFactor} 
                        winners={winners} 
                        setWinners={setWinners}
                        onSelectWinner={onSelectWinner} 
                      />
                      <div className="my-2"></div>
                      <TeamCard 
                        team={teamB} 
                        opponent={teamA} 
                        chaosFactor={chaosFactor} 
                        winners={winners} 
                        setWinners={setWinners}
                        onSelectWinner={onSelectWinner} 
                      />
                    </div>
                  );
                })
              )}
              
              {currentRound > 1 && (
                // Later rounds - use advancing teams
                matchups.map(([seedA, seedB], index) => {
                  const teamA = findAdvancedTeam(region, seedA);
                  const teamB = findAdvancedTeam(region, seedB);
                  
                  return (
                    <div key={index} className="mb-6 border-t-2 border-indigo-200 dark:border-indigo-800 pt-4">
                      {teamA ? (
                        <TeamCard 
                          team={teamA} 
                          opponent={teamB || {team: "TBD", seed: 0, elo: 1500, conference: "N/A"}} 
                          chaosFactor={chaosFactor} 
                          winners={winners} 
                          setWinners={setWinners}
                          onSelectWinner={onSelectWinner} 
                        />
                      ) : (
                        <AdvancedTeam 
                          isPlaceholder 
                          roundNumber={currentRound}
                          seedNumber={seedA}
                        />
                      )}
                      
                      <div className="my-2"></div>
                      
                      {teamB ? (
                        <TeamCard 
                          team={teamB} 
                          opponent={teamA || {team: "TBD", seed: 0, elo: 1500, conference: "N/A"}} 
                          chaosFactor={chaosFactor} 
                          winners={winners} 
                          setWinners={setWinners}
                          onSelectWinner={onSelectWinner} 
                        />
                      ) : (
                        <AdvancedTeam 
                          isPlaceholder 
                          roundNumber={currentRound}
                          seedNumber={seedB}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}