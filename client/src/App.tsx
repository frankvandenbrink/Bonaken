import { GameProvider, useGame } from './contexts/GameContext';
import { StartScreen } from './components/StartScreen';
import { Lobby } from './components/Lobby';

function GameRouter() {
  const { gamePhase } = useGame();

  // Show lobby when in lobby phase
  if (gamePhase === 'lobby') {
    return <Lobby />;
  }

  // Show dealing/game screen when game starts
  if (gamePhase === 'dealing' || gamePhase === 'bonaken' ||
      gamePhase === 'trump-selection' || gamePhase === 'playing' ||
      gamePhase === 'round-end' || gamePhase === 'game-end') {
    // TODO: Implement game screen in later phases
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        color: '#f5f5dc'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#d4af37' }}>
          Spel gestart!
        </h1>
        <p>Fase: {gamePhase}</p>
        <p style={{ opacity: 0.6 }}>
          (Game UI wordt in latere fasen geïmplementeerd)
        </p>
      </div>
    );
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
