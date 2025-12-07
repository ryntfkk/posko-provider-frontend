'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  fetchEarningsHistory, 
  fetchEarningsSummary,
  requestPayout, 
  fetchPayoutHistory,
  EarningsRecord, 
  PayoutRequest 
} from '@/features/earnings/api';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import { toast } from 'react-hot-toast';

// --- ICONS ---
const WalletIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-6 3h6m6-9V6a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2h14a2 2 0 002-2v-4" />
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

const BankIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
);

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState({
    currentBalance: 0,
    lifetimeEarnings: 0,
    totalWithdrawn: 0,
    completedOrders: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  // Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [profileRes, earningsRes, summaryRes, payoutsRes] = await Promise.all([
        fetchProfile(),
        fetchEarningsHistory(),
        fetchEarningsSummary(),
        fetchPayoutHistory()
      ]);
      setUser(profileRes.data.profile);
      setEarnings(Array.isArray(earningsRes.data) ? earningsRes.data : []);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (Array.isArray(payoutsRes.data)) setPayouts(payoutsRes.data);
    } catch (error) {
      console.error('Gagal memuat data:', error);
      toast.error('Gagal memuat data keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) < 10000) {
      toast.error('Minimal pencairan Rp 10.000');
      return;
    }
    
    if (Number(payoutAmount) > summary.currentBalance) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayout(Number(payoutAmount));
      toast.success('Permintaan pencairan berhasil dikirim!');
      setShowPayoutModal(false);
      setPayoutAmount('');
      loadData(); // Refresh data
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Gagal mengajukan pencairan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Sort Earnings
  const filteredEarnings = earnings
    .filter(e => filterStatus === 'all' ? true : e.status === filterStatus)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  // Sort Payouts
  const sortedPayouts = payouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        
        {/* WALLET CARD */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl shadow-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <div className="p-1.5 bg-white/20 rounded-lg"><WalletIcon /></div>
                  <span className="text-xs font-medium uppercase tracking-wide">Saldo Aktif</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium opacity-70">Rp</span>
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
                    {new Intl.NumberFormat('id-ID').format(summary.currentBalance)}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setShowPayoutModal(true)}
                className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <BankIcon /> Tarik Dana
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase">Total Ditarik</p>
                <p className="font-bold text-sm">Rp {new Intl.NumberFormat('id-ID', { notation: "compact", maximumFractionDigits: 1 }).format(summary.totalWithdrawn)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase">Order Selesai</p>
                <p className="font-bold text-sm">{summary.completedOrders} <span className="text-xs font-normal opacity-70">Pesanan</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'transactions' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Riwayat Transaksi
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'payouts' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Riwayat Penarikan
          </button>
        </div>

        {/* CONTENT: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
             <div className="flex justify-end mb-2">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-200 text-xs font-medium px-3 py-1.5 pr-7 rounded-lg focus:outline-none text-gray-600"
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
                        {new Date(record.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-gray-900">Pemasukan Order</p>
                      <p className="text-xs text-gray-500">Ref: #{record.orderId.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        +Rp {new Intl.NumberFormat('id-ID').format(record.earningsAmount)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        record.status === 'completed' ? 'bg-blue-50 text-blue-700' : 
                        record.status === 'paid_out' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {record.status === 'paid_out' ? 'Dicairkan' : record.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENT: PAYOUTS */}
        {activeTab === 'payouts' && (
          <div className="space-y-3">
             {sortedPayouts.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Belum ada riwayat penarikan.</p>
                </div>
             ) : (
                sortedPayouts.map(payout => (
                  <div key={payout._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">
                        {new Date(payout.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                      <p className="text-sm font-bold text-gray-900">Penarikan Dana</p>
                      {payout.bankSnapshot && (
                        <p className="text-xs text-gray-500">
                          {payout.bankSnapshot.bankName} - {payout.bankSnapshot.accountNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        Rp {new Intl.NumberFormat('id-ID').format(payout.amount)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        payout.status === 'approved' ? 'bg-green-50 text-green-700' :
                        payout.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {payout.status === 'pending' ? 'Diproses' : payout.status}
                      </span>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}

      </main>

      {/* MODAL PAYOUT */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tarik Dana</h3>
            <p className="text-xs text-gray-500 mb-6">Dana akan ditransfer ke rekening bank terdaftar Anda dalam 1-3 hari kerja.</p>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nominal Penarikan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-lg font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="0"
                    min={10000}
                    max={summary.currentBalance}
                    required
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-400">Min. Rp 10.000</span>
                  <span className="text-gray-400">Maks. Rp {new Intl.NumberFormat('id-ID').format(summary.currentBalance)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Number(payoutAmount) > summary.currentBalance}
                  className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Memproses...' : 'Ajukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}