// src/features/providers/components/ProviderSidebar.tsx

export default function ProviderSidebar() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-xs leading-relaxed">
        <p className="font-bold mb-1">✨ Jaminan Posko</p>
        <p>
          Layanan dari mitra ini dilindungi garansi layanan 7 hari dan asuransi pengerjaan.  Uang Anda aman hingga
          pekerjaan selesai.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-600 text-xs leading-relaxed">
        <p className="font-bold mb-1 text-gray-800">💡 Tips Pemesanan</p>
        <p>
          Pastikan tanggal yang Anda pilih berwarna Hijau (Tersedia).  Tanggal Merah berarti Mitra sedang penuh atau
          libur. 
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-green-800 text-xs leading-relaxed">
        <p className="font-bold mb-1">📞 Butuh Bantuan? </p>
        <p>Hubungi CS Posko jika ada kendala dalam pemesanan.  Kami siap membantu 24/7.</p>
      </div>
    </div>
  );
}