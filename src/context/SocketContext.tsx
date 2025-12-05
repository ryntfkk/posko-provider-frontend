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
    // Catatan: Meskipun kita pakai HttpOnly cookie, socket.io butuh token eksplisit
    // di auth object jika backend mengecek socket.handshake.auth.token
    // Asumsi: Saat login, Anda menyimpan accessToken juga di localStorage untuk keperluan ini
    const token = typeof window !== 'undefined' ? localStorage.getItem('posko_token') : null;

    if (!token) {
        // Jika tidak ada token, jangan connect socket (hemat resource)
        return;
    }

    // Inisialisasi Socket Instance (Singleton)
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: token, 
      },
      // Opsi tambahan untuk kestabilan
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Kirim cookies juga jika diperlukan
      transports: ['websocket'], // Force websocket agar lebih ringan
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