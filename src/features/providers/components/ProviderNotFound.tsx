// src/features/providers/components/ProviderNotFound.tsx

import Link from 'next/link';
import { CloseIcon } from './Icons';

export default function ProviderNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
        <CloseIcon />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Mitra Tidak Ditemukan</h2>
      <p className="text-sm text-gray-500">Mitra yang Anda cari tidak tersedia atau sudah tidak aktif. </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}