// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Cek Token
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;
    if (!token) return;

    // [FIX] Kita Hardcode URL sementara untuk memastikan tidak ada kesalahan parsing ENV
    // Hapus '/api' di belakang karena Socket.io dipasang di root '/'
    const SOCKET_URL = 'https://api.poskojasa.com';

    console.log('[Socket] Connecting to:', SOCKET_URL);

    // 2. Inisialisasi Socket
    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token, 
      },
      // [PENTING] Path harus sesuai dengan Nginx location /socket.io/
      path: '/socket.io/', 
      
      // Strategi Koneksi:
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      
      // Keamanan:
      withCredentials: true, 
      
      // Transports: Mulai dengan Polling (lebih stabil), lalu upgrade ke WebSocket
      transports: ['polling', 'websocket'],
    });

    // 3. Event Listeners
    socketInstance.on('connect', () => {
      console.log('✅ Socket Connected! ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('❌ Socket Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Socket Error:', err.message);
      
      // Jika token salah/expired, jangan reconnect terus menerus
      if (err.message === 'Authentication error') {
        console.error('⛔ Authentication failed. Logging out...');
        socketInstance.disconnect();
        // Opsional: Redirect ke login
        // router.push('/login'); 
      }
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};