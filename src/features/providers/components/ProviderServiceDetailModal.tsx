// src/features/providers/components/ProviderServiceDetailModal.tsx

import Link from 'next/link';
import { Provider } from '../types';
import { ServiceItem } from './types';
import { formatCurrency, formatDuration } from './utils';
import { CloseIcon, ClockIcon, CheckIcon, XIcon } from './Icons';
import { getUnitLabel } from '@/features/services/types';

interface ProviderServiceDetailModalProps {
  provider: Provider;
  selectedService: ServiceItem | null;
  onClose: () => void;
}

export default function ProviderServiceDetailModal({
  provider,
  selectedService,
  onClose,
}: ProviderServiceDetailModalProps) {
  if (!selectedService) return null;

  const service = selectedService.serviceId;
  const unitDisplay = service.displayUnit || service.unitLabel || getUnitLabel((service.unit as any) || 'unit');
  const durationText = formatDuration(service.estimatedDuration);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                {service.category}
              </span>
              {service.isPromo && service.discountPercent && service.discountPercent > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                  DISKON {service.discountPercent}%
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 shrink-0">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[55vh]">
          {/* Harga & Info */}
          <div className="flex items-end justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 mb-1">Harga Mitra</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-red-600">{formatCurrency(selectedService.price)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{unitDisplay}</p>
            </div>
            {durationText && (
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Estimasi</p>
                <div className="flex items-center gap-1 justify-end">
                  <ClockIcon />
                  <p className="text-sm font-bold text-gray-900">{durationText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Deskripsi */}
          {service.description && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
              <p className="text-sm text-gray-700 leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Includes */}
          {service.includes && service.includes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-600 uppercase mb-2">✓ Termasuk dalam layanan</p>
              <ul className="space-y-2 bg-green-50 p-3 rounded-xl">
                {service.includes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Excludes */}
          {service.excludes && service.excludes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-500 uppercase mb-2">✗ Tidak termasuk</p>
              <ul className="space-y-2 bg-red-50 p-3 rounded-xl">
                {service.excludes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <XIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">📋 Syarat & Persiapan</p>
              <ul className="space-y-2 bg-blue-50 p-3 rounded-xl">
                {service.requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors"
          >
            Tutup
          </button>
          <Link
            href={`/checkout?type=direct&providerId=${provider._id}&serviceId=${service._id}`}
            className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors text-center"
            onClick={onClose}
          >
            Pesan Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}