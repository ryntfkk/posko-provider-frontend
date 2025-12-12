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
    // Ambil token
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        return;
    }

    // [FIX] Validasi URL API lebih ketat
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    let socketUrl = 'http://localhost:4000'; // Default fallback

    if (apiBaseUrl) {
        try {
            // Pastikan URL valid dan memiliki protocol
            const urlObj = new URL(apiBaseUrl);
            // Gunakan origin (protocol + domain + port) tanpa path
            socketUrl = urlObj.origin;
        } catch (error) {
            console.error('[Socket] Invalid NEXT_PUBLIC_API_URL format:', apiBaseUrl, error);
            // Jangan override socketUrl jika error, biarkan fallback atau gunakan string raw jika perlu
        }
    }

    console.log('[Socket] Initializing connection to:', socketUrl);

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

    // Handle Authentication Error
    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Socket connection error:', err.message);
      
      if (err.message === 'Authentication error') {
        console.warn('⛔ Stopping socket reconnection due to auth failure.');
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