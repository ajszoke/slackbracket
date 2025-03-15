import React from 'react'

export default function ChaosControl({ chaosFactor, setChaosFactor }) {
  return (
    <div className="p-4">
      <label className="block text-lg font-bold">Chaos Control 🌪️</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={chaosFactor}
        onChange={(e) => setChaosFactor(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="text-sm flex justify-between">
        <span>More Chalk</span>
        <span>More Chaos</span>
      </div>
    </div>
  )
}