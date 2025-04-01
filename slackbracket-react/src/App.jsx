import React, { useState, useEffect } from 'react'
import BracketLayout from './components/BracketLayout'
import ChaosControl from './components/ChaosControl'

function App() {
  const [bracket, setBracket] = useState('men')
  const [bracketData, setBracketData] = useState([])
  const [allData, setAllData] = useState({ men: [], women: [] })
  const [chaosFactor, setChaosFactor] = useState(0.50)  // thanos.gif
  const [rounds, setRounds] = useState({
    1: {}, // First round winners (64 -> 32)
    2: {}, // Second round (32 -> 16)
    3: {}, // Sweet 16 (16 -> 8)
    4: {}, // Elite 8 (8 -> 4)
    5: {}, // Final Four (4 -> 2)
    6: {}  // Championship (2 -> 1)
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const roundNames = [
    "First Round",
    "Second Round",
    "Sweet 16",
    "Elite 8",
    "Final Four",
    "Championship"
  ];

  function handleBracketSwitch(newBracket) {
    setBracket(newBracket)
    setBracketData(allData[newBracket])
  }

  // Navigate directly to a specific round
  const navigateToRound = (roundNumber) => {
    // Only allow navigation to rounds we've already reached
    if (roundNumber <= Math.max(currentRound, 1)) {
      setCurrentRound(roundNumber);
    }
  };

  // Handle winner selection for the current round
  const handleWinnerSelection = (region, seed, teamName) => {
    const key = `${region}-${seed}`;
    
    setRounds(prev => {
      const updatedRound = {
        ...prev[currentRound],
        [key]: teamName
      };
      
      return {
        ...prev,
        [currentRound]: updatedRound
      };
    });
  };

  // Advance to next round if enough teams have been selected
  const advanceRound = () => {
    // Only advance if we have selected enough winners in the current round
    const currentWinners = Object.keys(rounds[currentRound]).length;
    const requiredWinners = 32 / Math.pow(2, currentRound - 1); // 32, 16, 8, 4, 2, 1
    
    if (currentWinners >= requiredWinners) {
      setCurrentRound(prev => Math.min(prev + 1, 6)); // Max round is 6 (championship)
    } else {
      alert(`Please select ${requiredWinners - currentWinners} more winners to advance.`);
    }
  };

  // Initial data loading
  useEffect(() => {
    Promise.all([
      fetch('/data/demo_bracket_full.json').then(res => res.json()),
      fetch('/data/demo_bracket_full_women.json').then(res => res.json())
    ]).then(([menData, womenData]) => {
      setAllData({ men: menData, women: womenData });
      setBracketData(menData); // default to men's bracket
      setIsDataLoaded(true);
    })
    .catch(error => {
      console.error("Error loading bracket data:", error);
    });
  }, []); // Empty dependency array means this runs once on mount

  if (!isDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading bracket data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto pt-4 px-4">
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => handleBracketSwitch('men')}
            className={`px-4 py-2 rounded-lg transition ${
              bracket === 'men' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            Men's Bracket
          </button>
          <button
            onClick={() => handleBracketSwitch('women')}
            className={`px-4 py-2 rounded-lg transition ${
              bracket === 'women' ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            Women's Bracket
          </button>
        </div>

        <div className="mb-6">
          <ChaosControl chaosFactor={chaosFactor} setChaosFactor={setChaosFactor} />
          
          {/* Round progress bar */}
          <div className="mt-4 mb-6">
            <div className="flex justify-between mb-2">
              {roundNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => navigateToRound(index + 1)}
                  disabled={index + 1 > currentRound}
                  className={`text-xs font-semibold transition ${
                    index + 1 <= currentRound
                      ? 'text-indigo-600 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(currentRound / 6) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {roundNames[currentRound - 1]}
            </h2>
            <button 
              onClick={advanceRound}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              disabled={currentRound >= 6}
            >
              {currentRound < 6 ? 'Advance to Next Round →' : 'Final Champion Selected!'}
            </button>
          </div>
        </div>

        <BracketLayout 
          bracketData={bracketData} 
          chaosFactor={chaosFactor} 
          winners={rounds[currentRound]} 
          setWinners={(newWinners) => setRounds(prev => ({...prev, [currentRound]: newWinners}))}
          onSelectWinner={handleWinnerSelection}
          currentRound={currentRound}
          allRounds={rounds}
        />
      </div>
    </div>
  )
}

export default App