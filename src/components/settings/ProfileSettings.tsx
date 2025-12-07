// src/components/settings/ProfileSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchProfile, updateProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;

interface ProfileSettingsProps {
  onBack: () => void;
}

export default function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then(res => {
      const data = res.data.profile;
      setUser(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      // Asumsi bio ada di profile, jika tidak ada di type User, sesuaikan dengan backend
      setBio((data as any).bio || ''); 
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ fullName, phoneNumber, bio });
      alert('Profil berhasil diperbarui!');
      onBack();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
          <BackIcon />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Edit Profil</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-md mx-auto space-y-5">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                <Image
                  src={user?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
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
          className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all disabled:opacity-70"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}