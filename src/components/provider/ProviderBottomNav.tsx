// src/components/provider/ProviderBottomNav.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Icon dimodifikasi agar support props className untuk sizing dinamis
const DashboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const JobsIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const MessagesIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

interface NavItem {
  href: string;
  icon: any; // Menggunakan any agar fleksibel menerima props className
  label: string;
}

export default function ProviderBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path === '/jobs' && pathname.startsWith('/jobs')) return true;
    if (path === '/messages' && pathname.startsWith('/messages')) return true;
    if (path === '/settings' && pathname.startsWith('/settings')) return true;
    return false;
  };

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: DashboardIcon, label: 'Beranda' },
    { href: '/jobs', icon: JobsIcon, label: 'Pesanan' },
    { href: '/messages', icon: MessagesIcon, label: 'Chat' },
    { href: '/settings', icon: SettingsIcon, label: 'Akun' },
  ];

  return (
    // [FIX UI] Ditambahkan pb-[env(safe-area-inset-bottom)] agar tidak tertutup Home Indicator (iPhone)
    // Container fixed diubah background-nya agar menyatu dengan area safe area
    // Shadow ditambahkan agar batas atas nav terlihat jelas
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[99] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <nav className="flex justify-between items-end px-6 pt-2 pb-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex-1 flex flex-col items-center justify-center group gap-1 active:scale-95 transition-transform py-1"
            >
              <div className={`transition-colors duration-200 ${active ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {/* Render Component Icon dengan props className */}
                <item.icon className="w-6 h-6" /> 
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-red-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}