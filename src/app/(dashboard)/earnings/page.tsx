// src/app/(dashboard)/earnings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchMyEarnings } from '@/features/earnings/api'; // Pastikan API ini ada
import { User } from '@/features/auth/types';
import { fetchProfile } from '@/features/auth/api';
import Image from 'next/image';

// Types (Sesuaikan dengan backend response)
interface EarningRecord {
  _id: string;
  orderId: {
    _id: string;
    orderNumber: string;
    items: { name: string }[];
  };
  totalAmount: number;             // Total bayar customer
  additionalFeeAmount: number;     // Total add-on
  adminFee: number;                // Biaya aplikasi
  platformCommissionAmount: number;// Potongan bagi hasil
  earningsAmount: number;          // Bersih diterima mitra
  createdAt: string;
}

const WalletIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, earningsRes] = await Promise.all([
          fetchProfile(),
          fetchMyEarnings(filter) // Asumsi fungsi ini menerima filter
        ]);
        
        setUser(profileRes.data.profile);
        setEarnings(Array.isArray(earningsRes.data) ? earningsRes.data : []);
      } catch (error) {
        console.error('Failed to load earnings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [filter]);

  // Kalkulasi Ringkasan
  const totalRevenue = earnings.reduce((sum, item) => sum + item.earningsAmount, 0);
  const totalJobs = earnings.length;
  // Hitung rata-rata
  const avgOrderValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10 font-sans">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Pendapatan & Saldo</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* WALLET CARD */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Saldo Dompet Aktif</p>
                <h2 className="text-3xl font-black tracking-tight">
                  Rp {new Intl.NumberFormat('id-ID').format(user?.balance || 0)}
                </h2>
              </div>
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <WalletIcon />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-900/20">
                Tarik Dana (Withdraw)
              </button>
              <button className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm">
                Top Up
              </button>
            </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Total Pendapatan</p>
            <p className="text-lg font-bold text-gray-900">
              Rp {new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(totalRevenue)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
              <TrendUpIcon /> <span>Bersih</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Job Selesai</p>
            <p className="text-lg font-bold text-gray-900">{totalJobs} <span className="text-sm font-normal text-gray-500">Order</span></p>
            <p className="text-[10px] text-gray-400 mt-1">
              Avg: Rp {new Intl.NumberFormat('id-ID', { notation: "compact" }).format(avgOrderValue)}/job
            </p>
          </div>
        </div>

        {/* HISTORY LIST */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Riwayat Transaksi</h3>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs bg-gray-50 border-none rounded-lg py-1.5 px-3 font-bold text-gray-600 outline-none focus:ring-0"
            >
              <option value="all">Semua</option>
              <option value="month">Bulan Ini</option>
              <option value="week">Minggu Ini</option>
            </select>
          </div>

          <div className="divide-y divide-gray-50">
            {earnings.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Belum ada riwayat transaksi.
              </div>
            ) : (
              earnings.map((item) => (
                <div key={item._id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Penyelesaian Order #{item.orderId?.orderNumber || item.orderId?._id.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-black text-green-600">
                      +Rp {new Intl.NumberFormat('id-ID').format(item.earningsAmount)}
                    </span>
                  </div>

                  {/* Detail Breakdown (Collapsible style simple) */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5 mt-2">
                    <div className="flex justify-between text-gray-500">
                      <span>Total Tagihan Customer</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(item.totalAmount + (item.additionalFeeAmount || 0))}</span>
                    </div>
                    
                    {item.additionalFeeAmount > 0 && (
                      <div className="flex justify-between text-blue-600 font-medium">
                        <span>Termasuk Biaya Tambahan</span>
                        <span>(Rp {new Intl.NumberFormat('id-ID').format(item.additionalFeeAmount)})</span>
                      </div>
                    )}

                    <div className="flex justify-between text-red-400">
                      <span>Potongan Platform</span>
                      <span>-Rp {new Intl.NumberFormat('id-ID').format(item.platformCommissionAmount)}</span>
                    </div>
                    
                    {/* Garis pemisah kecil */}
                    <div className="border-t border-gray-200 my-1 pt-1 flex justify-between font-bold text-gray-700">
                      <span>Pendapatan Bersih</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(item.earningsAmount)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}