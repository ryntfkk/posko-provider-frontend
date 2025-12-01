// src/features/providers/components/ProviderLoading.tsx

export default function ProviderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-500 animate-pulse">Memuat Profil Mitra... </span>
      </div>
    </div>
  );
}