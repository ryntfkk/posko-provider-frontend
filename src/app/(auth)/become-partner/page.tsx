'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { fetchProfile, logout } from '@/features/auth/api';
import { User } from '@/features/auth/types';

export default function BecomePartnerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetchProfile();
        setUser(res.data.profile);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleRegisterPartner = async () => {
    if (!confirm('Apakah Anda yakin ingin mendaftar sebagai Mitra Posko?')) return;

    setIsRegistering(true);
    try {
      // Panggil endpoint backend untuk upgrade role
      await api.post('/auth/register-partner');
      
      alert('Pendaftaran Berhasil! Silakan login kembali untuk mengakses Dashboard Mitra.');
      
      // Logout paksa agar user login ulang dan mendapatkan token baru dengan role 'provider'
      await logout();
      localStorage.removeItem('posko_token');
      localStorage.removeItem('posko_refresh_token');
      
      router.push('/login');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Gagal mendaftar sebagai mitra.');
      setIsRegistering(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative">
            <Image src="/logo.png" alt="Posko" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg text-gray-900">Posko<span className="text-red-600">.</span></span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
          Keluar
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl shadow-gray-200 border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 mb-2">Halo, {user?.fullName}!</h1>
          <p className="text-gray-500 mb-8">
            Saat ini akun Anda terdaftar sebagai <span className="font-bold text-gray-700">Customer</span>. 
            Bergabunglah menjadi Mitra Posko untuk mulai menawarkan jasa Anda dan mendapatkan penghasilan.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl text-left flex gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm h-fit">💰</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Penghasilan Tambahan</h3>
                <p className="text-xs text-gray-500 mt-1">Dapatkan penghasilan dengan jam kerja fleksibel sesuai keinginan Anda.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl text-left flex gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm h-fit">🚀</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Jangkauan Luas</h3>
                <p className="text-xs text-gray-500 mt-1">Terhubung dengan ribuan pelanggan yang membutuhkan jasa Anda.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegisterPartner}
            disabled={isRegistering}
            className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mendaftarkan...
              </>
            ) : (
              'Daftar Sebagai Mitra Sekarang'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}