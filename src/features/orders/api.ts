import api from '@/lib/axios';
import { Order } from './types';

// Ambil Pesanan Saya (Provider View)
export const fetchMyOrders = async (view: 'customer' | 'provider' = 'provider') => {
  const response = await api.get<{ data: Order[] }>('/orders', {
    params: { view } 
  }); 
  return response.data;
};

// Ambil Detail Pesanan
export const fetchOrderById = async (orderId: string) => {
  const response = await api.get<{ data: Order }>(`/orders/${orderId}`);
  return response.data;
};

// Update status order (Terima, Jalan, Kerja, Selesai)
export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.patch<{ message: string; data: Order }>(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Terima order (khusus status pending/searching -> accepted)
export const acceptOrder = async (orderId: string) => {
  const response = await api.patch<{ message: string; data: Order }>(`/orders/${orderId}/accept`, {});
  return response.data;
};

// Fetch incoming orders (Pesanan Masuk)
export const fetchIncomingOrders = async () => {
  const response = await api.get<{ data: Order[] }>('/orders/incoming');
  return response.data;
};