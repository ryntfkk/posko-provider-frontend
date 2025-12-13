// src/app/(dashboard)/layout.tsx
'use client';

import { useEffect, useRef } from 'react';
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
  // [FIX] State 'isSidebarOpen' dihapus karena ProviderSidebar hanya untuk desktop (statis)
  // dan mobile menggunakan ProviderBottomNav.
  
  return (
    <ToastProvider>
      <DashboardSocketWrapper>
        {/* [FIX UPDATE] Mengubah min-h-screen menjadi h-[100dvh] dan overflow-hidden 
            agar scrolling terjadi di dalam 'main' area secara terkontrol, bukan di window body.
            Ini mencegah layout shift pada mobile browser yang menyebabkan tombol tertutup. */}
        <div className="h-[100dvh] bg-gray-50 flex overflow-hidden">
          {/* Sidebar Desktop */}
          {/* [FIX] Menghapus props isOpen & setIsOpen yang menyebabkan error type mismatch */}
          <ProviderSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* [FIX UPDATE] Padding Bottom ditingkatkan drastis (pb-32 / 128px) pada mobile
                untuk menjamin konten terbawah tidak akan pernah tertutup oleh BottomNav.
                Scroll behavior diset ke smooth. */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 lg:pb-8 scroll-smooth">
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