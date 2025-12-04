'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchProfile, logout, registerPartnerWithDocs } from '@/features/auth/api';
import { fetchMyProviderProfile } from '@/features/providers/api';
import { User } from '@/features/auth/types';
import { Provider } from '@/features/providers/types';

// Icons
const UploadIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

export default function BecomePartnerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FORM STATES ===
  
  // 1. Data Personal
  const [nik, setNik] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [domicileAddress, setDomicileAddress] = useState('');

  // 2. Data Profesional
  const [serviceCategory, setServiceCategory] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [description, setDescription] = useState('');

  // 3. Data Bank
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  // 4. Kontak Darurat
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // 5. Files
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    ktp: null,
    selfieKtp: null,
    skck: null,
    certificate: null
  });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetchProfile();
        setUser(res.data.profile);

        // Cek apakah sudah pernah daftar
        try {
          const provRes = await fetchMyProviderProfile();
          if (provRes.data) {
            setProviderData(provRes.data);
          }
        } catch (err) {
          // Ignore if 404
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.ktp || !files.selfieKtp || !files.skck) {
      alert('Mohon lengkapi dokumen wajib (KTP, Selfie KTP, SKCK)');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    
    // Personal
    formData.append('nik', nik);
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('gender', gender);
    formData.append('domicileAddress', domicileAddress);

    // Profesional
    formData.append('serviceCategory', serviceCategory);
    formData.append('experienceYears', experienceYears);
    formData.append('vehicleType', vehicleType);
    formData.append('description', description);

    // Bank
    formData.append('bankName', bankName);
    formData.append('bankAccountNumber', bankAccountNumber);
    formData.append('bankAccountHolder', bankAccountHolder);

    // Emergency
    formData.append('emergencyName', emergencyName);
    formData.append('emergencyRelation', emergencyRelation);
    formData.append('emergencyPhone', emergencyPhone);
    
    // Files
    if (files.ktp) formData.append('ktp', files.ktp);
    if (files.selfieKtp) formData.append('selfieKtp', files.selfieKtp);
    if (files.skck) formData.append('skck', files.skck);
    if (files.certificate) formData.append('certificate', files.certificate);

    try {
      await registerPartnerWithDocs(formData);
      alert('Pendaftaran berhasil dikirim! Silakan tunggu verifikasi admin.');
      window.location.reload(); 
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Gagal mengirim pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  // === VIEW STATUS (Pending/Rejected/Verified) ===
  if (providerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image src="/logo.png" alt="Posko" fill className="object-contain" />
            </div>
            <span className="font-bold text-lg text-gray-900">Posko<span className="text-red-600">.</span></span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 font-medium">Keluar</button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            {providerData.verificationStatus === 'pending' && (
              <>
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">⏳</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Pendaftaran Sedang Ditinjau</h1>
                <p className="text-gray-500">
                  Data Anda sedang diverifikasi oleh tim Admin Posko. Proses ini biasanya memakan waktu <b>1x24 jam</b>.
                  Silakan cek kembali secara berkala.
                </p>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 text-left">
                  <p className="font-bold mb-2">Status Dokumen:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircleIcon /> Data Diri & Bank terkirim</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon /> Identitas (KTP) terupload</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon /> Dokumen SKCK terupload</li>
                  </ul>
                </div>
              </>
            )}

            {providerData.verificationStatus === 'rejected' && (
              <>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">❌</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Pendaftaran Ditolak</h1>
                <p className="text-gray-500 mb-4">Mohon maaf, pendaftaran Anda belum dapat kami setujui.</p>
                {providerData.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-sm mb-6 text-left">
                    <strong>Alasan:</strong> {providerData.rejectionReason}
                  </div>
                )}
                <button 
                  onClick={() => setProviderData(null)} 
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700"
                >
                  Perbaiki Data & Daftar Ulang
                </button>
              </>
            )}

            {providerData.verificationStatus === 'verified' && (
              <>
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Selamat! Akun Terverifikasi</h1>
                <p className="text-gray-500 mb-6">Akun mitra Anda sudah aktif. Silakan login ulang untuk mengakses Dashboard Mitra.</p>
                <button onClick={handleLogout} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800">
                  Login ke Dashboard
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // === VIEW FORM REGISTRASI ===
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative">
            <Image src="/logo.png" alt="Posko" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg text-gray-900">Posko<span className="text-red-600">.</span></span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 font-medium">Keluar</button>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">Formulir Pendaftaran Mitra</h1>
            <p className="text-gray-500">Lengkapi seluruh data di bawah ini untuk proses verifikasi dan pencairan dana.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* SECTION 1: DATA PRIBADI */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">1. Data Pribadi (Sesuai KTP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor Induk Kependudukan (NIK)</label>
                  <input 
                    type="text" value={nik} onChange={(e) => setNik(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="16 Digit NIK" required maxLength={16}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Lahir</label>
                  <input 
                    type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Kelamin</label>
                  <select 
                    value={gender} onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alamat Domisili Sekarang</label>
                  <input 
                    type="text" value={domicileAddress} onChange={(e) => setDomicileAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="Alamat tempat tinggal saat ini" required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: DATA KEAHLIAN */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">2. Data Keahlian & Jasa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kategori Layanan Utama</label>
                  <select 
                    value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="AC Service">Service AC</option>
                    <option value="Cleaning">Cleaning Service</option>
                    <option value="Massage">Massage/Pijat</option>
                    <option value="Plumbing">Plumbing/Pipa</option>
                    <option value="Electronic">Elektronik</option>
                    <option value="Automotive">Otomotif</option>
                    <option value="Others">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pengalaman (Tahun)</label>
                  <input 
                    type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="Contoh: 5" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi Keahlian</label>
                <textarea 
                  rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none resize-none"
                  placeholder="Ceritakan keahlian Anda..." required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Kendaraan (Opsional)</label>
                <input 
                  type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                  placeholder="Contoh: Motor Matic (B 1234 CD)"
                />
              </div>
            </div>

            {/* SECTION 3: REKENING BANK */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">3. Rekening Bank (Untuk Pencairan Dana)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Bank</label>
                  <select 
                    value={bankName} onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    required
                  >
                    <option value="">Pilih Bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="CIMB">CIMB Niaga</option>
                    <option value="Jago">Bank Jago</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor Rekening</label>
                  <input 
                    type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="Contoh: 1234567890" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Atas Nama</label>
                  <input 
                    type="text" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="Nama di buku tabungan" required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: KONTAK DARURAT */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">4. Kontak Darurat</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Kerabat</label>
                  <input 
                    type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hubungan</label>
                  <input 
                    type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    placeholder="Contoh: Istri / Kakak" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor HP</label>
                  <input 
                    type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: UPLOAD DOKUMEN */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">5. Dokumen Verifikasi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KTP */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'ktp')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  <div className="flex flex-col items-center">
                    {files.ktp ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-full">{files.ktp.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Foto KTP (Wajib)</span>
                        <span className="text-[10px] text-gray-400">Jelas terbaca</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SELFIE KTP */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'selfieKtp')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  <div className="flex flex-col items-center">
                    {files.selfieKtp ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-full">{files.selfieKtp.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Selfie dengan KTP (Wajib)</span>
                        <span className="text-[10px] text-gray-400">Wajah & KTP terlihat jelas</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SKCK */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'skck')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  <div className="flex flex-col items-center">
                    {files.skck ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-full">{files.skck.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Scan SKCK Aktif (Wajib)</span>
                        <span className="text-[10px] text-gray-400">Image atau PDF</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SERTIFIKAT */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'certificate')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center">
                    {files.certificate ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-full">{files.certificate.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Sertifikat (Opsional)</span>
                        <span className="text-[10px] text-gray-400">Pendukung verifikasi</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-8"
            >
              {isSubmitting ? 'Mengirim Data...' : 'Kirim Pendaftaran Lengkap'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}