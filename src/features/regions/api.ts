import api from '@/lib/axios';

// Definisi tipe data wilayah
export interface Region {
  id: string;
  name: string;
  type: 'province' | 'regency' | 'district' | 'village';
  parentId?: string | null;
}

export interface RegionResponse {
  success: boolean;
  data: Region[];
}

/**
 * Mengambil daftar semua provinsi
 * Endpoint: GET /regions/provinces
 */
export const fetchProvinces = async (): Promise<RegionResponse> => {
  const response = await api.get('/regions/provinces');
  return response.data;
};

/**
 * Mengambil daftar wilayah anak berdasarkan parentId
 * Endpoint: GET /regions/children/:parentId
 */
export const fetchRegionChildren = async (parentId: string): Promise<RegionResponse> => {
  const response = await api.get(`/regions/children/${parentId}`);
  return response.data;
};