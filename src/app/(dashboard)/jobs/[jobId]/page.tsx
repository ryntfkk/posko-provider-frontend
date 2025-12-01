// src/app/(dashboard)/jobs/[jobId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { fetchOrderById, updateOrderStatus } from '@/features/orders/api';
import { Order, PopulatedUser } from '@/features/orders/types';

// Import Map secara Dynamic untuk menghindari error SSR
const JobMap = dynamic(() => import('@/components/JobMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-xs">
      Memuat Peta...
    </div>
  )
});

// --- ICONS SVG (Modern & Clean) ---
const BackIcon = () => <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const PhoneIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const MapPinIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CalendarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HomeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const InfoIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TruckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
const ToolIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AttachmentIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const ParkingIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>; // Placeholder for better icon
const ElevatorIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>; // Placeholder

export default function ProviderJobDetail() {
  const params = useParams();
  const orderId = params.jobId as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
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
      'on_the_way': 'Berangkat',
      'working': 'Mulai Kerja',
      'waiting_approval': 'Selesai'
    };
    const actionName = statusLabels[newStatus] || newStatus;

    if (!confirm(`Konfirmasi status: ${actionName}?`)) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrder();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChat = async () => {
    if (!order) return;
    // Fallback logic untuk mendapatkan ID customer
    let targetUserId = '';
    if (typeof order.userId === 'object' && order.userId !== null) {
      targetUserId = (order.userId as PopulatedUser)._id;
    } else {
      targetUserId = order.userId as string;
    }

    if (!targetUserId) {
      alert("Data pelanggan tidak valid.");
      return;
    }

    setIsChatLoading(true);
    try {
      await api.post('/chat', { targetUserId });
      router.push('/messages'); // Redirect ke halaman list chat (sesuai layout)
    } catch (e) {
      console.error(e);
      alert('Gagal membuka chat');
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-red-600"></div>
        <p className="text-xs font-medium text-slate-500">Memuat data...</p>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  const customer = order.userId as PopulatedUser;
  const contactName = order.customerContact?.name || customer?.fullName || 'Pelanggan';
  const contactPhone = order.customerContact?.phone || customer?.phoneNumber || '-';
  const altPhone = order.customerContact?.alternatePhone;
  
  const address = order.shippingAddress;
  const addressString = [
    address?.detail,
    address?.village,
    address?.district,
    address?.city,
    address?.province,
    address?.postalCode
  ].filter(Boolean).join(', ');

  const hasLocation = order.location?.coordinates && 
                      order.location.coordinates.length === 2 &&
                      (order.location.coordinates[0] !== 0 || order.location.coordinates[1] !== 0);

  // --- RENDER ACTION BUTTON ---
  const renderActionButton = () => {
    const btnBase = "w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (order.status === 'accepted') {
      return (
        <button onClick={() => handleUpdateStatus('on_the_way')} disabled={isUpdating} className={`${btnBase} bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200`}>
          {isUpdating ? 'Memproses...' : <><TruckIcon /> Berangkat ke Lokasi</>}
        </button>
      );
    }
    if (order.status === 'on_the_way') {
      return (
        <button onClick={() => handleUpdateStatus('working')} disabled={isUpdating} className={`${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200`}>
          {isUpdating ? 'Memproses...' : <><ToolIcon /> Mulai Pengerjaan</>}
        </button>
      );
    }
    if (order.status === 'working') {
      return (
        <button onClick={() => handleUpdateStatus('waiting_approval')} disabled={isUpdating} className={`${btnBase} bg-green-600 hover:bg-green-700 text-white shadow-green-200`}>
          {isUpdating ? 'Memproses...' : <><CheckCircleIcon /> Pekerjaan Selesai</>}
        </button>
      );
    }
    if (order.status === 'waiting_approval') {
      return (
        <div className="w-full py-3 bg-amber-50 text-amber-700 font-semibold rounded-xl text-center border border-amber-100 text-xs flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5"><ClockIcon /> <span>Menunggu Konfirmasi Pelanggan</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
      
      {/* 1. Header Simple */}
      <header className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Detail Pekerjaan</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">{order.orderNumber || order._id.slice(-8)}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
          order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 
          order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
          'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        
        {/* 2. Peta Lokasi (Prioritas Visual) */}
        {hasLocation && (
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-56 relative group">
            {order.location?.coordinates && (
              <JobMap coordinates={[order.location.coordinates[0], order.location.coordinates[1]]} />
            )}
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.location?.coordinates[1]},${order.location?.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 z-[400]"
            >
              <MapPinIcon /> Buka Maps
            </a>
          </div>
        )}

        {/* 3. Informasi Utama (Jadwal & Lokasi Teks) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          {/* Jadwal */}
          <div className="flex items-start gap-3 pb-4 border-b border-slate-50">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarIcon />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Waktu Kunjungan</p>
              <p className="text-sm font-semibold text-slate-900">
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                  {order.scheduledTimeSlot?.preferredStart || '00:00'} - {order.scheduledTimeSlot?.preferredEnd || '23:59'}
                </span>
                {order.scheduledTimeSlot?.isFlexible && <span className="text-[10px] italic">(Fleksibel)</span>}
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <MapPinIcon />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Alamat Lengkap</p>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{addressString}</p>
              
              {/* Detail Properti Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {order.propertyDetails?.type && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] text-slate-600 capitalize">
                    <HomeIcon /> {order.propertyDetails.type}
                  </span>
                )}
                {order.propertyDetails?.floor !== undefined && order.propertyDetails.floor !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] text-slate-600">
                    Lantai {order.propertyDetails.floor}
                  </span>
                )}
                {order.propertyDetails?.hasElevator && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-100 rounded-md text-[10px] text-green-700">
                    <ElevatorIcon /> Ada Lift
                  </span>
                )}
                {order.propertyDetails?.hasParking && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-100 rounded-md text-[10px] text-green-700">
                    <ParkingIcon /> Parkir Luas
                  </span>
                )}
              </div>

              {/* Catatan Akses */}
              {order.propertyDetails?.accessNote && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
                  <span className="font-bold">Info Akses:</span> {order.propertyDetails.accessNote}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Informasi Kontak Pelanggan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Kontak Pelanggan</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden relative shrink-0">
              <Image 
                src={customer?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer?.fullName}`} 
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{contactName}</p>
              <p className="text-xs text-slate-500">{contactPhone}</p>
            </div>
            
            <div className="flex gap-2">
              <a href={`tel:${contactPhone}`} className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
                <PhoneIcon />
              </a>
              <button 
                onClick={handleChat}
                disabled={isChatLoading}
                className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isChatLoading ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <ChatIcon />}
              </button>
            </div>
          </div>

          {altPhone && (
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Nomor Alternatif</span>
              <a href={`tel:${altPhone}`} className="text-xs font-bold text-slate-700 hover:text-green-600 flex items-center gap-1">
                {altPhone} <PhoneIcon />
              </a>
            </div>
          )}
        </div>

        {/* 5. Rincian Pekerjaan & Biaya */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Rincian Layanan</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
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
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-500">Total Pendapatan</span>
            <span className="text-lg font-black text-green-600">
              Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* 6. Catatan Order */}
        {order.orderNote && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
              <span className="bg-slate-100 p-1 rounded"><InfoIcon /></span> Catatan Pesanan
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{order.orderNote}</p>
          </div>
        )}

        {/* 7. Lampiran Foto */}
        {order.attachments && order.attachments.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <span className="bg-slate-100 p-1 rounded"><AttachmentIcon /></span> Foto / Lampiran
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {order.attachments.map((att, idx) => (
                <a 
                  key={idx} 
                  href={att.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="aspect-square relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                >
                  <Image 
                    src={att.url} 
                    alt={att.description || `Lampiran ${idx + 1}`} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Spacer untuk floating button */}
        <div className="h-4"></div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 lg:sticky lg:bottom-4 lg:rounded-2xl lg:mx-4 lg:shadow-xl lg:border">
        <div className="max-w-xl mx-auto">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
}