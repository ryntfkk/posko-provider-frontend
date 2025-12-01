// src/features/providers/components/ProviderStickyBottomCTA.tsx

import Link from 'next/link';
import { Provider } from '../types';
import { ServiceItem } from './types';
import { formatCurrency } from './utils';
import { ArrowRightIcon } from './Icons';

interface ProviderStickyBottomCTAProps {
  provider: Provider;
}

export default function ProviderStickyBottomCTA({ provider }: ProviderStickyBottomCTAProps) {
  const activeServices = (provider.services as ServiceItem[]).filter((s) => s.isActive);
  const minPrice = activeServices.length > 0 ?  Math.min(...activeServices.map((s) => s.price)) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-40 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col flex-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase">Harga Mulai</span>
        <span className="text-lg font-black text-red-600">
          {activeServices.length > 0 ?  formatCurrency(minPrice) : 'Hubungi CS'}
        </span>
      </div>
      <Link
        href={`/checkout?type=direct&providerId=${provider._id}`}
        className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-transform active:scale-95 flex items-center gap-2"
      >
        Pesan Jasa
        <ArrowRightIcon />
      </Link>
    </div>
  );
}