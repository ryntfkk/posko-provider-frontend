// src/features/providers/components/ProviderHeroSection.tsx

import Image from 'next/image';
import { Provider } from '../types';
import { ShareIcon, HeartIcon, CalendarIcon } from './Icons';

interface ProviderHeroSectionProps {
  provider: Provider;
  distance: string;
  isFavorited: boolean;
  isSharing: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onOpenCalendar: () => void;
}

export default function ProviderHeroSection({
  provider,
  distance,
  isFavorited,
  isSharing,
  onToggleFavorite,
  onShare,
  onOpenCalendar,
}: ProviderHeroSectionProps) {
  const totalOrders = provider.totalCompletedOrders ?? 0;
  
  // Asumsi: Pastikan tipe data 'Provider' Anda memiliki properti 'totalFavorites'
  // Jika nama di database berbeda (misal: favoritesCount), silakan sesuaikan di sini.
  const totalFavorites = (provider as any).totalFavorites ?? 0; 

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-red-50 to-transparent rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        {/* Profile Picture */}
        <div className="flex justify-center md:justify-start shrink-0">
          <div className="relative w-28 h-28 lg:w-36 lg:h-36">
            {/* Class rounded-full & overflow-hidden memastikan foto benar-benar bulat */}
            <div className="w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative">
              <Image
                src={
                  provider.userId?.profilePictureUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'default'}`
                }
                alt={provider.userId?.fullName || 'Mitra'}
                fill
                className="object-cover"
              />
            </div>
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 border-4 border-white rounded-full ${provider.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
              title={provider.isOnline ? 'Online' : 'Offline'}
            ></div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight flex flex-col md:flex-row items-center md:items-end gap-2 justify-center md:justify-start">
              {provider.userId?.fullName || 'Nama Tidak Tersedia'}
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full align-middle border border-blue-200">
                Terverifikasi ✓
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {provider.userId?.address?.city || 'Lokasi tidak tersedia'} • {distance}
            </p>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto md:mx-0 bg-gray-50 p-3 rounded-xl border border-gray-100">
            &quot;{provider.userId?.bio || 'Teknisi berpengalaman yang siap membantu masalah Anda dengan cepat dan profesional.'}&quot;
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            {/* Stats Block */}
            <div className="flex items-center gap-4 divide-x divide-gray-200 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm w-full sm:w-auto justify-center sm:justify-start">
              
              {/* Rating */}
              <div className="flex items-center gap-1.5 pr-2">
                <span className="text-yellow-500 text-lg">★</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-gray-900 leading-none">
                    {(provider.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Rating</span>
                </div>
              </div>

              {/* Pesanan */}
              <div className="flex flex-col items-start pl-4">
                <span className="text-sm font-black text-gray-900 leading-none">
                  {totalOrders > 0 ? (totalOrders > 99 ? '99+' : totalOrders) : '0'}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">Pesanan</span>
              </div>

              {/* BARU: Jumlah Favorit */}
              <div className="flex flex-col items-start pl-4">
                <span className="text-sm font-black text-gray-900 leading-none">
                  {totalFavorites > 0 ? (totalFavorites > 999 ? '999+' : totalFavorites) : '0'}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">Favorit</span>
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={onOpenCalendar}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <CalendarIcon />
                <span className="text-xs font-bold">Lihat Jadwal</span>
              </button>

              <button
                onClick={onToggleFavorite}
                className={`flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${isFavorited ? 'bg-red-50 border-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <HeartIcon solid={isFavorited} />
              </button>

              <button
                onClick={onShare}
                className={`flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isSharing ? 'scale-95' : ''}`}
              >
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}