export type ServiceUnit = 'unit' | 'jam' | 'hari' | 'meter' | 'kg' | 'paket' | 'orang' | 'ruangan' | 'kendaraan' | 'sesi';

export interface Service {
  _id: string;
  name: string;
  slug?: string;
  category: string;
  shortDescription?: string;
  description: string;
  
  // Harga & Satuan
  basePrice: number;
  maxPrice?: number;
  unit: ServiceUnit;
  unitLabel?: string;
  displayUnit?: string;      // Virtual dari backend
  priceDisplay?: string;     // Virtual dari backend
  displayPrice?: number;     // Virtual dari backend
  priceNote?: string;
  
  // Promo
  isPromo?: boolean;
  promoPrice?: number;
  promoEndDate?: string;
  promoLabel?: string;
  discountPercent?: number;  // Virtual
  
  // Durasi & Kuantitas
  estimatedDuration?: number;
  durationDisplay?: string;  // Virtual
  minQuantity?: number;
  maxQuantity?: number;
  
  // Detail Layanan
  includes?: string[];
  excludes?: string[];
  requirements?: string[];
  
  // Media
  iconUrl: string;
  thumbnailUrl?: string;
  images?: string[];
  
  // Statistik
  totalOrders?: number;
  averageRating?: number;
  reviewCount?: number;
  
  // Config
  isFeatured?: boolean;
  isActive: boolean;
}

export interface ServiceResponse {
  message: string;
  data: Service[];
}

// Helper functions
export function getUnitLabel(unit: ServiceUnit, customLabel?: string): string {
  if (customLabel) return customLabel;
  
  const labels: Record<ServiceUnit, string> = {
    'unit': 'per unit',
    'jam': 'per jam',
    'hari': 'per hari',
    'meter': 'per meter',
    'kg': 'per kg',
    'paket': 'per paket',
    'orang': 'per orang',
    'ruangan': 'per ruangan',
    'kendaraan': 'per kendaraan',
    'sesi': 'per sesi'
  };
  
  return labels[unit] || 'per unit';
}

export function getQuantityLabel(unit: ServiceUnit): string {
  const labels: Record<ServiceUnit, string> = {
    'unit': 'Unit',
    'jam': 'Jam',
    'hari': 'Hari',
    'meter': 'Meter',
    'kg': 'Kg',
    'paket': 'Paket',
    'orang': 'Orang',
    'ruangan': 'Ruangan',
    'kendaraan': 'Kendaraan',
    'sesi': 'Sesi'
  };
  
  return labels[unit] || 'Unit';
}