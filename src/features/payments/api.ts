import api from '@/lib/axios';

export const createPayment = async (orderId: string) => {
  // Panggil endpoint backend yang baru kita update tadi
  const response = await api.post('/payments', { orderId });
  return response.data;
};