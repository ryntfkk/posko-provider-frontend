// src/app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchProfile, logout, updateProfile } from '@/features/auth/api';
import { fetchMyProviderProfile, updateProviderServices, toggleOnlineStatus } from '@/features/providers/api';
import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';
import api from '@/lib/axios';
import { User } from '@/features/auth/types';

// --- ICONS ---
const ChevronRightIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ToolIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ExternalLinkIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface ProviderService {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    category: string;
    iconUrl: string;
    basePrice: number;
  };
  price: number;
  isActive: boolean;
}

export default function ProviderSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // View State (Untuk navigasi seperti halaman)
  const [activeView, setActiveView] = useState<'main' | 'profile' | 'services' | 'account'>('main');

  // Profile State
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

  // Services State
  const [services, setServices] = useState<ProviderService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedNewService, setSelectedNewService] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);

  // Online Status State
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetchProfile();
        const userData = profileRes.data.profile;
        setUser(userData);
        setFullName(userData.fullName || '');
        setPhoneNumber(userData.phoneNumber || '');
        setBio(userData.bio || '');

        const providerRes = await fetchMyProviderProfile();
        if (providerRes.data?.services) {
          setServices(providerRes.data.services);
        }
        
        setIsOnline(providerRes.data?.isOnline || false);

        const servicesRes = await fetchServices();
        setAllServices(servicesRes.data || []);
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ fullName, phoneNumber, bio });
      alert('Profil berhasil diperbarui!');
      setActiveView('main');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleService = async (serviceIndex: number) => {
    const updatedServices = [...services];
    const previousState = updatedServices[serviceIndex].isActive;
    updatedServices[serviceIndex].isActive = !previousState;
    setServices(updatedServices);

    try {
      await api.put('/providers/services', {
        services: updatedServices.map(s => ({
          serviceId: s.serviceId._id,
          price: s.price,
          isActive: s.isActive
        }))
      });
    } catch (error) {
      console.error('Gagal update layanan:', error);
      updatedServices[serviceIndex].isActive = previousState;
      setServices([...updatedServices]);
      alert('Gagal mengubah status layanan');
    }
  };

  const handleAddService = async () => {
    if (!selectedNewService || newServicePrice <= 0) {
      alert('Pilih layanan dan masukkan harga yang valid');
      return;
    }

    const exists = services.some(s => s.serviceId._id === selectedNewService);
    if (exists) {
      alert('Layanan ini sudah ada dalam daftar Anda');
      return;
    }

    setIsSaving(true);
    try {
      const newServices = [
        ...services.map(s => ({
          serviceId: s.serviceId._id,
          price: s.price,
          isActive: s.isActive
        })),
        {
          serviceId: selectedNewService,
          price: newServicePrice,
          isActive: true
        }
      ];

      const res = await updateProviderServices(newServices);
      if (res.data?.services) {
        setServices(res.data.services);
      }
      setShowAddServiceModal(false);
      setSelectedNewService('');
      setNewServicePrice(0);
      alert('Layanan berhasil ditambahkan!');
    } catch (error) {
      console.error('Gagal menambah layanan:', error);
      alert('Gagal menambahkan layanan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveService = async (serviceIndex: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return;

    const updatedServices = services.filter((_, idx) => idx !== serviceIndex);
    
    try {
      await api.put('/providers/services', {
        services: updatedServices.map(s => ({
          serviceId: s.serviceId._id,
          price: s.price,
          isActive: s.isActive
        }))
      });
      setServices(updatedServices);
    } catch (error) {
      console.error('Gagal menghapus layanan:', error);
      alert('Gagal menghapus layanan');
    }
  };

  const handleUpdatePrice = async (serviceIndex: number, newPrice: number) => {
    const updatedServices = [...services];
    updatedServices[serviceIndex].price = newPrice;
    setServices(updatedServices);
  };

  const handleSavePrice = async (serviceIndex: number) => {
    try {
      await api.put('/providers/services', {
        services: services.map(s => ({
          serviceId: s.serviceId._id,
          price: s.price,
          isActive: s.isActive
        }))
      });
    } catch (error) {
      console.error('Gagal update harga:', error);
      alert('Gagal mengubah harga');
    }
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await toggleOnlineStatus(newStatus);
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Gagal mengubah status online:', error);
      alert('Gagal mengubah status');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) return;
    try {
      await logout();
      localStorage.removeItem('posko_token');
      localStorage.removeItem('posko_refresh_token');
      router.push('/login');
    } catch (error) {
      console.error('Gagal logout:', error);
      localStorage.removeItem('posko_token');
      localStorage.removeItem('posko_refresh_token');
      router.push('/login');
    }
  };

  const availableServicesToAdd = allServices.filter(
    service => !services.some(s => s.serviceId._id === service._id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10 font-sans">
      
      {/* 1. MAIN SETTINGS VIEW */}
      <div className={`${activeView === 'main' ? 'block' : 'hidden'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10 px-5 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        </header>

        <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
          
          {/* Profile Summary & Online Toggle */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                <Image
                  src={user?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{fullName}</h2>
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
                <input 
                  type="checkbox" 
                  checked={isOnline} 
                  onChange={handleToggleOnline} 
                  className="sr-only peer" 
                />
                <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Menu List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => setActiveView('profile')}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
                <UserIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Edit Profil</p>
                <p className="text-xs text-gray-500">Ubah nama, bio, dan kontak</p>
              </div>
              <ChevronRightIcon />
            </button>

            <button 
              onClick={() => setActiveView('services')}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mr-4">
                <ToolIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Kelola Layanan</p>
                <p className="text-xs text-gray-500">Atur harga dan jenis jasa</p>
              </div>
              <ChevronRightIcon />
            </button>

            <button 
              onClick={() => setActiveView('account')}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-4">
                <LockIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Pengaturan Akun</p>
                <p className="text-xs text-gray-500">Password dan keamanan</p>
              </div>
              <ChevronRightIcon />
            </button>

            <a 
              href="https://posko.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4">
                <ExternalLinkIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Aplikasi Customer</p>
                <p className="text-xs text-gray-500">Buka website customer</p>
              </div>
              <ChevronRightIcon />
            </a>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogoutIcon /> Keluar Akun
          </button>

          <div className="text-center pb-6">
            <p className="text-[10px] text-gray-400">Versi Aplikasi v1.0.0</p>
          </div>
        </main>
      </div>

      {/* 2. FULL SCREEN MODAL: EDIT PROFILE */}
      {activeView === 'profile' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <header className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
            <button onClick={() => setActiveView('main')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
              <BackIcon />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Edit Profil</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-md mx-auto space-y-5">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                    <Image
                      src={user?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full border-2 border-white shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio / Keahlian</label>
                <textarea
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Ahli perbaikan AC dengan pengalaman 5 tahun..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none outline-none focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed max-w-md mx-auto block"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}

      {/* 3. FULL SCREEN MODAL: SERVICES */}
      {activeView === 'services' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <header className="px-4 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveView('main')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
                <BackIcon />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Kelola Layanan</h1>
            </div>
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
            >
              <PlusIcon />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="max-w-md mx-auto space-y-3">
              {services.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <p>Belum ada layanan aktif.</p>
                  <p className="text-xs mt-1">Tekan tombol + di pojok kanan atas untuk menambah.</p>
                </div>
              ) : (
                services.map((service, idx) => (
                  <div key={service._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-1">
                          {service.serviceId?.iconUrl ? (
                            <Image src={service.serviceId.iconUrl} alt="Icon" width={24} height={24} className="object-contain" />
                          ) : (
                            <ToolIcon />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{service.serviceId?.name}</p>
                          <p className="text-xs text-gray-500">{service.serviceId?.category}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.isActive}
                          onChange={() => handleToggleService(idx)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleUpdatePrice(idx, parseInt(e.target.value) || 0)}
                          onBlur={() => handleSavePrice(idx)}
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm font-bold text-gray-900 transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => handleRemoveService(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. FULL SCREEN MODAL: ACCOUNT SETTINGS */}
      {activeView === 'account' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <header className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
            <button onClick={() => setActiveView('main')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
              <BackIcon />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Akun & Keamanan</h1>
          </header>
          
          <div className="flex-1 p-5 bg-gray-50">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Ganti Password</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Password Lama" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
                  <input type="password" placeholder="Password Baru" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
                  <input type="password" placeholder="Konfirmasi Password Baru" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
                  <button className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800">Update Password</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW SERVICE (Overlay on top of Services view) */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tambah Layanan</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              {availableServicesToAdd.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>Semua layanan sudah ditambahkan.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Layanan</label>
                    <div className="relative">
                      <select
                        value={selectedNewService}
                        onChange={(e) => {
                          setSelectedNewService(e.target.value);
                          const service = allServices.find(s => s._id === e.target.value);
                          if (service) setNewServicePrice(service.basePrice);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none appearance-none"
                      >
                        <option value="">-- Pilih --</option>
                        {availableServicesToAdd.map((service) => (
                          <option key={service._id} value={service._id}>
                            {service.name} ({service.category})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {selectedNewService && (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs flex justify-between items-center">
                      <span>Harga Standar:</span>
                      <span className="font-bold">Rp {new Intl.NumberFormat('id-ID').format(allServices.find(s => s._id === selectedNewService)?.basePrice || 0)}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Anda</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddService}
                    disabled={isSaving || !selectedNewService || newServicePrice <= 0}
                    className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors disabled:opacity-50 mt-4"
                  >
                    {isSaving ? 'Menambahkan...' : 'Simpan Layanan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}