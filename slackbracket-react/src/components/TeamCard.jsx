import React from 'react'
import { motion } from 'framer-motion'

export default function TeamCard({ team }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 cursor-pointer"
    >
      <h3 className="text-lg font-semibold">{team.seed}. {team.team}</h3>
      <div className="text-sm text-gray-600 dark:text-gray-300">{team.conference}</div>
      <div className="text-sm">Elo: <strong>{team.elo.toFixed(1)}</strong></div>
      <div className="text-sm">Home Court: {team.homeCourt.toFixed(1)}</div>
    </motion.div>
  )
}