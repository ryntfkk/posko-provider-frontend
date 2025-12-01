// src/features/providers/components/ProviderImageLightbox.tsx

import Image from 'next/image';
import { CloseIcon } from './Icons';

interface ProviderImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ProviderImageLightbox({ imageUrl, onClose }: ProviderImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      <div className="relative w-full max-w-4xl max-h-[90vh] aspect-auto">
        <Image src={imageUrl} alt="Portfolio Detail" fill className="object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}