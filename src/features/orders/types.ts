// src/features/orders/types.ts
import { Address } from "../auth/types";

// ============ ORDER ITEM PAYLOAD ============
export interface OrderItemPayload {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// ============ [BARU] CUSTOMER CONTACT (CRITICAL) ============
export interface CustomerContact {
  name: string;          // Nama penerima (bisa beda dengan user)
  phone: string;         // Nomor HP utama
  alternatePhone?: string; // Nomor cadangan
}

// ============ [BARU] PROPERTY DETAILS (MEDIUM) ============
export interface PropertyDetails {
  type: 'rumah' | 'apartemen' | 'kantor' | 'ruko' | 'kendaraan' | 'lainnya' | '';
  floor?: number | null;     // Lantai berapa (apartemen/gedung)
  hasParking: boolean;       // Ada tempat parkir? 
  hasElevator: boolean;      // Ada lift?
  accessNote?: string;       // Catatan akses khusus
}

// ============ [BARU] SCHEDULED TIME SLOT (MEDIUM) ============
export interface ScheduledTimeSlot {
  preferredStart: string;  // "09:00"
  preferredEnd: string;    // "12:00"
  isFlexible: boolean;     // Boleh datang di luar slot? 
}

// ============ [BARU] ATTACHMENT (HIGH) ============
export interface Attachment {
  url: string;
  type: 'photo' | 'video';
  description?: string;
  uploadedAt?: string;
}

// ============ CREATE ORDER PAYLOAD (UPDATED) ============
export interface CreateOrderPayload {
  orderType: 'direct' | 'basic';
  providerId?: string | null;
  totalAmount: number;
  items: OrderItemPayload[];
  scheduledAt: string;
  shippingAddress: Address; 
  location: { 
    type: 'Point', 
    coordinates: number[];
  };
  // [BARU] Field tambahan
  customerContact: CustomerContact;
  orderNote?: string;
  propertyDetails?: PropertyDetails;
  scheduledTimeSlot?: ScheduledTimeSlot;
  attachments?: Attachment[];
}

// ============ POPULATED ORDER ITEM ============
export interface PopulatedOrderItem {
  serviceId: {
    _id: string;
    name: string;
    iconUrl?: string;
    category?: string;
  } | null;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// ============ POPULATED PROVIDER ============
export interface PopulatedProvider {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
  };
  rating?: number;
  isOnline?: boolean;
}

// ============ POPULATED USER ============
export interface PopulatedUser {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

// ============ ORDER STATUS ============
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'searching' 
  | 'accepted' 
  | 'on_the_way' 
  | 'working' 
  | 'waiting_approval' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

// ============ ORDER INTERFACE (FULL) ============
export interface Order {
  _id: string;
  orderNumber: string; // [BARU] Human-readable order number
  userId: string | PopulatedUser;
  providerId?: string | PopulatedProvider | null;
  items: PopulatedOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderType: 'direct' | 'basic';
  scheduledAt?: string;
  
  // Address & Location
  shippingAddress?: Address;
  location?: {
    type: 'Point';
    coordinates: number[];
  };
  
  // [BARU] Field tambahan
  customerContact?: CustomerContact;
  orderNote?: string;
  propertyDetails?: PropertyDetails;
  scheduledTimeSlot?: ScheduledTimeSlot;
  attachments?: Attachment[];
  
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  messageKey: string;
  message: string;
  data: Order;
}

export interface OrderListResponse {
  messageKey?: string;
  message?: string;
  data: Order[];
}