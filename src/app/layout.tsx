// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/context/SocketContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Posko Provider - Mitra Terpercaya',
  description: 'Aplikasi khusus mitra Posko untuk mengelola pesanan jasa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} text-sm text-gray-700 antialiased bg-gray-50`}>
        <SocketProvider> 
          {children}
          <Toaster position="top-center" />
        </SocketProvider>
      </body>
    </html>
  );
}