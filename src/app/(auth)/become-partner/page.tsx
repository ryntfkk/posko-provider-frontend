'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchProfile, logout, registerPartnerWithDocs } from '@/features/auth/api';
import { fetchMyProviderProfile } from '@/features/providers/api';
import { fetchServices } from '@/features/services/api'; // [BARU]
import { User } from '@/features/auth/types';
import { Provider } from '@/features/providers/types';
import { Service } from '@/features/services/types'; // [BARU]

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

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

// Tipe data untuk layanan yang dipilih user
interface SelectedServiceItem {
  serviceId: string;
  name: string; // untuk display saja
  price: number;
  description: string;
}

export default function BecomePartnerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === WIZARD STATE ===
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // === FORM STATES ===
  
  // 1. Data Personal
  const [nik, setNik] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [domicileAddress, setDomicileAddress] = useState('');

  // 2. Data Profesional & Layanan
  const [serviceCategory, setServiceCategory] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [description, setDescription] = useState('');
  
  // [BARU] State untuk Layanan
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // 3. Data Bank & Kontak Darurat
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // 4. Files
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

  // [BARU] Fetch Services saat Category berubah
  useEffect(() => {
    if (!serviceCategory) {
      setAvailableServices([]);
      return;
    }

    const loadServices = async () => {
      setIsLoadingServices(true);
      try {
        // Panggil API fetchServices dengan parameter category
        const res = await fetchServices(serviceCategory);
        setAvailableServices(res.data);
        
        // Reset selection jika kategori berubah
        setSelectedServices([]); 
      } catch (error) {
        console.error('Failed to fetch services', error);
        setAvailableServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    loadServices();
  }, [serviceCategory]);

  const handleServiceToggle = (service: Service) => {
    const exists = selectedServices.find(s => s.serviceId === service._id);
    
    if (exists) {
      // Remove
      setSelectedServices(prev => prev.filter(s => s.serviceId !== service._id));
    } else {
      // Add
      setSelectedServices(prev => [
        ...prev,
        {
          serviceId: service._id,
          name: service.name,
          price: service.basePrice, // Default price dari master data
          description: ''
        }
      ]);
    }
  };

  const handlePriceChange = (id: string, newPrice: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceId === id ? { ...s, price: Number(newPrice) } : s
    ));
  };

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

    if (selectedServices.length === 0) {
      alert('Mohon pilih minimal satu layanan yang Anda tawarkan.');
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
    
    // [BARU] Kirim Selected Services sebagai JSON string
    formData.append('selectedServices', JSON.stringify(selectedServices));

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

  // Navigasi Stepper
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validasi Langkah
  const isStep1Valid = nik && dateOfBirth && domicileAddress;
  const isStep2Valid = serviceCategory && experienceYears && description && selectedServices.length > 0;
  const isStep3Valid = bankName && bankAccountNumber && emergencyName && emergencyPhone;
  const isStep4Valid = files.ktp && files.selfieKtp && files.skck;

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

  // === VIEW FORM REGISTRASI WIZARD ===
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
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 min-h-[600px] flex flex-col">
          
          {/* Header & Stepper */}
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">Formulir Pendaftaran Mitra</h1>
            
            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mt-6 max-w-lg">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-red-600' : 'bg-gray-100'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-500">
              Langkah {step} dari 4: {
                step === 1 ? 'Data Pribadi' : 
                step === 2 ? 'Keahlian & Layanan' : 
                step === 3 ? 'Bank & Kontak' : 'Upload Dokumen'
              }
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
            
            {/* STEP 1: DATA PRIBADI */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">1. Data Pribadi (Sesuai KTP)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIK KTP</label>
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
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alamat Domisili Sekarang</label>
                    <input 
                      type="text" value={domicileAddress} onChange={(e) => setDomicileAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DATA KEAHLIAN */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">2. Data Keahlian & Jasa</h3>
                
                {/* Kategori & Pengalaman */}
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi Diri / Bio Singkat</label>
                  <textarea 
                    rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none resize-none"
                    placeholder="Saya ahli perbaikan AC dengan pengalaman 5 tahun..." required
                  />
                </div>

                {/* [BARU] SELECTION SERVICES */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                    Pilih Layanan yang Anda Tawarkan ({selectedServices.length} dipilih)
                  </label>
                  
                  {!serviceCategory && (
                    <div className="p-4 bg-gray-50 text-gray-400 text-sm rounded-xl text-center">
                      Silakan pilih Kategori Layanan terlebih dahulu.
                    </div>
                  )}

                  {serviceCategory && isLoadingServices && (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                      <span className="text-xs text-gray-400 mt-2 block">Memuat daftar layanan...</span>
                    </div>
                  )}

                  {serviceCategory && !isLoadingServices && availableServices.length === 0 && (
                    <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-xl">
                      Belum ada layanan tersedia untuk kategori ini. Hubungi admin.
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {availableServices.map((service) => {
                      const isSelected = selectedServices.some(s => s.serviceId === service._id);
                      const selectedData = selectedServices.find(s => s.serviceId === service._id);

                      return (
                        <div key={service._id} className={`border rounded-xl p-3 transition-all ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleServiceToggle(service)}
                              className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {service.name}
                                </span>
                                {isSelected && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">Rp</span>
                                    <input 
                                      type="number" 
                                      value={selectedData?.price}
                                      onChange={(e) => handlePriceChange(service._id, e.target.value)}
                                      className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:border-red-500 outline-none bg-white"
                                    />
                                  </div>
                                )}
                                {!isSelected && (
                                  <span className="text-xs text-gray-400">
                                    Mulai Rp {service.basePrice.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-1">{service.description || 'Tidak ada deskripsi'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedServices.length === 0 && serviceCategory && !isLoadingServices && availableServices.length > 0 && (
                    <p className="text-xs text-red-500 mt-2 font-medium">* Wajib pilih minimal satu layanan</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: BANK & KONTAK */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">3. Data Bank & Kontak Darurat</h3>
                
                {/* Bank */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                  <h4 className="font-bold text-sm text-gray-700">Rekening Pencairan Dana</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Bank</label>
                      <select 
                        value={bankName} onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:border-red-500 outline-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:border-red-500 outline-none"
                        placeholder="1234567890" required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Atas Nama (Sesuai Buku Tabungan)</label>
                      <input 
                        type="text" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:border-red-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-700">Kontak Darurat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Kerabat</label>
                      <input 
                        type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
                        required
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
              </div>
            )}

            {/* STEP 4: DOCUMENTS */}
            {step === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-l-4 border-red-600 pl-3">4. Upload Dokumen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* KTP */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative h-40 flex flex-col items-center justify-center">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'ktp')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                    {files.ktp ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-[90%]">{files.ktp.name}</span>
                        <span className="text-[10px] text-gray-400">Klik untuk ganti</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Foto KTP (Wajib)</span>
                      </>
                    )}
                  </div>

                  {/* SELFIE */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative h-40 flex flex-col items-center justify-center">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'selfieKtp')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                    {files.selfieKtp ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-[90%]">{files.selfieKtp.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Selfie + KTP (Wajib)</span>
                      </>
                    )}
                  </div>

                  {/* SKCK */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative h-40 flex flex-col items-center justify-center">
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'skck')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                    {files.skck ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-[90%]">{files.skck.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">SKCK Aktif (Wajib)</span>
                      </>
                    )}
                  </div>

                   {/* Sertifikat */}
                   <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative h-40 flex flex-col items-center justify-center">
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'certificate')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {files.certificate ? (
                      <>
                        <CheckCircleIcon />
                        <span className="text-xs font-bold text-green-600 mt-2 truncate max-w-[90%]">{files.certificate.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span className="text-xs font-bold text-gray-500 mt-2">Sertifikat (Opsional)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex justify-between items-center pt-6 mt-auto border-t border-gray-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeftIcon /> Kembali
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid) ||
                    (step === 3 && !isStep3Valid)
                  }
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lanjut <ChevronRightIcon />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !isStep4Valid}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
              )}
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}