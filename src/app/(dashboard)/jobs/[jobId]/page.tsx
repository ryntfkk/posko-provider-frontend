// src/app/(dashboard)/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { fetchOrderById, updateOrderStatus, uploadCompletionEvidence, requestAdditionalFee } from '@/features/orders/api';
import { fetchProfile } from '@/features/auth/api';
import { Order } from '@/features/orders/types';
import { User } from '@/features/auth/types';

// Dynamic Import Map
const JobMap = dynamic(() => import('@/components/JobMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Memuat Peta...
    </div>
  ),
});

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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [earningsBreakdown, setEarningsBreakdown] = useState<any>(null);

  // State untuk Additional Fee Modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeDescription, setFeeDescription] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);

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

  useEffect(() => {
    if (! order || order.status === 'completed') return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedOrder = await fetchOrderById(jobId);
        setOrder(updatedOrder.data);

        if (updatedOrder.data.status === 'completed' && order.status !== 'completed') {
          const profileRes = await fetchProfile();
          setUser(profileRes.data.profile);
          
          if (updatedOrder.data.earnings) {
            setEarningsBreakdown(updatedOrder.data.earnings);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [order, jobId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'waiting_approval') {
      // Validasi Bukti Pekerjaan
      if (!order?.completionEvidence || order.completionEvidence.length === 0) {
        alert('Mohon upload bukti pekerjaan (foto) terlebih dahulu sebelum menyelesaikan pekerjaan.');
        return;
      }

      // [BARU] Validasi Biaya Tambahan Pending/Unpaid
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
      } else {
        alert(`Status berhasil diubah menjadi ${newStatus}`);
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
      
      // Validasi ukuran (max 5MB)
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
        // Reset input value agar bisa upload file yang sama jika perlu
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

  // Base URL untuk gambar
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const SERVER_URL = API_URL.replace('/api', '');

  return (
    <div className="min-h-screen bg-gray-50 relative">
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

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
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
              </div>
            </div>
          </div>
        </div>

        {/* LOKASI & PETA */}
        {order.location && order.location.coordinates && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Lokasi Pengerjaan</h2>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative">
              <JobMap coordinates={order.location.coordinates as [number, number]} />
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
              <div className="mt-0.5"><LocationIcon /></div>
              <div>
                <p className="font-bold text-gray-900">Alamat:</p>
                <p>{order.shippingAddress?.detail}</p>
                <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
                {order.propertyDetails?.accessNote && (
                  <p className="mt-2 text-xs italic text-amber-600">Note: {order.propertyDetails.accessNote}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DOKUMENTASI PEKERJAAN */}
        {(isWorking || (order.completionEvidence && order.completionEvidence.length > 0)) && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Dokumentasi Pekerjaan</h2>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {order.completionEvidence?.map((evidence, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <Image 
                    src={evidence.url.startsWith('http') ? evidence.url : `${SERVER_URL}${evidence.url}`} 
                    alt={`Bukti ${idx + 1}`} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-[10px] text-white truncate">{new Date(evidence.uploadedAt || '').toLocaleTimeString('id-ID')}</p>
                  </div>
                </div>
              ))}
              
              {isWorking && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all text-gray-400 hover:text-red-600 relative">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-red-600"></div>
                  ) : (
                    <>
                      <CameraIcon />
                      <span className="text-[10px] font-bold mt-1">Upload</span>
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
            
            {isWorking && (!order.completionEvidence || order.completionEvidence.length === 0) && (
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg flex items-start gap-2">
                <InfoIcon />
                <span>Wajib mengupload minimal 1 foto bukti pekerjaan selesai sebelum menyelesaikan pesanan.</span>
              </div>
            )}
          </div>
        )}

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

        {/* [BARU] BIAYA TAMBAHAN */}
        {(isWorking || (order.additionalFees && order.additionalFees.length > 0)) && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Biaya Tambahan</h2>
              {isWorking && (
                <button 
                  onClick={() => setShowFeeModal(true)}
                  className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1"
                >
                  <PlusIcon /> Tambah
                </button>
              )}
            </div>

            {!order.additionalFees || order.additionalFees.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Tidak ada biaya tambahan.</p>
            ) : (
              <div className="space-y-3">
                {order.additionalFees.map((fee, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{fee.description}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        fee.status === 'paid' ? 'bg-green-100 text-green-700' :
                        fee.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {fee.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(fee.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RINGKASAN BIAYA (Updated with Additional Fees) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Biaya</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Layanan</span>
              <span className="font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount - order.adminFee)}</span>
            </div>
            
            {/* Tampilkan total biaya tambahan yang sudah disetujui/dibayar */}
            {order.additionalFees && order.additionalFees.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya Tambahan (Disetujui)</span>
                <span className="font-bold text-gray-900">
                  Rp {new Intl.NumberFormat('id-ID').format(
                    order.additionalFees
                      .filter(f => f.status === 'paid' || f.status === 'approved_unpaid')
                      .reduce((sum, f) => sum + f.amount, 0)
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya Admin</span>
              <span className="font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.adminFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon Voucher</span>
                <span className="font-bold text-green-600">-Rp {new Intl.NumberFormat('id-ID').format(order.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total Bayar Pelanggan</span>
              <span className="text-lg font-black text-gray-900">
                {/* Total = Base Total + Approved Additional Fees */}
                Rp {new Intl.NumberFormat('id-ID').format(
                  order.totalAmount + (order.additionalFees?.filter(f => f.status === 'paid' || f.status === 'approved_unpaid').reduce((sum, f) => sum + f.amount, 0) || 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* EARNINGS BREAKDOWN */}
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
                // Disable jika: updating, ATAU belum ada foto bukti, ATAU ada fee yang pending/unpaid
                disabled={
                  isUpdating || 
                  !order.completionEvidence || 
                  order.completionEvidence.length === 0 ||
                  (order.additionalFees?.some(f => f.status === 'pending_approval' || f.status === 'approved_unpaid') ?? false)
                }
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 transition-all"
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

      {/* MODAL AJUKAN BIAYA */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajukan Biaya Tambahan</h3>
            <form onSubmit={handleSubmitFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</label>
                <input
                  type="text"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  placeholder="Contoh: Ganti kapasitor AC"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500"
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
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 font-bold"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFee}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 disabled:opacity-50"
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