import { GameProvider, useGame } from './contexts/GameContext';
import { StartScreen } from './components/StartScreen';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';

function GameRouter() {
  const { gamePhase } = useGame();

  // Show lobby when in lobby phase
  if (gamePhase === 'lobby') {
    return <Lobby />;
  }

  // Show game screen when game starts
  if (gamePhase === 'dealing' || gamePhase === 'bonaken' ||
      gamePhase === 'trump-selection' || gamePhase === 'playing' ||
      gamePhase === 'round-end' || gamePhase === 'game-end') {
    return <GameScreen />;
  }

  // Default: show start screen
  return <StartScreen />;
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
