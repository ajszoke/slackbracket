import React from 'react';
import { motion } from 'framer-motion';
import TeamMatchup from './TeamMatchup';

export default function BracketLayout({ 
  bracketData, 
  chaosFactor, 
  winners, 
  setWinners, 
  onSelectWinner, 
  currentRound = 1,
  allRounds = {} 
}) {
  // For simplicity, let's focus on just the East region first
  const region = "East";
  const teams = bracketData.filter(team => team.region === region);

  // Helper to find team by seed
  const getTeamBySeed = (seed) => teams.find(t => t.seed === seed);

  // Helper to find a team that advanced from a previous round
  const findAdvancedTeam = (round, seed) => {
    if (round <= 1) return getTeamBySeed(seed);
    
    const previousRoundWinners = allRounds[round - 1] || {};
    const key = `${region}-${seed}`;
    const teamName = previousRoundWinners[key];
    
    if (!teamName) return null;
    return bracketData.find(t => t.region === region && t.team === teamName);
  };

  // First round matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  const matchups = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">{region} Region</h2>
      
      <div className="flex overflow-x-auto pb-4">
        {/* Round 1 */}
        <div className="flex flex-col justify-between min-w-[180px] space-y-4">
          <h3 className="text-center font-semibold text-lg mb-2">Round 1</h3>
          
          {matchups.map(([seedA, seedB], idx) => (
            <div key={`r1-${idx}`} className="relative flex flex-col">
              <div className="h-16">
                <TeamCompact 
                  team={getTeamBySeed(seedA)}
                  opponent={getTeamBySeed(seedB)}
                  winners={currentRound === 1 ? winners : {}}
                  round={1}
                  chaosFactor={chaosFactor}
                  setWinners={currentRound === 1 ? setWinners : null}
                  onSelectWinner={currentRound === 1 ? onSelectWinner : null}
                />
              </div>
              <div className="h-16">
                <TeamCompact 
                  team={getTeamBySeed(seedB)}
                  opponent={getTeamBySeed(seedA)}
                  winners={currentRound === 1 ? winners : {}}
                  round={1}
                  chaosFactor={chaosFactor}
                  setWinners={currentRound === 1 ? setWinners : null}
                  onSelectWinner={currentRound === 1 ? onSelectWinner : null}
                />
              </div>
              {/* Connector to next round */}
              <div className={`absolute right-0 top-1/2 w-4 border-t-2 border-indigo-300 dark:border-indigo-700`}></div>
            </div>
          ))}
        </div>
        
        {/* Round 2 */}
        <div className="flex flex-col justify-between min-w-[180px] space-y-4">
          <h3 className="text-center font-semibold text-lg mb-2">Round 2</h3>
          
          {[0, 1, 2, 3].map(idx => {
            const matchupIdx = idx * 2;
            const [seedA] = matchups[matchupIdx];
            const [_, seedB] = matchups[matchupIdx + 1];
            
            const teamA = findAdvancedTeam(2, seedA);
            const teamB = findAdvancedTeam(2, seedB);
            
            return (
              <div key={`r2-${idx}`} className="relative flex flex-col my-8">
                <div className="h-32">
                  <TeamCompact 
                    team={teamA}
                    opponent={teamB}
                    winners={currentRound === 2 ? winners : {}}
                    round={2}
                    chaosFactor={chaosFactor}
                    setWinners={currentRound === 2 ? setWinners : null}
                    onSelectWinner={currentRound === 2 ? onSelectWinner : null}
                  />
                  <div className="h-4"></div>
                  <TeamCompact 
                    team={teamB}
                    opponent={teamA}
                    winners={currentRound === 2 ? winners : {}}
                    round={2}
                    chaosFactor={chaosFactor}
                    setWinners={currentRound === 2 ? setWinners : null}
                    onSelectWinner={currentRound === 2 ? onSelectWinner : null}
                  />
                </div>
                {/* Connector to next round */}
                <div className={`absolute right-0 top-1/2 w-4 border-t-2 border-indigo-300 dark:border-indigo-700`}></div>
              </div>
            );
          })}
        </div>
        
        {/* Sweet 16 */}
        <div className="flex flex-col justify-between min-w-[180px] space-y-4">
          <h3 className="text-center font-semibold text-lg mb-2">Sweet 16</h3>
          
          {[0, 1].map(idx => {
            const matchupIdx = idx * 2;
            const seedA = matchups[matchupIdx][0];
            const seedB = matchups[matchupIdx + 2][0];
            
            const teamA = findAdvancedTeam(3, seedA);
            const teamB = findAdvancedTeam(3, seedB);
            
            return (
              <div key={`r3-${idx}`} className="relative flex flex-col my-16">
                <div className="h-32">
                  <TeamCompact 
                    team={teamA}
                    opponent={teamB}
                    winners={currentRound === 3 ? winners : {}}
                    round={3}
                    chaosFactor={chaosFactor}
                    setWinners={currentRound === 3 ? setWinners : null}
                    onSelectWinner={currentRound === 3 ? onSelectWinner : null}
                  />
                  <div className="h-4"></div>
                  <TeamCompact 
                    team={teamB}
                    opponent={teamA}
                    winners={currentRound === 3 ? winners : {}}
                    round={3}
                    chaosFactor={chaosFactor}
                    setWinners={currentRound === 3 ? setWinners : null}
                    onSelectWinner={currentRound === 3 ? onSelectWinner : null}
                  />
                </div>
                {/* Connector to next round */}
                <div className={`absolute right-0 top-1/2 w-4 border-t-2 border-indigo-300 dark:border-indigo-700`}></div>
              </div>
            );
          })}
        </div>
        
        {/* Elite 8 */}
        <div className="flex flex-col justify-center min-w-[180px] space-y-4">
          <h3 className="text-center font-semibold text-lg mb-2">Elite 8</h3>
          
          <div className="relative flex flex-col my-32">
            <div className="h-32">
              <TeamCompact 
                team={findAdvancedTeam(4, 1)}
                opponent={findAdvancedTeam(4, 3)}
                winners={currentRound === 4 ? winners : {}}
                round={4}
                chaosFactor={chaosFactor}
                setWinners={currentRound === 4 ? setWinners : null}
                onSelectWinner={currentRound === 4 ? onSelectWinner : null}
              />
              <div className="h-4"></div>
              <TeamCompact 
                team={findAdvancedTeam(4, 3)}
                opponent={findAdvancedTeam(4, 1)}
                winners={currentRound === 4 ? winners : {}}
                round={4}
                chaosFactor={chaosFactor}
                setWinners={currentRound === 4 ? setWinners : null}
                onSelectWinner={currentRound === 4 ? onSelectWinner : null}
              />
            </div>
            {/* Final Four indicator */}
            <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 py-2 px-3 bg-indigo-600 text-white rounded-lg shadow-md text-sm font-semibold">
              Final Four
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact team display component for the bracket
function TeamCompact({ team, opponent, winners, round, chaosFactor, setWinners, onSelectWinner }) {
  if (!team) return (
    <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-center text-sm text-gray-400">
      TBD
    </div>
  );
  
  const isSelected = winners[`${team.region}-${team.seed}`] === team.team;
  
  const handleClick = () => {
    if (!setWinners || !onSelectWinner) return;
    onSelectWinner(team.region, team.seed, team.team);
  };
  
  // Calculate win probabilities
  let winProb = 0.5;
  if (opponent) {
    const calcProb = (team, opponent, chaosFactor) => {
      if (!team || !opponent) return 0.5;
      const eloDiff = team.elo - opponent.elo;
      const baseProbability = 1 / (1 + Math.pow(10, -eloDiff / 400));
      return baseProbability * (1 - chaosFactor) + (0.5 * chaosFactor);
    };
    
    winProb = calcProb(team, opponent, chaosFactor);
  }
  
  return (
    <div
      onClick={handleClick}
      className={`h-12 rounded px-2 py-1 border cursor-pointer hover:shadow-md transition-all ${
        isSelected 
          ? 'bg-indigo-600 text-white border-yellow-400 border-2' 
          : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center h-full">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-1 ${
          isSelected ? 'bg-yellow-400 text-indigo-700' : 'bg-indigo-100 dark:bg-indigo-900 text-gray-900 dark:text-white'
        }`}>
          {team.seed}
        </div>
        <div className="flex-1 truncate text-sm font-medium">
          {team.team}
        </div>
        <div className="text-xs font-semibold">
          {Math.round(winProb * 100)}%
        </div>
      </div>
    </div>
  );
} 