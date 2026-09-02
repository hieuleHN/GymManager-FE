import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, getToken } from '../context/AuthContext';

let sharedSocket: Socket | null = null;
let sharedSocketUserKey: string | null = null;

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(sharedSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const key = user.id;
    if (sharedSocket && sharedSocketUserKey === key) {
      socketRef.current = sharedSocket;
      setIsConnected(sharedSocket.connected);
      return;
    }

    if (sharedSocket) {
      sharedSocket.disconnect();
      sharedSocket = null;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: { token: getToken() }
    });
    sharedSocket = socketRef.current;
    sharedSocketUserKey = key;

    sharedSocket.on('connect', () => {
      setIsConnected(true);
      sharedSocket?.emit('join', {
        userId: user.id,
        userType: user.isStaff ? 'huan_luyen_vien' : 'hoi_vien'
      });
    });

    sharedSocket.on('disconnect', () => {
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