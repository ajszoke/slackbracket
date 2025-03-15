import React from 'react'
import { motion } from 'framer-motion'

export default function TeamCard({ team }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
      <h3 className="text-xl font-bold">{team.team} ({team.seed})</h3>
      <p className="text-gray-600">{team.conference}</p>
      <p>Elo: {team.elo.toFixed(1)}</p>
      <p>Home Court: {team.homeCourt.toFixed(1)}</p>
    </div>
  )
}