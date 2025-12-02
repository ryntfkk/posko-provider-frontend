// src/app/(dashboard)/earnings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchEarningsHistory, EarningsRecord } from '@/features/earnings/api';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- ICONS ---
const WalletIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, earningsRes] = await Promise.all([
          fetchProfile(),
          fetchEarningsHistory()
        ]);
        setUser(profileRes.data.profile);
        setEarnings(Array.isArray(earningsRes.data) ? earningsRes.data : []);
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter & Sort (Default: Terbaru)
  const filteredEarnings = earnings
    .filter(e => filterStatus === 'all' ? true : e.status === filterStatus)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  // Hitung Summary
  const totalNetEarnings = earnings
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.earningsAmount, 0);

  const completedCount = earnings.filter(e => e.status === 'completed').length;

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Order ID', 'Total Tagihan', 'Pendapatan Bersih', 'Status'];
    const rows = filteredEarnings.map(e => [
      new Date(e.completedAt).toLocaleDateString('id-ID'),
      e.orderId,
      e.totalAmount,
      e.earningsAmount,
      e.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_keuangan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-base lg:text-lg font-bold text-gray-900">Keuangan</h1>
        </div>
        <button
          onClick={handleExportCSV}
          className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
          title="Download Laporan"
        >
          <DownloadIcon />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        
        {/* WALLET CARD (Modern Dark Theme) */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl shadow-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <div className="p-1.5 bg-white/20 rounded-lg"><WalletIcon /></div>
              <span className="text-xs font-medium uppercase tracking-wide">Saldo Dompet</span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm font-medium opacity-70">Rp</span>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
                {new Intl.NumberFormat('id-ID').format(user?.balance || 0)}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase">Total Pendapatan</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm">Rp {new Intl.NumberFormat('id-ID', { notation: "compact", maximumFractionDigits: 1 }).format(totalNetEarnings)}</p>
                  <TrendUpIcon />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase">Order Selesai</p>
                <p className="font-bold text-sm">{completedCount} <span className="text-xs font-normal opacity-70">Pesanan</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS & LABEL */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Riwayat Transaksi</h3>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-white border border-gray-200 text-xs font-medium px-3 py-1.5 pr-7 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="pending">Pending</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className="space-y-3">
          {filteredEarnings.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">Belum ada data transaksi.</p>
            </div>
          ) : (
            filteredEarnings.map((record) => (
              <div key={record._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-0.5">
                      {new Date(record.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-bold text-gray-900">Pekerjaan Selesai</p>
                    <p className="text-xs text-gray-500">Order ID: #{record.orderId.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +Rp {new Intl.NumberFormat('id-ID').format(record.earningsAmount)}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      record.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {record.status === 'completed' ? 'Sukses' : record.status}
                    </span>
                  </div>
                </div>

                {/* Simple Accordion for Details */}
                <details className="group">
                  <summary className="cursor-pointer text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-2 select-none">
                    Rincian Dana <ChevronDownIcon />
                  </summary>
                  <div className="mt-2 pt-2 border-t border-gray-50 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Total Tagihan Customer</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(record.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Komisi Platform</span>
                      <span>-Rp {new Intl.NumberFormat('id-ID').format(record.platformCommissionAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-900 pt-1">
                      <span>Diterima Bersih</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(record.earningsAmount)}</span>
                    </div>
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}