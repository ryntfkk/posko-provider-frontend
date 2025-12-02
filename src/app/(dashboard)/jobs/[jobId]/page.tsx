// src/app/(dashboard)/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchOrderById, updateOrderStatus } from '@/features/orders/api';
import { fetchProfile } from '@/features/auth/api';
import { Order } from '@/features/orders/types';
import { User } from '@/features/auth/types';

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.048 1.029a11.042 11.042 0 01-7.422 7.422l-1.029-2.048a1 1 0 00-.756-.502l-4.493-1.498a1 1 0 00-.684-.948A2 2 0 013 5z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  // [NEW] State untuk menampilkan earnings breakdown
  const [earningsBreakdown, setEarningsBreakdown] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const orderRes = await fetchOrderById(jobId);
        setOrder(orderRes.data);

        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
      } catch (error) {
        console.error('Gagal memuat detail job:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [jobId]);

  // [NEW] Setup polling untuk mendeteksi order completed
  useEffect(() => {
    if (! order || order.status === 'completed') return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedOrder = await fetchOrderById(jobId);
        setOrder(updatedOrder.data);

        // [NEW] Jika order berubah menjadi completed, tampilkan earnings breakdown
        if (updatedOrder.data.status === 'completed' && order.status !== 'completed') {
          // Refresh user profile untuk update balance
          const profileRes = await fetchProfile();
          setUser(profileRes.data.profile);
          
          // Parse earnings dari response (jika ada)
          if (updatedOrder.data.earnings) {
            setEarningsBreakdown(updatedOrder.data.earnings);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll setiap 2 detik

    return () => clearInterval(pollInterval);
  }, [order, jobId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (! confirm(`Ubah status menjadi "${newStatus}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(jobId, newStatus);
      setOrder(response.data);

      // [NEW] Jika status berubah menjadi completed, tampilkan earnings
      if (newStatus === 'completed' && response.data.earnings) {
        setEarningsBreakdown(response.data.earnings);
        
        // Refresh user profile
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
        
        alert('Pesanan selesai! Earnings Anda sudah masuk ke saldo.');
      } else {
        alert(`Status berhasil diubah menjadi ${newStatus}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || `Gagal mengubah status ke ${newStatus}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Pesanan tidak ditemukan</p>
          <Link href="/dashboard" className="text-red-600 font-bold">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const isProvider = user && order.providerId;
  const isCompleted = order.status === 'completed';
  const isWaitingApproval = order.status === 'waiting_approval';
  const isWorking = order.status === 'working';
  const isOnTheWay = order.status === 'on_the_way';
  const isAccepted = order.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-bold">
            ← Kembali
          </Link>
          <div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${
              isCompleted ? 'bg-green-100 text-green-700' :
              isWaitingApproval ? 'bg-blue-100 text-blue-700' :
              isWorking ?  'bg-purple-100 text-purple-700' :
              isOnTheWay ? 'bg-orange-100 text-orange-700' :
              isAccepted ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* CUSTOMER INFO */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Pelanggan</h2>
          <div className="flex items-start gap-4">
            <Image
              src={(order.userId as any)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=customer`}
              width={80}
              height={80}
              alt="Customer"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">{(order.userId as any)?.fullName}</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <PhoneIcon />
                  <span>{order.customerContact?.phone || (order.userId as any)?.phoneNumber || 'Tidak ada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LocationIcon />
                  <span>{order.shippingAddress?.city || 'Lokasi tidak diset'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JADWAL & DETAIL */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Jadwal & Detail Pesanan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Jadwal Kunjungan</p>
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <CalendarIcon />
                {order.scheduledAt
                  ? new Date(order.scheduledAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'ASAP'}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Order Number</p>
              <p className="text-gray-900 font-mono font-bold">#{order.orderNumber || order._id.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* LAYANAN & HARGA */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Layanan</h2>
          <div className="space-y-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                  <span className="text-sm font-bold text-slate-900">
                    Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{item.quantity} x Rp {new Intl.NumberFormat('id-ID').format(item.price)}</span>
                </div>
                {item.note && (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                    <InfoIcon /> <span className="italic">"{item.note}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RINGKASAN BIAYA */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Biaya</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Layanan</span>
              <span className="font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount - order.adminFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya Admin</span>
              <span className="font-bold text-gray-900">-Rp {new Intl.NumberFormat('id-ID').format(order.adminFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon Voucher</span>
                <span className="font-bold text-green-600">-Rp {new Intl.NumberFormat('id-ID').format(order.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total Bayar Pelanggan</span>
              <span className="text-lg font-black text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* [NEW] EARNINGS BREAKDOWN - Hanya tampil saat order completed */}
        {isCompleted && earningsBreakdown && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <CheckIcon />
              <div>
                <h2 className="text-lg font-bold text-green-900">Penghasilan Anda</h2>
                <p className="text-sm text-green-700">Earnings telah ditambahkan ke saldo akun</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Service Revenue</span>
                <span className="font-bold text-green-900">Rp {new Intl.NumberFormat('id-ID').format(earningsBreakdown.serviceRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Komisi Platform ({earningsBreakdown.platformCommissionPercent}%)</span>
                <span className="font-bold text-red-600">-Rp {new Intl.NumberFormat('id-ID').format(earningsBreakdown.platformCommissionAmount)}</span>
              </div>
              <div className="border-t border-green-200 pt-3 flex justify-between">
                <span className="font-bold text-green-900">Earnings Bersih</span>
                <span className="text-xl font-black text-green-600">Rp {new Intl.NumberFormat('id-ID').format(earningsBreakdown.earningsAmount)}</span>
              </div>
              <div className="pt-2 text-xs text-green-600 font-medium">
                💰 Saldo akun Anda: Rp {new Intl.NumberFormat('id-ID').format(user?.balance || 0)}
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tindakan</h2>
          <div className="flex flex-wrap gap-3">
            {isAccepted && (
              <button
                onClick={() => handleStatusUpdate('on_the_way')}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Mulai Perjalanan'}
              </button>
            )}

            {isOnTheWay && (
              <button
                onClick={() => handleStatusUpdate('working')}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Mulai Bekerja'}
              </button>
            )}

            {isWorking && (
              <button
                onClick={() => handleStatusUpdate('waiting_approval')}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Selesaikan Pekerjaan'}
              </button>
            )}

            {isWaitingApproval && (
              <div className="w-full py-3 rounded-xl text-center text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200">
                ⏳ Menunggu konfirmasi dari pelanggan...
              </div>
            )}

            {isCompleted && (
              <div className="w-full py-3 rounded-xl text-center text-sm font-bold text-green-700 bg-green-50 border border-green-200">
                ✓ Pesanan selesai
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}