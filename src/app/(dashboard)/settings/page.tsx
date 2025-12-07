// src/app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// API & Types
import { fetchProfile, logout } from '@/features/auth/api';
import { fetchMyProviderProfile, toggleOnlineStatus } from '@/features/providers/api';
import { User } from '@/features/auth/types';

// Sub-Components
import ProfileSettings from '@/components/settings/ProfileSettings';
import LocationSettings from '@/components/settings/LocationSettings';
import ServiceSettings from '@/components/settings/ServiceSettings';
import AccountSettings from '@/components/settings/AccountSettings';

// Icons
const ChevronRightIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ToolIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ExternalLinkIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MapPinIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

type SettingsView = 'main' | 'profile' | 'services' | 'account' | 'location';

export default function ProviderSettingsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<SettingsView>('main');
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, providerRes] = await Promise.all([
          fetchProfile(),
          fetchMyProviderProfile()
        ]);
        setUser(profileRes.data.profile);
        setIsOnline(providerRes.data?.isOnline || false);
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (activeView === 'main') loadData(); // Reload saat kembali ke main
  }, [activeView]);

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await toggleOnlineStatus(newStatus);
      setIsOnline(newStatus);
    } catch (error) {
      console.error(error);
      alert('Gagal mengubah status');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) return;
    try {
      await logout();
    } catch (e) { console.error(e); }
    finally {
      localStorage.removeItem('posko_token');
      localStorage.removeItem('posko_refresh_token');
      router.push('/login');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div></div>;
  }

  // --- RENDER SUB-COMPONENTS ---
  if (activeView === 'profile') return <ProfileSettings onBack={() => setActiveView('main')} />;
  if (activeView === 'location') return <LocationSettings onBack={() => setActiveView('main')} />;
  if (activeView === 'services') return <ServiceSettings onBack={() => setActiveView('main')} />;
  if (activeView === 'account') return <AccountSettings onBack={() => setActiveView('main')} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10 font-sans">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-5 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        </header>

        <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* Profile Summary */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                <Image
                  src={user?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{user?.fullName}</h2>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Status Aktif</p>
                <p className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                  {isOnline ? 'Anda sedang Online' : 'Anda sedang Offline'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isOnline} onChange={handleToggleOnline} className="sr-only peer" />
                <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Menu List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setActiveView('profile')} className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4"><UserIcon /></div>
              <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900">Edit Profil</p><p className="text-xs text-gray-500">Ubah nama, bio, dan kontak</p></div>
              <ChevronRightIcon />
            </button>

            <button onClick={() => setActiveView('location')} className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4"><MapPinIcon /></div>
              <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900">Alamat & Operasional</p><p className="text-xs text-gray-500">Atur lokasi peta dan jam kerja</p></div>
              <ChevronRightIcon />
            </button>

            <button onClick={() => setActiveView('services')} className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mr-4"><ToolIcon /></div>
              <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900">Kelola Layanan</p><p className="text-xs text-gray-500">Atur harga dan jenis jasa</p></div>
              <ChevronRightIcon />
            </button>

            <button onClick={() => setActiveView('account')} className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-4"><LockIcon /></div>
              <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900">Pengaturan Akun</p><p className="text-xs text-gray-500">Password dan keamanan</p></div>
              <ChevronRightIcon />
            </button>

            <a href="https://posko.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center mr-4"><ExternalLinkIcon /></div>
              <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900">Aplikasi Customer</p><p className="text-xs text-gray-500">Buka website customer</p></div>
              <ChevronRightIcon />
            </a>
          </div>

          <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogoutIcon /> Keluar Akun
          </button>

          <div className="text-center pb-6"><p className="text-[10px] text-gray-400">Versi Aplikasi v1.0.0 (Refactored)</p></div>
        </main>
    </div>
  );
}