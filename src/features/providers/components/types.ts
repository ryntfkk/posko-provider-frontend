// src/features/providers/components/types. ts

export interface ServiceItem {
  serviceId: {
    _id: string;
    name: string;
    category: string;
    iconUrl?: string;
    unit?: string;
    unitLabel?: string;
    displayUnit?: string;
    shortDescription?: string;
    description?: string;
    estimatedDuration?: number;
    includes?: string[];
    excludes?: string[];
    requirements?: string[];
    isPromo?: boolean;
    promoPrice?: number;
    discountPercent?: number;
    basePrice?: number;
  };
  price: number;
  isActive: boolean;
}

export type TabType = 'services' | 'documentation';