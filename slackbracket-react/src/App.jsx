import React, { useEffect, useState } from 'react'
import Bracket from './components/Bracket'
import ChaosControl from './components/ChaosControl'

function App() {
  const [bracketData, setBracketData] = useState([])
  const [bracket, setBracket] = useState('men')
  const [chaosFactor, setChaosFactor] = useState(0.2) // default chaos

  useEffect(() => {
    const file = bracket === 'men'
      ? './data/demo_bracket_full.json'
      : './data/demo_bracket_full_women.json'
      
    fetch(file)
      .then((res) => res.json())
      .then(setBracketData)
      .catch(console.error)
  }, [bracket])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setBracket('men')}
          className={`px-4 py-2 rounded ${bracket === 'men' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          Men's Bracket
        </button>
        <button
          onClick={() => setBracket('women')}
          className={`px-4 py-2 ${bracket === 'women' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          Women's Bracket
        </button>
      </div>

      <ChaosControl chaosFactor={chaosFactor} setChaosFactor={setChaosFactor} />
      <Bracket bracketData={bracketData} chaosFactor={chaosFactor} />
    </div>
  )
}

export default App