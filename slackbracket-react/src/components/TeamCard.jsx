import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateWinProbability } from '../utils/elo.js'

export default function TeamCard({ team, opponent, chaosFactor, winners, setWinners, onSelectWinner }) {
  const prob = calculateWinProbability(team, opponent, chaosFactor)
  const probPercent = (prob * 100).toFixed(1)
  const [highlight, setHighlight] = useState(false)

  const teamKey = `${team.region}-${team.seed}`
  const isSelected = winners[teamKey] === team.team

  // Add a brief highlight animation effect when selected
  useEffect(() => {
    if (isSelected) {
      setHighlight(true)
      const timer = setTimeout(() => setHighlight(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isSelected])

  function handleClick() {
    // Use both methods for maximum compatibility
    if (onSelectWinner) {
      onSelectWinner(team.region, team.seed, team.team);
    }
    
    // Also use the direct setWinners for backward compatibility
    setWinners(prev => {
      const newState = {
        ...prev,
        [teamKey]: team.team
      };
      return newState;
    })
  }

  // Apply more distinctive styling for selected teams
  const cardStyle = isSelected 
    ? 'bg-indigo-600 text-white border-2 border-yellow-400 shadow-lg transform scale-105' 
    : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700';

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      animate={{ 
        scale: highlight ? 1.1 : isSelected ? 1.05 : 1,
        boxShadow: isSelected ? "0px 0px 8px rgba(99, 102, 241, 0.5)" : "none"
      }}
      onClick={handleClick}
      className={`rounded-lg shadow-md p-4 cursor-pointer transition duration-300 ease-in-out relative ${cardStyle}`}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 bg-yellow-400 text-indigo-700 rounded-full p-1 w-6 h-6 flex items-center justify-center font-bold text-sm z-10">✓</div>
      )}
      <h3 className="text-lg font-semibold">{team.seed}. {team.team}</h3>
      <p className="text-sm">{team.conference}</p>
      <div className="mt-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-3 bg-gradient-to-r from-green-400 to-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${probPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-1 text-xs font-semibold">
          Win vs {opponent.team}: {probPercent}%
        </div>
      </div>
    </motion.div>
  )
}