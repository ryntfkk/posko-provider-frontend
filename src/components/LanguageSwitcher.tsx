// src/components/LanguageSwitcher.tsx
'use client';

import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    // Ambil bahasa saat ini dari localStorage saat komponen dimuat
    const savedLang = localStorage.getItem('posko_lang');
    
    // Cek apakah ada preference bahasa tersimpan yang berbeda dari default ('id')
    if (savedLang === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang('en');
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'id' ? 'en' : 'id';
    
    // 1. Simpan ke localStorage
    localStorage.setItem('posko_lang', newLang);
    setLang(newLang);

    // 2. Reload halaman agar konfigurasi Axios diperbarui secara global
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      // Posisi: bottom-24 pada mobile agar tidak tertutup nav, bottom-8 pada desktop
      className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-50 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-xl hover:scale-105 hover:bg-white transition-all duration-300 group"
      title={lang === 'id' ? 'Ganti Bahasa' : 'Change Language'}
    >
      <span className="text-lg leading-none drop-shadow-sm">
        {lang === 'id' ? '🇮🇩' : '🇺🇸'}
      </span>
      <span className="text-xs font-bold text-gray-600 group-hover:text-red-600 transition-colors">
        {lang === 'id' ? 'ID' : 'EN'}
      </span>
    </button>
  );
}