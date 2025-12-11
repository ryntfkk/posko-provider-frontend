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

// Tolak order (Basic: Sembunyikan, Direct: Cancel)
export const rejectOrder = async (orderId: string) => {
  const response = await api.patch<{ message: string }>(`/orders/${orderId}/reject`, {});
  return response.data;
};

// Fetch incoming orders (Pesanan Masuk)
export const fetchIncomingOrders = async () => {
  const response = await api.get<{ data: Order[] }>('/orders/incoming');
  return response.data;
};

// Upload Bukti Penyelesaian Pekerjaan
export const uploadCompletionEvidence = async (orderId: string, file: File, description?: string) => {
  const formData = new FormData();
  formData.append('image', file); // Field name harus 'image' sesuai config Multer di backend
  if (description) {
    formData.append('description', description);
  }

  const response = await api.post<{ message: string; data: Order }>(
    `/orders/${orderId}/completion-evidence`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Request Biaya Tambahan
export const requestAdditionalFee = async (orderId: string, description: string, amount: number) => {
  const response = await api.post<{ message: string; data: Order }>(
    `/orders/${orderId}/additional-fee`,
    { description, amount }
  );
  return response.data;
};

// [BARU] Void/Batalkan Biaya Tambahan
export const voidAdditionalFee = async (orderId: string, feeId: string) => {
  const response = await api.delete<{ message