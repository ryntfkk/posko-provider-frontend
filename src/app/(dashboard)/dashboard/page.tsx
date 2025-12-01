// src/app/(provider)/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchIncomingOrders, acceptOrder, fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';
import { fetchMyProviderProfile, updateAvailability } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- ICONS ---
const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

export default function ProviderDashboardPage() {
  // --- STATE USER & DASHBOARD ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming');
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- STATE KALENDER (AVAILABILITY) ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Fetch User Profile
        const profileResAuth = await fetchProfile();
        setUser(profileResAuth.data.profile);

        // 2. Fetch Orders
        const jobsRes = await fetchMyOrders('provider');
        setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

        const incomingRes = await fetchIncomingOrders();
        setIncomingOrders(Array.isArray(incomingRes.data) ? incomingRes.data : []);

        // 3. Fetch Provider Details (Calendar etc)
        const providerRes = await fetchMyProviderProfile();
        if (providerRes.data) {
          const blocked = (providerRes.data.blockedDates || []).map((d: string) => d.split('T')[0]);
          const booked = (providerRes.data.bookedDates || []).map((d: string) => d.split('T')[0]);
          setBlockedDates(blocked);
          setBookedDates(booked);
        }
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // --- STATISTIK ---
  const activeJobs = useMemo(() => myJobs.filter(o => ['accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status)), [myJobs]);
  const historyJobs = useMemo(() => myJobs.filter(o => ['completed', 'cancelled', 'failed'].includes(o.status)), [myJobs]);
  const completedCount = useMemo(() => myJobs.filter(o => o.status === 'completed').length, [myJobs]);
  const totalEarnings = useMemo(() => myJobs.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0), [myJobs]);
  const rating = 5.0; // Placeholder, idealnya dari API

  // --- HANDLERS ORDER ---
  const handleAccept = async (orderId: string) => {
    if (!confirm('Ambil pesanan ini?')) return;
    setProcessingId(orderId);
    try {
      await acceptOrder(orderId);
      alert('Pesanan diterima! Cek tab Berlangsung.');

      const incRes = await fetchIncomingOrders();
      setIncomingOrders(incRes.data);
      const jobsRes = await fetchMyOrders('provider');
      setMyJobs(jobsRes.data);

      const profileRes = await fetchMyProviderProfile();
      if (profileRes.data) {
        setBookedDates((profileRes.data.bookedDates || []).map((d: string) => d.split('T')[0]));
      }

      setActiveTab('active');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal terima order');
    } finally {
      setProcessingId(null);
    }
  };

  // --- HANDLERS KALENDER ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const dateStr = offsetDate.toISOString().split('T')[0];

    if (bookedDates.includes(dateStr)) {
      alert("Tanggal ini sudah ada pesanan aktif. Selesaikan dulu untuk membuka kembali.");
      return;
    }

    if (blockedDates.includes(dateStr)) {
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setBlockedDates(prev => [...prev, dateStr]);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSavingDates(true);
    try {
      await updateAvailability(blockedDates);
      alert("Ketersediaan kalender berhasil diperbarui!");
      setIsCalendarOpen(false);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan pengaturan kalender.");
    } finally {
      setIsSavingDates(false);
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentMonth);
    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);

    const dayCells = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = offsetDate.toISOString().split('T')[0];

      const isBlocked = blockedDates.includes(dateStr);
      const isBooked = bookedDates.includes(dateStr);
      const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

      let cellClass = "bg-white border-gray-200 hover:bg-gray-50 text-gray-700";

      if (isBooked) {
        cellClass = "bg-red-100 text-red-600 border-red-200 cursor-not-allowed";
      } else if (isBlocked) {
        cellClass = "bg-gray-800 text-white border-gray-800";
      } else if (isPast) {
        cellClass = "bg-gray-50 text-gray-300 cursor-default";
      }

      return (
        <div
          key={day}
          onClick={() => !isPast && handleDateClick(day)}
          className={`aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all relative ${cellClass}`}
        >
          <span className="text-xs font-bold">{day}</span>
          {isBooked && <span className="text-[8px] font-bold uppercase mt-1">Full</span>}
          {isBlocked && <span className="text-[8px] font-medium opacity-80 mt-1">Libur</span>}
        </div>
      );
    });

    return [...blanks, ...dayCells];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="Posko" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 leading-none">
                Mitra<span className="text-red-600">Posko</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <Image
                  src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* DASHBOARD UTAMA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-red-100">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-1">Halo, {user.fullName.split(' ')[0]}! 👋</h2>
                  <p className="text-red-100 text-sm lg:text-base opacity-90">Kelola pesanan dan ketersediaan tanggalmu.</p>
                </div>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-xs font-bold transition-all backdrop-blur-sm border border-white/20"
                >
                  <CalendarIcon /> Kalender Saya
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 divide-x divide-red-600/30">
                <div className="pr-4">
                  <p className="text-xs text-red-200 mb-1">Rating</p>
                  <div className="flex items-center gap-1 text-lg lg:text-2xl font-bold">{rating} <StarIcon /></div>
                </div>
                <div className="px-4">
                  <p className="text-xs text-red-200 mb-1">Selesai</p>
                  <p className="text-lg lg:text-2xl font-bold">{completedCount} Job</p>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-red-200 mb-1">Saldo</p>
                  <p className="text-lg lg:text-xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(user.balance || 0)}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <div className="p-2 bg-gray-100 rounded-lg"><WalletIcon /></div>
                <span className="text-xs font-bold uppercase tracking-wide">Total Pendapatan</span>
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEarnings)}
              </p>
              <p className="text-xs text-gray-400">Akumulasi dari pesanan selesai</p>
            </div>
            <button className="w-full mt-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
              Riwayat Transaksi
            </button>
          </div>
        </section>

        {/* TAB PESANAN */}
        <section>
          <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'incoming' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Order Masuk <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">{incomingOrders.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'active' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Berlangsung <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">{activeJobs.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'history' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Riwayat
            </button>
          </div>

          {activeTab === 'incoming' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingOrders.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                  <p className="text-gray-400">Belum ada pesanan masuk.</p>
                </div>
              ) : (
                incomingOrders.map((order) => (
                  <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    {order.orderType === 'direct' && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">DIRECT</div>
                    )}
                    {order.status === 'paid' && (
                      <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">PAID</div>
                    )}

                    <div className="mb-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Jadwal Kunjungan</p>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <CalendarIcon />
                        <span className="text-sm font-bold text-gray-900">
                          {order.scheduledAt
                            ? new Date(order.scheduledAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            : 'Segera (ASAP)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase line-clamp-1">
                        {order.items[0]?.name} {order.items.length > 1 && `+${order.items.length - 1}`}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <Image
                          src={(order.userId as { profilePictureUrl?: string })?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
                          width={40}
                          height={40}
                          alt="Customer"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{(order.userId as { fullName?: string })?.fullName || 'Pelanggan'}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <LocationIcon />
                          {order.shippingAddress?.city || 'Lokasi'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAccept(order._id)}
                      disabled={!!processingId}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-100"
                    >
                      {processingId === order._id ? 'Memproses...' : 'Ambil Pesanan'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  Tidak ada pekerjaan aktif.
                </div>
              ) : (
                activeJobs.map((order) => (
                  <Link href={`/jobs/${order._id}`} key={order._id} className="block bg-white p-5 rounded-2xl border-l-4 border-blue-600 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                          <span className="text-xs font-bold text-blue-600 uppercase">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{order.items[0]?.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs font-medium text-gray-600">
                          <CalendarIcon />
                          {order.scheduledAt
                            ? new Date(order.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'ASAP'}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                        <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-4)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  Belum ada riwayat pekerjaan.
                </div>
              ) : (
                historyJobs.map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{order.items[0]?.name}</h4>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-bold text-gray-900 mt-1">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {/* MODAL KALENDER KETERSEDIAAN */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Kalender Saya</h3>
                <p className="text-xs text-gray-500">Atur ketersediaan tanggal kerja Anda</p>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex items-center justify-between bg-gray-50">
              <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600">
                <ChevronLeft />
              </button>
              <span className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600">
                <ChevronRight />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-7 mb-2 text-center">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                  <div key={i} className="text-xs font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>

              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border border-gray-200 bg-white"></div>
                  <span className="text-xs text-gray-500">Kosong</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-800"></div>
                  <span className="text-xs text-gray-500">Libur (Anda)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                  <span className="text-xs text-gray-500">Ada Job</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSavingDates}
              >
                Batal
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={isSavingDates}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingDates ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}