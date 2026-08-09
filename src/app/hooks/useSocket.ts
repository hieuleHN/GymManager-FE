import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, getToken } from '../context/AuthContext';

let sharedSocket: Socket | null = null;
let sharedSocketUserKey: string | null = null;

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

    const socketUrl = 'http://localhost:5000';
    sharedSocket = io(socketUrl, {
      auth: { token: getToken() }
    });
    sharedSocketUserKey = key;
    socketRef.current = sharedSocket;

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

    return () => {};
  }, [user]);

  return { socket: socketRef.current, isConnected };
};
