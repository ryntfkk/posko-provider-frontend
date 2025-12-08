// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchIncomingOrders, acceptOrder, fetchMyOrders, rejectOrder } from '@/features/orders/api';
import { Order } from '@/features/orders/types';
import { fetchMyProviderProfile, updateAvailability } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import { useSocket } from '@/hooks/useSocket';

// --- COMPACT ICONS (Size optimized) ---
const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const LocationIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

export default function ProviderDashboardPage() {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming');
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- CALENDAR STATE ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { socket } = useSocket();

  // Helper: Refresh Data
  const refreshUserProfile = async () => {
    try {
      const profileRes = await fetchProfile();
      if (profileRes.data.profile) setUser(profileRes.data.profile);
    } catch (e) { console.error(e); }
  };

  const refreshOrders = async () => {
    try {
        const [jobsRes, incomingRes] = await Promise.all([
            fetchMyOrders('provider'),
            fetchIncomingOrders()
        ]);
        setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
        setIncomingOrders(Array.isArray(incomingRes.data) ? incomingRes.data : []);
    } catch (e) { console.error(e); }
  };

  // Initial Load
  useEffect(() => {
    const initData = async () => {
      try {
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);
        await refreshOrders();
        
        const providerRes = await fetchMyProviderProfile();
        if (providerRes.data) {
          setBlockedDates((providerRes.data.blockedDates || []).map((d: string) => d.split('T')[0]));
          setBookedDates((providerRes.data.bookedDates || []).map((d: string) => d.split('T')[0]));
        }
      } catch (e) { console.error(e); } 
      finally { setIsLoading(false); }
    };
    initData();
  }, []);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
        setIncomingOrders(prev => {
            if (prev.find(o => o._id === data.order._id)) return prev;
            return [data.order, ...prev];
        });
    };

    const handleStatusUpdate = () => {
        refreshOrders(); 
        refreshUserProfile(); 
    };

    socket.on('order_new', handleNewOrder);
    socket.on('order_status_update', handleStatusUpdate);

    return () => {
        socket.off('order_new', handleNewOrder);
        socket.off('order_status_update', handleStatusUpdate);
    };
  }, [socket]); 

  // --- COMPUTED DATA ---
  const activeJobs = useMemo(() => myJobs.filter(o => ['accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status)), [myJobs]);
  const historyJobs = useMemo(() => myJobs.filter(o => ['completed', 'cancelled', 'failed'].includes(o.status)), [myJobs]);
  const completedCount = useMemo(() => myJobs.filter(o => o.status === 'completed').length, [myJobs]);
  const rating = 5.0; // Placeholder

  // --- ACTIONS ---
  const handleAccept = async (orderId: string) => {
    if (!confirm('Ambil pesanan ini?')) return;
    setProcessingId(orderId);
    try {
      await acceptOrder(orderId);
      await refreshOrders();
      setActiveTab('active');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal terima order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm('Tolak pesanan ini?')) return;
    setProcessingId(orderId);
    try {
      await rejectOrder(orderId);
      setIncomingOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal tolak order');
    } finally {
      setProcessingId(null);
    }
  };

  // --- CALENDAR LOGIC ---
  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    if (bookedDates.includes(dateStr)) return alert("Tanggal ini ada pesanan aktif.");
    
    setBlockedDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSaveAvailability = async () => {
    setIsSavingDates(true);
    try {
      await updateAvailability(blockedDates);
      setIsCalendarOpen(false);
    } catch (e) { alert("Gagal menyimpan."); } 
    finally { setIsSavingDates(false); }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`b-${i}`} />);

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const isBlocked = blockedDates.includes(dateStr);
      const isBooked = bookedDates.includes(dateStr);
      const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

      let cls = "bg-white text-gray-700 hover:bg-gray-50 border-gray-100";
      if (isBooked) cls = "bg-red-50 text-red-600 border-red-100 cursor-not-allowed";
      else if (isBlocked) cls = "bg-gray-800 text-white border-gray-800";
      else if (isPast) cls = "bg-gray-50 text-gray-300 cursor-default";

      return (
        <div key={day} onClick={() => !isPast && !isBooked && handleDateClick(day)} 
             className={`aspect-square rounded border flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold relative ${cls}`}>
          {day}
        </div>
      );
    });
    return [...blanks, ...days];
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-10">
      {/* HEADER: Branding Restored + Compact Actions */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* BRANDING: Logo & Text */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="Posko" fill className="object-contain" />
            </div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-none">
              Mitra<span className="text-red-600">Posko</span>
            </h1>
          </div>
          
          {/* RIGHT ACTIONS: Calendar & Profile */}
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsCalendarOpen(true)} 
                className="p-2 text-gray-500 hover:bg-gray-50 rounded-full border border-gray-100 transition-colors"
                aria-label="Atur Kalender"
             >
                <CalendarIcon className="w-5 h-5" />
             </button>
             <Link href="/settings">
              <div className="relative w-9 h-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                  <Image 
                    src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
                    fill 
                    className="object-cover" 
                    alt="Profile" 
                  />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* WELCOME SECTION (Compact) */}
        <div className="flex justify-between items-end">
             <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Halo, {user.fullName.split(' ')[0]} 👋</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <span className="flex items-center text-yellow-500 font-bold gap-0.5">{rating} <StarIcon /></span>
                    <span>•</span>
                    <span>{completedCount} Selesai</span>
                </div>
            </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                    <WalletIcon /> <span className="text-[10px] uppercase font-bold tracking-wider">Saldo</span>
                </div>
                <p className="text-lg font-black text-gray-900">
                    Rp {new Intl.NumberFormat('id-ID', { notation: "compact", maximumFractionDigits: 1 }).format(user.balance || 0)}
                </p>
            </div>
             <Link href="/earnings" className="bg-gray-900 p-3 rounded-xl border border-gray-900 shadow-sm flex flex-col justify-center text-white hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Riwayat &<br/>Penarikan</span>
                    <ChevronRight />
                </div>
            </Link>
        </div>

        {/* TAB NAVIGATION (Dense) */}
        <div className="flex border-b border-gray-200">
            {['incoming', 'active', 'history'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${
                        activeTab === tab ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    {tab === 'incoming' ? 'Masuk' : tab === 'active' ? 'Aktif' : 'Riwayat'}
                    {tab === 'incoming' && incomingOrders.length > 0 && (
                        <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 rounded text-[10px]">{incomingOrders.length}</span>
                    )}
                </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="min-h-[300px]">
            {/* 1. INCOMING TAB */}
            {activeTab === 'incoming' && (
                <div className="space-y-3">
                    {incomingOrders.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-xs text-gray-400">Belum ada pesanan masuk.</p>
                        </div>
                    ) : (
                        incomingOrders.map((order) => (
                            <div key={order._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                                {/* Compact Header */}
                                <div className="bg-gray-50/50 px-3 py-2 flex justify-between items-center border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            order.orderType === 'direct' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {order.orderType}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono">#{order.orderNumber || order._id.slice(-4)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                                        {order.scheduledAt ? new Date(order.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'ASAP'}
                                        <span className="text-gray-300 mx-1">|</span>
                                        {order.scheduledTimeSlot?.preferredStart || '09:00'}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-bold text-gray-900 pr-2 line-clamp-1">
                                            {order.items[0]?.name} {order.items.length > 1 && `+${order.items.length - 1}`}
                                        </h3>
                                        <span className="text-sm font-black text-green-600 shrink-0">
                                            Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0 overflow-hidden relative mt-0.5">
                                             <Image src={(order.userId as any)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=u`} fill className="object-cover" alt="U" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-xs">
                                            <p className="font-bold text-gray-700 truncate">{(order.userId as any)?.fullName || 'Pelanggan'}</p>
                                            <p className="text-gray-500 truncate flex items-center gap-1">
                                                <LocationIcon className="w-3 h-3" />
                                                {order.shippingAddress?.detail || order.shippingAddress?.city}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Note Compact */}
                                    {order.orderNote && (
                                        <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-500 italic truncate">
                                            "{order.orderNote}"
                                        </div>
                                    )}
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-2 border-t border-gray-100">
                                    <button 
                                        onClick={() => handleReject(order._id)}
                                        disabled={!!processingId}
                                        className="py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 border-r border-gray-100 disabled:opacity-50"
                                    >
                                        Tolak
                                    </button>
                                    <button 
                                        onClick={() => handleAccept(order._id)}
                                        disabled={!!processingId}
                                        className="py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {processingId === order._id ? 'Memproses...' : 'Terima'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 2. ACTIVE TAB */}
            {activeTab === 'active' && (
                <div className="space-y-3">
                    {activeJobs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">Tidak ada pekerjaan aktif.</div>
                    ) : (
                        activeJobs.map(order => (
                            <Link href={`/jobs/${order._id}`} key={order._id} className="block bg-white border-l-4 border-blue-600 rounded-r-xl shadow-sm p-3 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {order.scheduledTimeSlot?.preferredStart}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">{order.items[0]?.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <LocationIcon />
                                    <span className="truncate max-w-[200px]">{order.shippingAddress?.city}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* 3. HISTORY TAB */}
            {activeTab === 'history' && (
                 <div className="space-y-0 divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white overflow-hidden">
                    {historyJobs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">Belum ada riwayat.</div>
                    ) : (
                        historyJobs.map(order => (
                            <div key={order._id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <div className="text-xs font-bold text-gray-900">{order.items[0]?.name}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('id-ID')}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[10px] font-bold uppercase ${order.status === 'completed' ? 'text-green-600' : 'text-red-500'}`}>
                                        {order.status}
                                    </div>
                                    <div className="text-xs font-medium text-gray-600">Rp {new Intl.NumberFormat('id-ID', { notation: "compact" }).format(order.totalAmount)}</div>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
            )}
        </div>
      </div>

      {/* CALENDAR MODAL (Compact) */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">Atur Libur</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft/></button>
                    <span className="text-xs font-bold uppercase pt-1">{currentMonth.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight/></button>
                </div>
            </div>
            
            <div className="p-4 overflow-y-auto">
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['M','S','S','R','K','J','S'].map(d => <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>
                <div className="flex gap-4 justify-center mt-4 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-800 rounded"></div> Libur</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-50 border border-red-200 rounded"></div> Full</div>
                </div>
            </div>

            <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-3 bg-gray-50">
                <button onClick={() => setIsCalendarOpen(false)} className="py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg">Tutup</button>
                <button onClick={handleSaveAvailability} disabled={isSavingDates} className="py-2 text-xs font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                    {isSavingDates ? '...' : 'Simpan'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}