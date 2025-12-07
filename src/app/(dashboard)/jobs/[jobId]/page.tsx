// src/app/(dashboard)/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { fetchOrderById, updateOrderStatus, uploadCompletionEvidence, requestAdditionalFee } from '@/features/orders/api';
import { fetchProfile } from '@/features/auth/api';
import { Order } from '@/features/orders/types';
import { User } from '@/features/auth/types';
import api from '@/lib/axios';

// Dynamic Import Map untuk performa
const JobMap = dynamic(() => import('@/components/JobMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Memuat Peta...
    </div>
  ),
});

// --- ICONS ---
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
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

const ChatIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // [REMOVED] const [platformFeePercent, setPlatformFeePercent] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [earningsBreakdown, setEarningsBreakdown] = useState<any>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // State untuk Additional Fee Modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeDescription, setFeeDescription] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Fungsi Fetch Data Manual (dipakai saat inisialisasi atau socket event)
  const refreshOrderData = async () => {
    try {
      const orderRes = await fetchOrderById(jobId);
      setOrder(orderRes.data);

      if (orderRes.data.status === 'completed' && orderRes.data.earnings) {
        setEarningsBreakdown(orderRes.data.earnings);
        // Refresh profile untuk update saldo
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
      }
    } catch (error) {
      console.error('Gagal memuat detail job:', error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await refreshOrderData();
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
        
        // [REMOVED] Fetch Global Config
      } catch (err) {
        console.error("Error init data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();

    // Initialize Socket Connection
    const token = localStorage.getItem('posko_token');
    if (token) {
        if (!socketRef.current) {
            const newSocket = io(SOCKET_URL, { 
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true
            });

            newSocket.on('connect', () => {
                console.log('✅ JobDetail Socket Connected');
            });

            // Listen: Update Status Order Spesifik
            newSocket.on('order_status_update', (data) => {
                if (data.orderId === jobId) {
                    console.log('🔄 Order Update Received:', data);
                    refreshOrderData(); // Refresh data full dari server
                }
            });

            socketRef.current = newSocket;
        }
    }

    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };
  }, [jobId]);

  // --- PERHITUNGAN BIAYA & PENGHASILAN (LOGIKA DIPERBAIKI) ---
  const financials = useMemo(() => {
    if (!order) return null;

    // 1. Biaya Jasa Utama (Base Items)
    const baseServiceTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 2. Biaya Tambahan (Approved/Paid Only untuk Total Tagihan)
    const approvedFees = order.additionalFees?.filter(
      fee => fee.status === 'paid' || fee.status === 'approved_unpaid'
    ) || [];
    const additionalFeesTotal = approvedFees.reduce((acc, fee) => acc + fee.amount, 0);

    // 3. Subtotal Layanan (Jasa + Tambahan) -> INI YANG ANDA MINTA
    const serviceSubtotal = baseServiceTotal + additionalFeesTotal;

    // 4. Perhitungan Tagihan ke Customer
    // Total Bayar = (Jasa + Tambahan + Admin) - Diskon
    const customerGrandTotal = serviceSubtotal + order.adminFee - order.discountAmount;

    // 5. Estimasi Penghasilan (Jika belum completed)
    // Rumus: (Jasa + Tambahan - Diskon) - Komisi Platform
    
    // Potensi Revenue (Sebelum potongan platform)
    const grossRevenue = serviceSubtotal - order.discountAmount;
    
    // [FIX] Menggunakan snapshot dari DB (appliedCommissionPercent)
    const platformFeePercent = order.appliedCommissionPercent ?? 12;
    const estimatedCommission = Math.round((grossRevenue * platformFeePercent) / 100);
    
    // Estimasi Bersih
    const estimatedNetEarnings = grossRevenue - estimatedCommission;

    return {
      baseServiceTotal,
      additionalFeesTotal,
      serviceSubtotal, // GABUNGAN JASA + TAMBAHAN
      customerGrandTotal,
      grossRevenue,
      estimatedCommission,
      estimatedNetEarnings,
      platformFeePercent
    };
  }, [order]); // [FIX] Hapus dependency platformFeePercent

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'waiting_approval') {
      if (!order?.completionEvidence || order.completionEvidence.length === 0) {
        alert('Mohon upload bukti pekerjaan (foto) terlebih dahulu sebelum menyelesaikan pekerjaan.');
        return;
      }

      const hasUnpaidFees = order?.additionalFees?.some(
        fee => fee.status === 'pending_approval' || fee.status === 'approved_unpaid'
      );

      if (hasUnpaidFees) {
        alert('Ada biaya tambahan yang belum disetujui atau dibayar oleh pelanggan. Mohon tunggu penyelesaian pembayaran.');
        return;
      }
    }

    if (! confirm(`Ubah status menjadi "${newStatus}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(jobId, newStatus);
      setOrder(response.data);

      if (newStatus === 'completed' && response.data.earnings) {
        setEarningsBreakdown(response.data.earnings);
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
        alert('Pesanan selesai! Earnings Anda sudah masuk ke saldo.');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || `Gagal mengubah status ke ${newStatus}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }

      setIsUploading(true);
      try {
        const response = await uploadCompletionEvidence(jobId, file);
        setOrder(response.data);
        alert('Foto berhasil diupload!');
      } catch (error: any) {
        console.error('Upload error:', error);
        alert(error.response?.data?.message || 'Gagal mengupload foto');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleSubmitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeDescription || !feeAmount) return;

    setIsSubmittingFee(true);
    try {
      const response = await requestAdditionalFee(jobId, feeDescription, parseInt(feeAmount));
      setOrder(response.data);
      setShowFeeModal(false);
      setFeeDescription('');
      setFeeAmount('');
      alert('Permintaan biaya tambahan berhasil dikirim ke pelanggan.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengajukan biaya tambahan.');
    } finally {
      setIsSubmittingFee(false);
    }
  };

  // Fungsi untuk Chat Pelanggan
  const handleChatWithCustomer = async () => {
    if (!order || !order.userId) return;
    
    // Safety check jika userId adalah object (Populated) atau string
    const targetUserId = typeof order.userId === 'object' 
        ? (order.userId as any)._id 
        : order.userId;

    if (!targetUserId) {
        alert("Data pelanggan tidak valid.");
        return;
    }

    setIsCreatingChat(true);
    try {
        // Panggil endpoint create/get room
        await api.post('/chat', { targetUserId });
        // Redirect ke halaman pesan
        router.push('/messages');
    } catch (error: any) {
        console.error('Failed to create chat room:', error);
        alert(error.response?.data?.message || 'Gagal memulai chat.');
    } finally {
        setIsCreatingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  if (!order || !financials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Pesanan tidak ditemukan</p>
          <Link href="/dashboard" className="text-red-600 font-bold">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const isCompleted = order.status === 'completed';
  const isWaitingApproval = order.status === 'waiting_approval';
  const isWorking = order.status === 'working';
  const isOnTheWay = order.status === 'on_the_way';
  const isAccepted = order.status === 'accepted';

  const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

  return (
    <div className="min-h-screen bg-gray-50 relative font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali
          </Link>
          <div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
              isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
              isWaitingApproval ? 'bg-blue-50 text-blue-700 border-blue-200' :
              isWorking ? 'bg-purple-50 text-purple-700 border-purple-200' :
              isOnTheWay ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
        {/* CUSTOMER INFO */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Informasi Pelanggan
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <Image
                src={(order.userId as any)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(order.userId as any)?.fullName}`}
                width={56}
                height={56}
                alt="Customer"
                className="object-cover w-full h-full"
                />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{(order.userId as any)?.fullName}</h3>
              <div className="mt-1 flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 inline-flex px-2 py-1 rounded-lg w-fit">
                  <PhoneIcon />
                  <span className="font-mono font-medium">{order.customerContact?.phone || (order.userId as any)?.phoneNumber || '-'}</span>
                </div>
                
                {/* TOMBOL CHAT (BARU) */}
                <button 
                  onClick={handleChatWithCustomer}
                  disabled={isCreatingChat}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors border border-red-100 font-bold text-xs"
                >
                    {isCreatingChat ? (
                        <span className="animate-pulse">Memuat...</span>
                    ) : (
                        <>
                            <ChatIcon /> Chat Customer
                        </>
                    )}
                </button>
              </div>
              {order.customerContact?.name && (
                  <span className="text-xs text-gray-500 mt-1 block">Penerima: {order.customerContact.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* LOKASI & PETA */}
        {order.location && order.location.coordinates && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <LocationIcon /> Lokasi Pengerjaan
            </h2>
            <div className="w-full h-56 rounded-xl overflow-hidden border border-gray-200 relative z-0 mb-4">
              <JobMap coordinates={order.location.coordinates as [number, number]} />
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <p className="font-bold text-gray-900">Alamat Lengkap:</p>
                <p>{order.shippingAddress?.detail}</p>
                <p className="text-gray-500">{order.shippingAddress?.district}, {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
              </div>
              
              {/* Property Details */}
              <div className="grid grid-cols-2 gap-3 mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                 <div>
                    <span className="text-xs text-gray-500">Tipe Properti</span>
                    <p className="font-bold text-sm capitalize">{order.propertyDetails?.type || '-'}</p>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500">Lantai</span>
                    <p className="font-bold text-sm">{order.propertyDetails?.floor !== null ? order.propertyDetails?.floor : '-'}</p>
                 </div>
                 {order.propertyDetails?.accessNote && (
                    <div className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                        <span className="text-xs text-gray-500">Catatan Akses</span>
                        <p className="text-sm italic text-gray-700">"{order.propertyDetails.accessNote}"</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* DOKUMENTASI PEKERJAAN */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
            <CameraIcon /> Dokumentasi
          </h2>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {order.attachments?.map((att, idx) => (
                <div key={`att-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <Image 
                    src={att.url.startsWith('http') ? att.url : `${SERVER_URL}${att.url}`} 
                    alt={`Lampiran Awal ${idx + 1}`} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Lampiran User
                  </div>
                </div>
            ))}

            {order.completionEvidence?.map((evidence, idx) => (
              <div key={`ev-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-green-200 ring-2 ring-green-100 group">
                <Image 
                  src={evidence.url.startsWith('http') ? evidence.url : `${SERVER_URL}${evidence.url}`} 
                  alt={`Bukti Selesai ${idx + 1}`} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full text-[8px] shadow-sm">
                    <CheckIcon />
                </div>
              </div>
            ))}
            
            {isWorking && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all text-gray-400 hover:text-red-600 bg-gray-50">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-red-600"></div>
                ) : (
                  <>
                    <CameraIcon />
                    <span className="text-[10px] font-bold mt-1 text-center px-1">Upload Bukti Selesai</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* RINCIAN BIAYA & PENGHASILAN (REVISI) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <ReceiptIcon /> Rincian Transaksi
            </h2>
            <div className="text-xs text-gray-400 font-mono">#{order.orderNumber}</div>
          </div>

          {/* 1. DETAIL LAYANAN */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">1. Jasa Layanan</p>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1">
                  <span className="text-gray-800 font-medium">{item.name}</span>
                  <div className="text-xs text-gray-400">{item.quantity} x Rp {new Intl.NumberFormat('id-ID').format(item.price)}</div>
                </div>
                <span className="font-bold text-gray-900">
                  Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* 2. BIAYA TAMBAHAN */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">2. Biaya Tambahan</p>
              {isWorking && (
                <button 
                  onClick={() => setShowFeeModal(true)}
                  className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-bold transition-colors border border-red-100"
                >
                  + Tambah
                </button>
              )}
            </div>

            {(!order.additionalFees || order.additionalFees.length === 0) ? (
              <p className="text-xs text-gray-400 italic">Belum ada biaya tambahan.</p>
            ) : (
              <div className="space-y-2">
                {order.additionalFees.map((fee, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-gray-800 font-medium">{fee.description}</span>
                      <span className={`text-[10px] font-bold uppercase ${
                        fee.status === 'paid' ? 'text-green-600' :
                        fee.status === 'approved_unpaid' ? 'text-blue-600' :
                        fee.status === 'rejected' ? 'text-red-500 line-through' :
                        'text-yellow-600'
                      }`}>
                        {fee.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`font-bold ${fee.status === 'rejected' ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(fee.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. SUBTOTAL LAYANAN (JASA + TAMBAHAN) - REQUESTED FEATURE */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100 bg-blue-50/50 p-3 rounded-lg -mx-2">
            <span className="text-sm font-bold text-blue-800 uppercase">Subtotal Layanan (1 + 2)</span>
            <span className="text-lg font-black text-blue-900">
              Rp {new Intl.NumberFormat('id-ID').format(financials.serviceSubtotal)}
            </span>
          </div>

          {/* 4. INFO TAGIHAN CUSTOMER */}
          <div className="space-y-2 pt-4 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Biaya Admin Aplikasi</span>
              <span>Rp {new Intl.NumberFormat('id-ID').format(order.adminFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Diskon Voucher</span>
                <span className="text-green-600 font-bold">-Rp {new Intl.NumberFormat('id-ID').format(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
              <span>Total Tagihan Customer</span>
              <span className="text-base">Rp {new Intl.NumberFormat('id-ID').format(financials.customerGrandTotal)}</span>
            </div>
          </div>

          {/* 5. ESTIMASI PENGHASILAN MITRA */}
          <div className="mt-6 bg-gray-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <div className="flex items-center gap-2 mb-3 text-gray-300">
              <WalletIcon />
              <span className="text-xs font-bold uppercase tracking-widest">{isCompleted ? 'Penghasilan Bersih' : 'Estimasi Penghasilan'}</span>
            </div>

            <div className="space-y-1 mb-4 relative z-10">
              <span className="text-4xl font-black tracking-tight">
                Rp {new Intl.NumberFormat('id-ID').format(
                  isCompleted && earningsBreakdown 
                    ? earningsBreakdown.earningsAmount 
                    : financials.estimatedNetEarnings
                )}
              </span>
              <p className="text-xs text-gray-400">
                {isCompleted 
                  ? 'Dana sudah masuk ke saldo dompet.' 
                  : 'Akan masuk ke saldo setelah pesanan selesai.'}
              </p>
            </div>

            {/* Rincian Potongan */}
            <div className="border-t border-white/10 pt-3 text-xs text-gray-300 space-y-1 relative z-10">
              <div className="flex justify-between">
                <span>Pendapatan Kotor (Subtotal - Diskon)</span>
                <span>Rp {new Intl.NumberFormat('id-ID').format(financials.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>Potongan Platform (~{financials.platformFeePercent}%)</span>
                <span>-Rp {new Intl.NumberFormat('id-ID').format(
                   isCompleted && earningsBreakdown 
                   ? earningsBreakdown.platformCommissionAmount 
                   : financials.estimatedCommission
                )}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-30 lg:relative lg:bg-transparent lg:border-0 lg:p-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            {isAccepted && (
              <button
                onClick={() => handleStatusUpdate('on_the_way')}
                disabled={isUpdating}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 disabled:opacity-50 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Mulai Perjalanan'}
              </button>
            )}

            {isOnTheWay && (
              <button
                onClick={() => handleStatusUpdate('working')}
                disabled={isUpdating}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100 disabled:opacity-50 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Mulai Bekerja'}
              </button>
            )}

            {isWorking && (
              <button
                onClick={() => handleStatusUpdate('waiting_approval')}
                disabled={isUpdating || !order.completionEvidence || order.completionEvidence.length === 0}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:bg-gray-300 transition-all"
              >
                {isUpdating ? 'Memproses...' : 'Selesaikan Pekerjaan'}
              </button>
            )}

            {isWaitingApproval && (
              <div className="w-full py-3.5 rounded-xl text-center text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 animate-pulse">
                ⏳ Menunggu konfirmasi pembayaran pelanggan...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL AJUKAN BIAYA */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajukan Biaya Tambahan</h3>
            <p className="text-xs text-gray-500 mb-4">Biaya untuk sparepart atau pekerjaan di luar paket.</p>
            <form onSubmit={handleSubmitFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</label>
                <input
                  type="text"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  placeholder="Contoh: Ganti kapasitor AC"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Biaya (Rp)</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-bold"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFee}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 disabled:opacity-50 transition-all"
                >
                  {isSubmittingFee ? 'Mengirim...' : 'Ajukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}