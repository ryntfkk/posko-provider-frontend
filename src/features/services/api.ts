import api from '@/lib/axios';
import { ServiceResponse } from './types';

// [UPDATE] Tambahkan parameter optional category
export const fetchServices = async (category?: string | null) => {
  // Kirim parameter 'category' ke backend
  const response = await api.get<ServiceResponse>('/services', {
    params: { category }
  });
  return response.data;
};