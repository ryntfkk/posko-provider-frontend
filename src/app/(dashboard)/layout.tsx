// src/app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import ProviderSidebar from '@/components/provider/ProviderSidebar';
import ProviderBottomNav from '@/components/provider/ProviderBottomNav';
import { ToastProvider, useToast } from '@/components/Toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

// Component Wrapper untuk Logic Socket (karena butuh useToast)
function DashboardSocketWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  
  // Audio Notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3'); // Pastikan file ada di public/sounds/
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.error('Audio error', e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    if (!token) return;

    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Global Socket Connected');
      });

      // GLOBAL LISTENER: ORDER BARU
      newSocket.on('order_new', (data) => {
        console.log('🔔 Global New Order:', data);
        playNotificationSound();
        showToast(`🔔 Pesanan Baru: ${data.message || 'Segera cek order masuk!'}`, 'info');
      });

      // GLOBAL LISTENER: UPDATE STATUS
      newSocket.on('order_status_update', (data) => {
        console.log('🔄 Global Update:', data);
        // Hanya tampilkan jika pesanan dibatalkan atau selesai (info penting)
        if (data.status === 'cancelled') {
           showToast(`⚠️ Pesanan dibatalkan oleh pelanggan.`, 'warning');
        } else if (data.status === 'paid') {
           playNotificationSound();
           showToast(`💰 Pembayaran diterima! Segera proses pesanan.`, 'success');
        }
      });

      socketRef.current = newSocket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [showToast]);

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <DashboardSocketWrapper>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar Desktop */}
          <ProviderSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* [FIX UI] Padding Bottom disesuaikan untuk Docked Nav
               pb-20 (80px) cukup untuk navigasi docked baru.
               Pada Desktop (lg:), gunakan padding normal (pb-8).
            */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-8">
              {children}
            </main>
          </div>

          {/* Bottom Nav Mobile */}
          <ProviderBottomNav />
        </div>
      </DashboardSocketWrapper>
    </ToastProvider>
  );
}