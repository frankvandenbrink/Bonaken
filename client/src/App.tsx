import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/index';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function App() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket: TypedSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      console.log('Verbonden met server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Verbinding verbroken');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '1rem'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#d4af37' }}>Bonaken</h1>
      <p style={{
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        backgroundColor: isConnected ? '#2e7d32' : '#c62828',
        color: 'white'
      }}>
        {isConnected ? 'Verbonden met server' : 'Niet verbonden'}
      </p>
    </div>
  );
}

export default App;
