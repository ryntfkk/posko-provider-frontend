import api from '@/lib/axios';
import { CreateOrderPayload, Order } from './types';

// Buat Pesanan Baru
export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post<{ message: string; data: Order }>('/orders', payload);
  return response.data;
};

export const fetchMyOrders = async (view: 'customer' | 'provider' = 'customer') => {
  const response = await api.get<{ data: Order[] }>('/orders', {
    params: { view } 
  }); 
  return response.data;
};

// Ambil Pesanan Masuk (Untuk Provider) - Jika backend belum ada route ini, 
// pastikan Anda menambahkannya di backend atau gunakan filter di endpoint utama.
export const fetchIncomingOrders = async () => {
  const response = await api.get<{ data: Order[] }>('/orders/incoming');
  return response.data;
};

// [TAMBAHAN] Update progres kerja provider
export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.patch<{ message: string; data: Order }>(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Ambil Detail Pesanan
export const fetchOrderById = async (orderId: string) => {
  const response = await api.get<{ data: Order }>(`/orders/${orderId}`);
  return response.data;
};
export const acceptOrder = async (orderId: string) => {
  const response = await api.patch<{ message: string; data: Order }>(`/orders/${orderId}/accept`, {});
  return response.data;
};

