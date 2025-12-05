// src/hooks/useSocket.ts
import { useEffect } from 'react';
import { useSocketContext } from '@/context/SocketContext';

type EventCallback = (data: any) => void;

export const useSocket = () => {
  const { socket, isConnected } = useSocketContext();

  /**
   * Helper untuk subscribe ke event tertentu dan otomatis handle cleanup
   * @param event Nama event (misal: 'receive_message')
   * @param callback Fungsi yang dijalankan saat event terjadi
   */
  const useSocketEvent = (event: string, callback: EventCallback) => {
    useEffect(() => {
      if (!socket) return;

      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    }, [socket, event, callback]);
  };

  /**
   * Helper untuk emit event
   */
  const emit = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  };

  return { socket, isConnected, useSocketEvent, emit };
};