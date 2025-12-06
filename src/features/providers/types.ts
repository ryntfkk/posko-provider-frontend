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

// [BARU] Interface Data Provider Lengkap
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

  // [BARU] Lokasi Operasional (Provider Specific)
  location?: {
    type: string;
    coordinates: number[]; // [lng, lat]
    address?: string;
  };

  // [BARU] Jam Kerja
  workingHours?: {
    start: string;
    end: string;
  };

  // Jadwal Operasional (Legacy/Opsional jika masih dipakai di tempat lain)
  schedule?: ScheduleItem[];

  // Jarak dari user (dihitung oleh backend)
  distance?: number;

  // Status Verifikasi & Data Lengkap
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  documents?: {
    ktpUrl: string;
    selfieKtpUrl: string;
    skckUrl: string;
    certificateUrl?: string;
  };
  
  // [BARU] Data Personal Lengkap
  personalInfo?: {
    nik: string;
    dateOfBirth: string;
    gender: 'Laki-laki' | 'Perempuan';
  };
  domicileAddress?: string;

  // [BARU] Data Bank
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };

  // [BARU] Kontak Darurat
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };

  // Detail Jasa
  details?: {
    experienceYears: number;
    description: string;
    serviceCategory: string;
    vehicleType?: string;
  };
  
  rejectionReason?: string;
}

export interface ProviderListResponse {
  messageKey: string;
  message: string;
  data: Provider[];
}