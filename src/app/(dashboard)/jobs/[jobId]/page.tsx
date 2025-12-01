// src/app/(provider)/jobs/[jobId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { fetchOrderById, updateOrderStatus } from '@/features/orders/api';
import { Order, PopulatedUser } from '@/features/orders/types';

export default function ProviderJobDetail() {
  const params = useParams();
  const orderId = params.jobId as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (! orderId) return;
    try {
      const res = await fetchOrderById(orderId);
      setOrder(res.data);
    } catch (error) {
      console.error("Gagal memuat pesanan:", error);
      router.push('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      'on_the_way': 'Berangkat ke Lokasi',
      'working': 'Mulai Pengerjaan',
      'waiting_approval': 'Selesaikan Pekerjaan' // Fix #2: Label untuk status waiting_approval
    };
    const actionName = statusLabels[newStatus] || newStatus.replace(/_/g, ' ');

    if (! confirm(`Apakah Anda yakin ingin "${actionName}"?`)) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrder();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Gagal update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChat = async () => {
    if (!order) return;

    const customerData = order.userId as PopulatedUser;
    const targetUserId = customerData? ._id || (order.userId as string);

    if (! targetUserId) {
      alert("Data pelanggan tidak valid.");
      return;
    }

    setIsChatLoading(true);
    try {
      await api.post('/chat', { targetUserId });
      router.push('/chat');
    } catch (e) {
      console.error(e);
      alert('Gagal membuka chat');
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
        <p className="text-sm text-gray-500">Memuat detail pekerjaan...</p>
      </div>
    );
  }

  const renderActionButton = () => {
    if (order.status === 'accepted') {
      return (
        <button
          onClick={() => handleUpdateStatus('on_the_way')}
          disabled={isUpdating}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isUpdating ? 'Memproses...' : '🚀 Berangkat ke Lokasi'}
        </button>
      );
    }

    if (order.status === 'on_the_way') {
      return (
        <button
          onClick={() => handleUpdateStatus('working')}
          disabled={isUpdating}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isUpdating ?  'Memproses...' : '🛠️ Mulai Pengerjaan'}
        </button>
      );
    }

    if (order.status === 'working') {
      return (
        <button
          // Fix #2: Ubah status target menjadi 'waiting_approval'
          onClick={() => handleUpdateStatus('waiting_approval')}
          disabled={isUpdating}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isUpdating ? 'Memproses...' : '✅ Pekerjaan Selesai'}
        </button>
      );
    }

    if (order.status === 'waiting_approval') {
      return (
        <div className="w-full py-4 bg-yellow-50 text-yellow-800 font-bold rounded-xl text-center border border-yellow-200 flex flex-col items-center gap-1 animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Menunggu Konfirmasi Pelanggan</span>
          </div>
          <span className="text-xs font-normal opacity-80">Harap minta pelanggan cek aplikasi mereka untuk konfirmasi.</span>
        </div>
      );
    }

    if (order.status === 'completed') {
      return (
        <div className="w-full py-3 bg-gray-100 text-green-700 font-bold rounded-xl text-center border border-green-200 flex justify-center items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Pekerjaan Selesai & Terkonfirmasi
        </div>
      );
    }

    return null;
  };

  const customer = order.userId as PopulatedUser;
  // Fix #3: Gunakan shippingAddress dari Order
  const orderAddress = order.shippingAddress; 
  const orderLocation = order.location;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
        <Link href="/jobs" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-none">Detail Pekerjaan</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            ID: <span className="font-mono">{order._id.substring(0, 8)}...</span>
          </p>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Card Informasi Pelanggan */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pelanggan</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md border border-gray-200">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shrink-0">
              <Image
                src={customer?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg? seed=${customer?.fullName || 'user'}`}
                alt="Customer"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg truncate">{customer?.fullName || 'Pelanggan'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <a href={`tel:${customer?.phoneNumber}`} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer?.phoneNumber || '-'}
                </a>
              </div>
            </div>

            <button
              onClick={handleChat}
              disabled={isChatLoading}
              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
            >
              {isChatLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-5 bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Lokasi Pengerjaan</p>
            <p className="text-sm text-gray-800 font-medium ml-1 leading-relaxed">
              {orderAddress?.detail || 'Detail jalan tidak tersedia'},
              {orderAddress?.village && ` ${orderAddress.village},`}
              {orderAddress?.district && ` Kec. ${orderAddress.district},`}
              {orderAddress?.city || ''}
            </p>

            {orderLocation?.coordinates && orderLocation.coordinates[0] !== 0 && (
              <a
                href={`https://www.google.com/maps/dir/? api=1&destination=${orderLocation.coordinates[1]},${orderLocation.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline ml-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Buka Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Jadwal Kunjungan */}
        {order.scheduledAt && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Jadwal Kunjungan</h3>
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {new Date(order.scheduledAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(order.scheduledAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} WIB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card Detail Pesanan */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Rincian Layanan</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.quantity} unit x Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                  </p>
                  {item.note && (
                    <p className="text-xs text-gray-500 mt-1 italic bg-yellow-50 text-yellow-700 px-2 py-1 rounded inline-block">
                      Catatan: {item.note}
                    </p>
                  )}
                </div>
                <p className="font-bold text-gray-900 text-sm">
                  Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                </p>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t border-gray-100 text-base font-black">
              <span>Total Pendapatan</span>
              <span className="text-green-600">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Catatan Pesanan */}
        {order.orderNote && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Catatan Pelanggan</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {order.orderNote}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur border-t border-gray-200 z-20 lg:static lg:p-0 lg:bg-transparent lg:border-0">
          <div className="max-w-xl mx-auto">
            {renderActionButton()}
          </div>
        </div>
      </main>
    </div>
  );
}