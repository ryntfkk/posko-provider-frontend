import api from '@/lib/axios';

export interface EarningsRecord {
  _id: string;
  orderId: string;
  totalAmount: number;
  additionalFeeAmount?: number;
  adminFee: number;
  platformCommissionPercent: number;
  platformCommissionAmount: number;
  earningsAmount: number;
  status: 'pending' | 'completed' | 'paid_out';
  completedAt: string;
  createdAt: string;
}

// [BARU] Interface untuk Payout Request
export interface PayoutRequest {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminNote?: string;
  bankSnapshot?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
}

// Fetch earnings history
export const fetchEarningsHistory = async (status?: string, startDate?: string, endDate?: string) => {
  const response = await api.get<{ data: EarningsRecord[] }>('/earnings', {
    params: { status, startDate, endDate }
  });
  return response.data;
};

// Get earnings summary
// [UPDATE] Sesuaikan dengan response backend terbaru (ada currentBalance)
export const fetchEarningsSummary = async () => {
  const response = await api.get<{ 
    data: {
      currentBalance: number;
      lifetimeEarnings: number;
      totalWithdrawn: number;
      completedOrders: number;
      totalPlatformCommission: number;
      averageEarningsPerOrder: number;
    }
  }>('/earnings/summary');
  return response.data;
};

// [BARU] Request Payout
export const requestPayout = async (amount: number) => {
  const response = await api.post<{ 
    message: string; 
    data: PayoutRequest; 
    remainingBalance: number 
  }>('/earnings/payout', { amount });
  return response.data;
};

// [BARU] Get Payout History
export const fetchPayoutHistory = async () => {
  const response = await api.get<{ 
    message: string; 
    data: PayoutRequest[] 
  }>('/earnings/payout/history');
  return response.data;
};