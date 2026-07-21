import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || user.isAdmin) return; // Admin does not need chat, or user not logged in

    const socketUrl = 'http://localhost:5000';
    socketRef.current = io(socketUrl);

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
      }
    };
  }, [user]);

  return { socket: socketRef.current, isConnected };
};
