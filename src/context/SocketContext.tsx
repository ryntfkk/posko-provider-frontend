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
    // Ambil token dari localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        // Jika tidak ada token, jangan inisialisasi socket (tunggu login)
        return;
    }

    // Parsing URL API dengan aman
    // Pastikan env variable NEXT_PUBLIC_API_URL diisi dengan benar, misal: https://api.poskojasa.com
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let socketUrl = apiBaseUrl;
    
    try {
        // Normalisasi URL untuk mengambil origin saja (protocol + domain + port)
        // Contoh: 'https://api.poskojasa.com/api/v1' -> 'https://api.poskojasa.com'
        const urlObj = new URL(apiBaseUrl);
        socketUrl = urlObj.origin;
        console.log('[Socket] Initializing connection to:', socketUrl);
    } catch (error) {
        console.error('[Socket] Invalid API URL format provided in env, using raw value.', error);
    }

    // Inisialisasi Socket Client
    const socketInstance = io(socketUrl, {
      auth: {
        token: token, 
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      // [CRITICAL] withCredentials: true Wajib ada karena backend mengecek origin spesifik
      withCredentials: true, 
      // Gunakan polling terlebih dahulu untuk kompatibilitas maksimal, baru upgrade ke websocket
      // Ini membantu menghindari blokir firewall/proxy awal pada AWS
      transports: ['polling', 'websocket'], 
      path: '/socket.io/', // Path default, ditulis eksplisit untuk kejelasan
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully. ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('⚠️ Socket connection error:', err.message);
      
      // Handle spesifik error autentikasi dari middleware backend
      if (err.message === 'Authentication error') {
        console.warn('⛔ Auth failed. Stopping reconnection attempts.');
        socketInstance.disconnect(); 
        
        // Opsional: Redirect ke login jika token kadaluarsa/invalid
        // localStorage.removeItem('posko_token');
        // router.push('/login');
      }
    });

    setSocket(socketInstance);

    // Cleanup saat unmount
    return () => {
      if (socketInstance) {
        console.log('🔌 Unmounting SocketProvider, disconnecting...');
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