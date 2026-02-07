import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/index';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const PRODUCTION_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://bonaken.frankvdbrink.nl';

function getServerUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return PRODUCTION_SERVER_URL;
  }
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const serverUrl = getServerUrl();
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
