import api from '@/lib/axios';

export interface EarningsRecord {
  _id: string;
  orderId: string;
  totalAmount: number;
  additionalFeeAmount?: number; // [BARU] Field untuk biaya tambahan
  adminFee: number;
  platformCommissionPercent: number;
  platformCommissionAmount: number;
  earningsAmount: number;
  status: 'pending' | 'completed' | 'paid_out';
  completedAt: string;
  createdAt: string;
}

// Fetch earnings history
export const fetchEarningsHistory = async () => {
  const response = await api.get<{ data: EarningsRecord[] }>('/earnings');
  return response.data;
};

// Get earnings summary
export const fetchEarningsSummary = async () => {
  const response = await api.get<{ 
    data: {
      totalEarnings: number;
      completedOrders: number;
      platformCommission: number;
      averageEarningsPerOrder: number;
    }
  }>('/earnings/summary');
  return response.data;
};