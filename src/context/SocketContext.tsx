// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

  useEffect(() => {
    // Kita ambil token dari localStorage jika ada (untuk handshake auth)
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        // Jika tidak ada token, jangan connect socket (hemat resource)
        return;
    }

    // [PERBAIKAN] Logic URL: Hapus suffix '/api' dari URL API agar tidak dianggap sebagai namespace
    // Default port backend adalah 4000 (sesuai .env backend), bukan 5000
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, ''); // Menghapus '/api' di akhir string

    console.log('Connecting to Socket URL:', socketUrl);

    // Inisialisasi Socket Instance (Singleton)
    const socketInstance = io(socketUrl, {
      auth: {
        token: token, 
      },
      // Opsi tambahan untuk kestabilan
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Kirim cookies juga jika diperlukan
      transports: ['websocket', 'polling'], // Prioritaskan websocket
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      // Error ini yang sebelumnya muncul "Invalid namespace"
      console.error('Socket connection error:', err.message);
    });

    setSocket(socketInstance);

    // Cleanup saat unmount (logout atau tutup tab)
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};