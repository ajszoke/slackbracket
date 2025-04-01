import React from 'react';
import { motion } from 'framer-motion';
import { calculateWinProbability } from '../utils/elo.js';

export default function TeamMatchup({
  teamA,
  teamB,
  round,
  chaosFactor,
  winners,
  setWinners,
  onSelectWinner,
  isCompact = false,
  isRightSide = false
}) {
  // If teams are not provided, show placeholders
  const showPlaceholders = !teamA || !teamB;
  
  // Calculate win probabilities if both teams are present
  let probA = 0.5;
  let probB = 0.5;
  
  if (teamA && teamB) {
    probA = calculateWinProbability(teamA, teamB, chaosFactor);
    probB = 1 - probA;
  }
  
  const probAPercent = (probA * 100).toFixed(1);
  const probBPercent = (probB * 100).toFixed(1);
  
  // Handle team selection
  const handleTeamSelect = (team) => {
    if (!team || !winners || !setWinners || !onSelectWinner) return;
    
    onSelectWinner(team.region, team.seed, team.team);
  };
  
  // Check if a team is selected as winner
  const isTeamASelected = teamA && winners && winners[`${teamA.region}-${teamA.seed}`] === teamA.team;
  const isTeamBSelected = teamB && winners && winners[`${teamB.region}-${teamB.seed}`] === teamB.team;
  
  // Apply styling based on selection
  const getTeamStyle = (isSelected) => {
    return isSelected
      ? 'bg-indigo-600 text-white border-2 border-yellow-400 shadow-lg'
      : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700';
  };
  
  return (
    <div className={`flex ${isCompact ? 'flex-col space-y-2' : 'flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2'} relative ${isCompact ? 'bracket-matchup' : ''}`}>
      {/* Connecting line for visual clarity */}
      {isCompact && (
        <div className="absolute left-0 right-0 h-full pointer-events-none">
          <div className="absolute left-[50%] top-[calc(50%-0.5px)] w-[1px] h-[calc(100%-28px)] bg-indigo-300 dark:bg-indigo-700"></div>
        </div>
      )}
      
      {/* Team A */}
      <motion.div
        whileHover={teamA ? { scale: 1.03 } : {}}
        animate={{ 
          scale: isTeamASelected ? 1.05 : 1,
          boxShadow: isTeamASelected ? "0px 0px 8px rgba(99, 102, 241, 0.5)" : "none"
        }}
        onClick={() => handleTeamSelect(teamA)}
        className={`rounded-lg shadow-md ${isCompact ? 'p-2' : 'p-3'} cursor-pointer transition duration-300 ease-in-out relative flex-1 ${teamA ? getTeamStyle(isTeamASelected) : 'bg-gray-100 dark:bg-gray-700 opacity-50'} z-10`}
      >
        {teamA ? (
          <>
            {isTeamASelected && (
              <div className="absolute -right-1 -top-1 bg-yellow-400 text-indigo-700 rounded-full p-1 w-5 h-5 flex items-center justify-center font-bold text-xs z-10">✓</div>
            )}
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold ${isCompact ? 'mr-1' : 'mr-2'} ${isTeamASelected ? 'bg-yellow-400 text-indigo-700' : ''}`}>
                {teamA.seed}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${isCompact ? 'text-sm' : 'text-base'} truncate`}>{teamA.team}</div>
                {!isCompact && <div className="text-xs opacity-75">{teamA.conference}</div>}
              </div>
              
              {/* Display win probability inline for compact view */}
              {isCompact && (
                <div className={`text-xs font-semibold ${isTeamASelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {probAPercent}%
                </div>
              )}
            </div>
            
            {!isCompact && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-green-400 to-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${probAPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="mt-1 text-xs">Win: {probAPercent}%</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm opacity-70">TBD</div>
          </div>
        )}
      </motion.div>
      
      {!isCompact && (
        <div className="flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400">
          VS
        </div>
      )}
      
      {/* Team B */}
      <motion.div
        whileHover={teamB ? { scale: 1.03 } : {}}
        animate={{ 
          scale: isTeamBSelected ? 1.05 : 1,
          boxShadow: isTeamBSelected ? "0px 0px 8px rgba(99, 102, 241, 0.5)" : "none"
        }}
        onClick={() => handleTeamSelect(teamB)}
        className={`rounded-lg shadow-md ${isCompact ? 'p-2' : 'p-3'} cursor-pointer transition duration-300 ease-in-out relative flex-1 ${teamB ? getTeamStyle(isTeamBSelected) : 'bg-gray-100 dark:bg-gray-700 opacity-50'} z-10`}
      >
        {teamB ? (
          <>
            {isTeamBSelected && (
              <div className="absolute -right-1 -top-1 bg-yellow-400 text-indigo-700 rounded-full p-1 w-5 h-5 flex items-center justify-center font-bold text-xs z-10">✓</div>
            )}
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold ${isCompact ? 'mr-1' : 'mr-2'} ${isTeamBSelected ? 'bg-yellow-400 text-indigo-700' : ''}`}>
                {teamB.seed}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${isCompact ? 'text-sm' : 'text-base'} truncate`}>{teamB.team}</div>
                {!isCompact && <div className="text-xs opacity-75">{teamB.conference}</div>}
              </div>
              
              {/* Display win probability inline for compact view */}
              {isCompact && (
                <div className={`text-xs font-semibold ${isTeamBSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {probBPercent}%
                </div>
              )}
            </div>
            
            {!isCompact && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-green-400 to-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${probBPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="mt-1 text-xs">Win: {probBPercent}%</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm opacity-70">TBD</div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 