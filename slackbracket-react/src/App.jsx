import React, { useState, useEffect } from 'react'
import Bracket from './components/Bracket'
import ChaosControl from './components/ChaosControl'

function App() {
  const [bracketData, setBracketData] = useState([])
  const [chaosFactor, setChaosFactor] = useState(0.25)
  const [bracket, setBracket] = useState('men')

  useEffect(() => {
    fetch(bracket === 'men' ? './data/demo_bracket_full.json' : './data/demo_bracket_full_women.json')
      .then((res) => res.json())
      .then(setBracketData)
      .catch(console.error)
  }, [bracket])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setBracket('men')}
            className={`px-4 py-2 rounded-lg transition ${
              bracket === 'men' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            Men's Bracket
          </button>
          <button
            onClick={() => setBracket('women')}
            className={`px-4 py-2 rounded-lg transition ${
              bracket === 'women' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            Women's Bracket
          </button>
        </div>

        <ChaosControl chaosFactor={chaosFactor} setChaosFactor={setChaosFactor} />

        <Bracket bracketData={bracketData} chaosFactor={chaosFactor} />
      </div>
    </div>
  )
}

export default App