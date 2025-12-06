// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation'; // Tambahkan router untuk redirect jika perlu

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
    // Ambil token
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        return;
    }

    // Parsing URL API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let socketUrl = apiBaseUrl;
    try {
        const urlObj = new URL(apiBaseUrl);
        socketUrl = urlObj.origin;
    } catch (error) {
        console.error('[Socket] Invalid API URL format, using fallback.', error);
    }

    const socketInstance = io(socketUrl, {
      auth: {
        token: token, 
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      withCredentials: true, 
      transports: ['websocket', 'polling'], 
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // [FIX] Handle Authentication Error
    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Socket connection error:', err.message);
      
      // Jika server menolak karena Auth Error, jangan paksa reconnect terus-menerus
      if (err.message === 'Authentication error') {
        console.warn('⛔ Stopping socket reconnection due to auth failure.');
        socketInstance.disconnect(); // Matikan koneksi
        
        // Opsional: Jika token invalid, bisa kita hapus agar user login ulang
        // localStorage.removeItem('posko_token');
        // router.push('/login'); 
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]); // Tambahkan dependency

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};