import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/index';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In production, connect to same origin; in dev, connect to localhost:3001
    const serverUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';
    const socket: TypedSocket = io(serverUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Verbonden met server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Verbinding verbroken');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (socketRef.current) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler as any);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler as any);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on
  };
}
