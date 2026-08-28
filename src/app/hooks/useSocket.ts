import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || user.isAdmin) return; // Admin does not need chat, or user not logged in

    let token = '';
    try {
      token = JSON.parse(localStorage.getItem('auth_user') || '{}')?.token || '';
    } catch {
      token = '';
    }

    socketRef.current = io(SOCKET_URL, { auth: { token } });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current?.emit('join', user.id);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return { socket: socketRef.current, isConnected };
};
