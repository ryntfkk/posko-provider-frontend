// src/components/settings/ProfileSettings.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { fetchProfile } from '@/features/auth/api';
// [UPDATE] Import API provider untuk update profil sesuai perbaikan sebelumnya
import { updateProviderProfile } from '@/features/providers/api'; 
import { User } from '@/features/auth/types';

// Icons
const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface ProfileSettingsProps {
  onBack: () => void;
}

export default function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const [user, setUser] = useState<User | null>(null);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  
  // Image Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Kita tetap fetch data awal dari Auth Profile untuk mendapatkan Nama & No HP User
    fetchProfile().then(res => {
      const data = res.data.profile;
      setUser(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setBio((data as any).bio || '');
      
      if (data.profilePictureUrl) {
        setPreviewUrl(data.profilePictureUrl);
      }
    }).catch(console.error);
  }, []);

  // Handle klik tombol kamera -> trigger input file
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // Handle perubahan file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validasi ukuran (contoh: max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar (Maksimal 5MB)');
        return;
      }

      setSelectedFile(file);
      // Buat preview URL lokal agar UI responsif
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      formData.append('fullName', fullName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('bio', bio);

      if (selectedFile) {
        // Nama field 'profilePicture' sudah sesuai dengan Backend Route
        formData.append('profilePicture', selectedFile);
      }

      // [UPDATE] Gunakan updateProviderProfile dari Provider API
      // Backend akan mengupdate Data User (Nama, Foto) dan Data Provider (Bio) sekaligus
      await updateProviderProfile(formData);
      
      alert('Profil berhasil diperbarui!');
      onBack();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal menyimpan perubahan';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // [PERBAIKAN] Mengubah z-50 menjadi z-[100] agar menutupi Bottom Navigation
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
          <BackIcon />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Edit Profil</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-md mx-auto space-y-5">
          
          {/* Section Foto Profil */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={handleCameraClick}>
              <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg relative">
                <Image
                  src={previewUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Overlay Edit Icon */}
              <div className="absolute bottom-1 right-1 bg-red-600 p-2 rounded-full border-2 border-white shadow-sm hover:bg-red-700 transition-colors">
                <CameraIcon />
              </div>

              {/* Input File Tersembunyi */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor WhatsApp</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio / Keahlian</label>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan pengalaman Anda..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-red-500 resize-none outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Menyimpan...</span>
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </div>
    </div>
  );
}