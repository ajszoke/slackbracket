import React from 'react'
import { motion } from 'framer-motion'

export default function AdvancedTeam({ isPlaceholder, roundNumber, seedNumber }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="rounded-lg shadow-md p-4 cursor-default border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
    >
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs">
          {seedNumber || '?'}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Winner Advances Here</h3>
          <p className="text-sm italic">From previous round</p>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden opacity-50">
          <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 w-0"></div>
        </div>
        <div className="mt-1 text-xs font-semibold opacity-75">
          Select previous matchup first
        </div>
      </div>
    </motion.div>
  )
} 