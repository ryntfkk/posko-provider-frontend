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
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        return;
    }

    // [FIX] Validasi URL API lebih ketat untuk mencegah error 'wss://https/...'
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    let socketUrl = 'http://localhost:4000'; // Default fallback

    if (apiBaseUrl && apiBaseUrl.startsWith('http')) {
        try {
            const urlObj = new URL(apiBaseUrl);
            socketUrl = urlObj.origin; // Ambil origin saja (https://domain.com)
        } catch (error) {
            console.error('[Socket] Invalid URL format, using fallback:', error);
        }
    } else if (apiBaseUrl) {
        console.warn('[Socket] NEXT_PUBLIC_API_URL seems invalid:', apiBaseUrl);
    }

    console.log('[Socket] Connecting to:', socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      withCredentials: true,
      transports: ['polling', 'websocket'], // [FIX] Coba polling dulu untuk stabilitas
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Socket connection error:', err.message);
      if (err.message === 'Authentication error') {
        socketInstance.disconnect(); 
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};