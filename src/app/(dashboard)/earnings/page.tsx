// src/app/(dashboard)/earnings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchEarningsHistory, EarningsRecord } from '@/features/earnings/api';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0 0V8m0 4l4-4m-4 4l-4-4M4.5 12.75l15 15M19.5 2.75l-15 15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);

        const earningsRes = await fetchEarningsHistory();
        setEarnings(Array.isArray(earningsRes.data) ? earningsRes.data : []);
      } catch (error) {
        console.error('Gagal memuat earnings history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter earnings
  const filteredEarnings = earnings.filter(e => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  // Sort earnings
  const sortedEarnings = [...filteredEarnings].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    } else {
      return b.earningsAmount - a.earningsAmount;
    }
  });

  // Calculate summary
  const totalEarnings = earnings
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.earningsAmount, 0);

  const totalCommission = earnings
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.platformCommissionAmount, 0);

  const completedCount = earnings.filter(e => e.status === 'completed').length;
  const avgEarnings = completedCount > 0 ? totalEarnings / completedCount : 0;

  const handleExportCSV = () => {
    const headers = ['Date', 'Order ID', 'Total Amount', 'Admin Fee', 'Service Revenue', 'Commission (12%)', 'Net Earnings', 'Status'];
    const rows = sortedEarnings.map(e => [
      new Date(e.completedAt).toLocaleDateString('id-ID'),
      e.orderId.slice(-8),
      e.totalAmount,
      e.adminFee,
      e.totalAmount - e.adminFee,
      e.platformCommissionAmount,
      e.earningsAmount,
      e.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-bold">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Penghasilan</h1>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckIcon />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">Total Penghasilan</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              Rp {new Intl.NumberFormat('id-ID').format(totalEarnings)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Dari {completedCount} order</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">Rata-rata / Order</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              Rp {new Intl.NumberFormat('id-ID').format(Math.round(avgEarnings))}
            </p>
            <p className="text-xs text-gray-400 mt-1">Per pesanan selesai</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <ClockIcon />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">Total Komisi</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              Rp {new Intl.NumberFormat('id-ID').format(totalCommission)}
            </p>
            <p className="text-xs text-gray-400 mt-1">12% dari service revenue</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">💰</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">Saldo Anda</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              Rp {new Intl.NumberFormat('id-ID').format(user?.balance || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Siap diambil</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Filter Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="all">Semua</option>
              <option value="completed">Selesai</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Terbesar</option>
            </select>
          </div>
        </div>

        {/* EARNINGS LIST */}
        <div className="space-y-3">
          {sortedEarnings.length === 0 ?  (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">Belum ada riwayat penghasilan</p>
            </div>
          ) : (
            sortedEarnings.map((record) => (
              <div key={record._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'completed' ? 'bg-green-100 text-green-700' :
                        record.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {record.status === 'completed' ? '✓ Selesai' :
                         record.status === 'pending' ? '⏳ Pending' :
                         '💳 Dibayarkan'}
                      </span>
                      <span className="text-sm font-bold text-gray-900">Order #{record.orderId.slice(-8)}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarIcon />
                      {new Date(record.completedAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 font-medium">Penghasilan Bersih</p>
                      <p className="text-lg font-black text-green-600">
                        Rp {new Intl.NumberFormat('id-ID').format(record.earningsAmount)}
                      </p>
                    </div>
                    <details className="inline-block">
                      <summary className="cursor-pointer text-xs font-bold text-gray-400 hover:text-gray-600">
                        Detail
                      </summary>
                      <div className="absolute right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-72 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Order</span>
                            <span className="font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(record.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Biaya Admin</span>
                            <span className="font-bold text-gray-900">-Rp {new Intl.NumberFormat('id-ID').format(record.adminFee)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="text-gray-600">Service Revenue</span>
                            <span className="font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(record.totalAmount - record.adminFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Komisi Platform ({record.platformCommissionPercent}%)</span>
                            <span className="font-bold text-red-600">-Rp {new Intl.NumberFormat('id-ID').format(record.platformCommissionAmount)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-bold text-gray-900">Penghasilan Bersih</span>
                            <span className="text-lg font-black text-green-600">Rp {new Intl.NumberFormat('id-ID').format(record.earningsAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}