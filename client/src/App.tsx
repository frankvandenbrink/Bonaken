import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { GameProvider, useGame } from './contexts/GameContext';
import { StartScreen } from './components/StartScreen';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';

function GameRouter() {
  const { gamePhase, leaveGame } = useGame();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener('backButton', () => {
      if (!gamePhase) {
        CapApp.minimizeApp();
      } else if (gamePhase === 'lobby') {
        leaveGame();
      }
      // During gameplay: do nothing (prevent accidental exit)
    });

    return () => { listener.then(l => l.remove()); };
  }, [gamePhase, leaveGame]);

  // Show lobby when in lobby phase
  if (gamePhase === 'lobby') {
    return <Lobby />;
  }

  // Show game screen when game starts
  if (gamePhase === 'dealing' || gamePhase === 'bidding' ||
      gamePhase === 'card-swap' || gamePhase === 'trump-selection' ||
      gamePhase === 'playing' || gamePhase === 'round-end' || gamePhase === 'game-end') {
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
