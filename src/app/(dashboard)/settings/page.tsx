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
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    if (! confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return;

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
      alert('Layanan berhasil dihapus');
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
    if (! confirm('Apakah Anda yakin ingin keluar?')) return;
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
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-xs text-gray-500">Kelola profil dan pengaturan akun Anda</p>
          </div>
          {/* Online/Offline Toggle */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              isOnline
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'profile', label: 'Profil', icon: '👤' },
            { id: 'services', label: 'Layanan', icon: '🛠️' },
            { id: 'account', label: 'Akun', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ?  'bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Informasi Profil</h2>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative border-2 border-gray-100">
                  <Image
                    src={user?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
                    Ubah Foto
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio / Deskripsi</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan tentang keahlian dan pengalaman Anda..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Bio akan ditampilkan di profil publik Anda</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
              >
                {isSaving ?  'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Layanan Saya</h2>
                  <p className="text-sm text-gray-500">Kelola layanan yang Anda tawarkan</p>
                </div>
                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah
                </button>
              </div>

              {services.length === 0 ?  (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Belum Ada Layanan</h3>
                  <p className="text-sm text-gray-500 mb-4">Tambahkan layanan yang ingin Anda tawarkan kepada pelanggan</p>
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    + Tambah Layanan Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service, idx) => (
                    <div key={service._id} className={`p-4 rounded-xl border transition-all ${service.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                            {service.serviceId?.iconUrl ? (
                              <Image
                                src={service.serviceId.iconUrl}
                                alt={service.serviceId?.name || 'Service'}
                                width={28}
                                height={28}
                                className="object-contain"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{service.serviceId?.name || 'Layanan'}</p>
                            <p className="text-xs text-gray-500">{service.serviceId?.category || 'Kategori'}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={service.isActive}
                            onChange={() => handleToggleService(idx)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Harga:</span>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                            <input
                              type="number"
                              value={service.price}
                              onChange={(e) => handleUpdatePrice(idx, parseInt(e.target.value) || 0)}
                              onBlur={() => handleSavePrice(idx)}
                              className="pl-9 pr-3 py-2 w-36 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveService(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Pengaturan Akun</h2>
              
              {/* EXTERNAL LINK TO CUSTOMER APP */}
              <a
                href="https://posko.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </div>
                  <div className="text-left">
                      <p className="font-bold text-blue-800">Buka Aplikasi Customer</p>
                      <p className="text-xs text-blue-600">Pesan jasa sebagai pelanggan</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900">Ubah Password</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900">Notifikasi</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-red-100">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium text-red-600">Keluar dari Akun</span>
                  </div>
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADD SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Tambah Layanan Baru</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {availableServicesToAdd.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium">Semua layanan sudah Anda miliki!</p>
                <p className="text-sm text-gray-400 mt-1">Tidak ada layanan baru yang bisa ditambahkan.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Layanan</label>
                  <select
                    value={selectedNewService}
                    onChange={(e) => {
                      setSelectedNewService(e.target.value);
                      const service = allServices.find(s => s._id === e.target.value);
                      if (service) setNewServicePrice(service.basePrice);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white"
                  >
                    <option value="">-- Pilih Layanan --</option>
                    {availableServicesToAdd.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name} ({service.category})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedNewService && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Harga rekomendasi dari sistem:</p>
                    <p className="font-bold text-gray-900">
                      Rp {new Intl.NumberFormat('id-ID').format(allServices.find(s => s._id === selectedNewService)?.basePrice || 0)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Anda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                    <input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                      placeholder="Masukkan harga layanan"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Anda bisa menentukan harga sendiri sesuai keahlian</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddServiceModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddService}
                    disabled={isSaving || !selectedNewService || newServicePrice <= 0}
                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ?  'Menyimpan...' : 'Tambahkan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}