// src/features/providers/api.ts
import api from '@/lib/axios';
// PERBAIKAN: Import UpdateProviderProfilePayload dari types.ts agar sinkron
import { ProviderListResponse, Provider, UpdateProviderProfilePayload } from './types';

// Interface untuk parameter query
export interface FetchProvidersParams {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
  limit?: number;
  page?: number;
}

export const fetchProviders = async (params: FetchProvidersParams) => {
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};

// Get My Provider Profile (Untuk Dashboard)
export const fetchMyProviderProfile = async () => {
  const response = await api.get<{ data: Provider }>('/providers/me');
  return response.data;
};

// Update Ketersediaan (Blocked Dates)
export const updateAvailability = async (blockedDates: string[]) => {
  const response = await api.put<{ message: string; data: string[] }>('/providers/availability', { blockedDates });
  return response.data;
};

// Update Portfolio Images
export const updatePortfolio = async (portfolioImages: string[]) => {
  const response = await api.put<{ message: string; data: Provider }>('/providers/portfolio', { portfolioImages });
  return response.data;
};

// Update Provider Services
export const updateProviderServices = async (services: Array<{ serviceId: string; price: number; isActive: boolean }>) => {
  const response = await api.put<{ message: string; data: Provider }>('/providers/services', { services });
  return response.data;
};

// Toggle Online/Offline Status
export const toggleOnlineStatus = async (isOnline: boolean) => {
  const response = await api.put<{ message: string; data: { isOnline: boolean } }>('/providers/online-status', { isOnline });
  return response.data;
};

// [PERBAIKAN] Interface lokal dihapus karena sudah di-import dari ./types
// Fungsi sekarang menggunakan tipe data yang benar dan lengkap
export const updateProviderProfile = async (payload: UpdateProviderProfilePayload) => {
  const response = await api.put<{ message: string; data: Provider }>('/providers/profile', payload);
  return response.data;
};