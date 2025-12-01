// src/features/providers/types.ts

export type ServiceUnit = 'unit' | 'jam' | 'meter' | 'kg' | 'paket' | 'orang' | 'kendaraan' | 'sesi';

export interface ProviderServiceDetail {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
  description?: string;
  shortDescription?: string;
  unit?: ServiceUnit;
  unitLabel?: string;
  displayUnit?: string;
  estimatedDuration?: number;
  includes?: string[];
  excludes?: string[];
  requirements?: string[];
  isPromo?: boolean;
  promoPrice?: number;
  discountPercent?: number;
}

export interface ProviderServiceItem {
  _id: string;
  serviceId: ProviderServiceDetail;
  price: number;
  isActive: boolean;
}

export interface ProviderUser {
  _id: string;
  fullName: string;
  profilePictureUrl: string;
  bio: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    district?: string;
    province?: string;
    detail?: string;
    postalCode?: string;
  };
  location?: {
    type?: string;
    coordinates: number[];
  };
}

export interface ScheduleItem {
  dayIndex: number;
  dayName: string;
  isOpen: boolean;
  start: string;
  end: string;
}

export interface Provider {
  _id: string;
  userId: ProviderUser;
  services: ProviderServiceItem[];
  rating: number;
  isOnline: boolean;
  createdAt: string;

  // Sistem Kalender
  blockedDates: string[];
  bookedDates?: string[];

  // Portfolio/Dokumentasi
  portfolioImages?: string[];

  // Statistik
  totalCompletedOrders?: number;

  // Jadwal Operasional
  schedule?: ScheduleItem[];

  // Jarak dari user (dihitung oleh backend)
  distance?: number;
}

export interface ProviderListResponse {
  messageKey: string;
  message: string;
  data: Provider[];
}