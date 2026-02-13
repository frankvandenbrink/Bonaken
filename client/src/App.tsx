import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { GameProvider, useGame } from './contexts/GameContext';
import { StartScreen } from './components/StartScreen';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { ChatBubble } from './components/ChatBubble';

function GameRouter() {
  const { gameId, gamePhase, leaveGame } = useGame();

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

  const isPlaying = gamePhase === 'dealing' || gamePhase === 'bidding' ||
    gamePhase === 'card-swap' || gamePhase === 'trump-selection' ||
    gamePhase === 'playing' || gamePhase === 'round-end' || gamePhase === 'game-end';

  return (
    <>
      {gamePhase === 'lobby' && <Lobby />}
      {isPlaying && <GameScreen />}
      {!gamePhase && <StartScreen />}
      {gameId && <ChatBubble />}
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
