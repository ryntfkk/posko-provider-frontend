// src/features/providers/components/ProviderServicesContent.tsx

import Link from 'next/link';
import { Provider } from '../types';
import { ServiceItem } from './types';
import { formatCurrency, formatDuration } from './utils';
import { ClockIcon, CheckIcon, ServiceIcon } from './Icons';
import { getUnitLabel } from '@/features/services/types';

interface ProviderServicesContentProps {
  provider: Provider;
  onSelectService: (service: ServiceItem) => void;
}

export default function ProviderServicesContent({ provider, onSelectService }: ProviderServicesContentProps) {
  const activeServices = (provider.services as ServiceItem[]).filter((s) => s.isActive);

  if (activeServices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ServiceIcon />
        </div>
        <p className="text-gray-500 text-sm">Mitra ini belum memiliki layanan aktif.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {activeServices.map((item) => {
        const service = item.serviceId;
        const unitDisplay = service.displayUnit || service.unitLabel || getUnitLabel((service.unit as any) || 'unit');
        const durationText = formatDuration(service.estimatedDuration);
        const hasDetails =
          (service.includes && service.includes.length > 0) ||
          (service.excludes && service.excludes.length > 0) ||
          (service.requirements && service.requirements.length > 0);

        return (
          <div
            key={service._id}
            className="relative flex flex-col p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-red-200 hover:shadow-md transition-all group"
          >
            {/* Badge Promo */}
            {service.isPromo && service.discountPercent && service.discountPercent > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md z-10">
                -{service.discountPercent}%
              </div>
            )}

            {/* Header: Icon + Name */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                <img src={service.iconUrl || '/file.svg'} alt="Icon" className="w-7 h-7 object-contain opacity-70" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors leading-tight">
                  {service.name}
                </h4>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">{service.category}</p>
              </div>
            </div>

            {/* Short Description */}
            {service.shortDescription && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{service.shortDescription}</p>
            )}

            {/* Info Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {durationText && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  <ClockIcon />
                  <span>{durationText}</span>
                </div>
              )}
              {service.includes && service.includes.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckIcon />
                  <span>{service.includes.length} termasuk</span>
                </div>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-50">
              <div>
                <p className="font-black text-gray-900 text-lg leading-none">{formatCurrency(item.price)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{unitDisplay}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasDetails && (
                  <button
                    onClick={() => onSelectService(item)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Detail
                  </button>
                )}
                <Link
                  href={`/checkout?type=direct&providerId=${provider._id}`}
                  className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Pilih
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}