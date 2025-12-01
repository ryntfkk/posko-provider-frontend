// src/features/providers/components/ProviderDocumentationContent.tsx

import Image from 'next/image';
import { Provider } from '../types';
import { FALLBACK_PORTFOLIO_IMAGES } from './utils';
import { GalleryIcon, ZoomIcon } from './Icons';

interface ProviderDocumentationContentProps {
  provider: Provider;
  onImageClick: (imageUrl: string) => void;
}

export default function ProviderDocumentationContent({ provider, onImageClick }: ProviderDocumentationContentProps) {
  // Gunakan data asli jika ada, fallback ke dummy jika kosong
  const portfolioImages =
    provider.portfolioImages && provider.portfolioImages.length > 0
      ? provider.portfolioImages
      : FALLBACK_PORTFOLIO_IMAGES;

  const isUsingFallback = !provider.portfolioImages || provider.portfolioImages.length === 0;

  return (
    <div className="space-y-4">
      {isUsingFallback && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
          <p className="font-medium">📸 Dokumentasi Contoh</p>
          <p className="text-yellow-600">Mitra ini belum mengunggah dokumentasi hasil kerja.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {portfolioImages.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg transition-all"
            onClick={() => onImageClick(img)}
          >
            <Image
              src={img}
              alt={`Portfolio ${idx + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIcon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {portfolioImages.length === 0 && ! isUsingFallback && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GalleryIcon />
          </div>
          <p className="text-gray-500 text-sm">Belum ada dokumentasi. </p>
        </div>
      )}
    </div>
  );
}