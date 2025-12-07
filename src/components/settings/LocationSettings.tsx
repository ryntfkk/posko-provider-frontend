// src/components/settings/LocationSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchMyProviderProfile, updateProviderProfile } from '@/features/providers/api';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Memuat Peta...</div>
});

const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const MapPinIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

interface Region { id: string; name: string; }

interface LocationSettingsProps {
  onBack: () => void;
}

export default function LocationSettings({ onBack }: LocationSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  // State Wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [villageName, setVillageName] = useState('');
  
  const [fullAddress, setFullAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([-6.2088, 106.8456]);
  const [workingStart, setWorkingStart] = useState('08:00');
  const [workingEnd, setWorkingEnd] = useState('17:00');

  const [wilayahLoading, setWilayahLoading] = useState({ cities: false, districts: false, villages: false });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Provinsi
        const provRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (provRes.ok) setProvinces(await provRes.json());

        // Load Existing Data
        const providerRes = await fetchMyProviderProfile();
        const p = providerRes.data;

        if (p.location?.address) {
            if (typeof p.location.address === 'object') {
                const addr = p.location.address as any;
                setFullAddress(addr.fullAddress || '');
                setProvinceName(addr.province || '');
                setCityName(addr.city || '');
                setDistrictName(addr.district || '');
                setVillageName(addr.village || '');
                setPostalCode(addr.postalCode || '');
            } else if (typeof p.location.address === 'string') {
                setFullAddress(p.location.address);
            }
        }

        if (p.workingHours) {
          setWorkingStart(p.workingHours.start || '08:00');
          setWorkingEnd(p.workingHours.end || '17:00');
        }
        
        if (p.location?.coordinates && p.location.coordinates.length === 2) {
            const [lng, lat] = p.location.coordinates;
            if (lat !== 0 || lng !== 0) setCoordinates([lat, lng]);
        }
      } catch (e) {
        console.error("Error loading location settings", e);
      }
    };
    loadData();
  }, []);

  const handleRegionChange = (type: 'province' | 'city' | 'district' | 'village', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = index > 0 ? e.target.options[index].text : '';

    if (type === 'province') {
      setSelectedProvId(id); setProvinceName(text);
      setSelectedCityId(''); setCityName(''); setCities([]);
      setSelectedDistrictId(''); setDistrictName(''); setDistricts([]);
      setSelectedVillageId(''); setVillageName(''); setVillages([]);

      if(id) {
        setWilayahLoading(prev => ({ ...prev, cities: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)
          .then(r => r.json()).then(setCities)
          .finally(() => setWilayahLoading(prev => ({ ...prev, cities: false })));
      }
    } else if (type === 'city') {
      setSelectedCityId(id); setCityName(text);
      setSelectedDistrictId(''); setDistrictName(''); setDistricts([]);
      setSelectedVillageId(''); setVillageName(''); setVillages([]);

      if(id) {
        setWilayahLoading(prev => ({ ...prev, districts: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)
          .then(r => r.json()).then(setDistricts)
          .finally(() => setWilayahLoading(prev => ({ ...prev, districts: false })));
      }
    } else if (type === 'district') {
      setSelectedDistrictId(id); setDistrictName(text);
      setSelectedVillageId(''); setVillageName(''); setVillages([]);

      if(id) {
        setWilayahLoading(prev => ({ ...prev, villages: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`)
          .then(r => r.json()).then(setVillages)
          .finally(() => setWilayahLoading(prev => ({ ...prev, villages: false })));
      }
    } else if (type === 'village') {
      setSelectedVillageId(id); setVillageName(text);
    }
  };

  const handleSave = async () => {
    if (!provinceName || !cityName) {
        alert("Mohon lengkapi Provinsi dan Kota.");
        return;
    }

    setIsSaving(true);
    try {
        await updateProviderProfile({
            fullAddress,
            province: provinceName,
            city: cityName,
            district: districtName,
            postalCode,
            latitude: coordinates[0],
            longitude: coordinates[1],
            workingHours: {
                start: workingStart,
                end: workingEnd
            }
        });
        alert('Data operasional berhasil diperbarui!');
        onBack();
    } catch (error) {
        console.error(error);
        alert('Gagal memperbarui data operasional.');
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
        <h1 className="text-lg font-bold text-gray-900">Alamat & Operasional</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
        <div className="max-w-md mx-auto space-y-6">
            
            {/* Peta */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPinIcon /> Lokasi Peta
                </h3>
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    Klik / Tap pada peta untuk menentukan lokasi tepat tempat usaha/basecamp Anda.
                </div>
                <LocationPicker 
                    initialPosition={coordinates} 
                    onLocationSelect={(lat, lng) => setCoordinates([lat, lng])} 
                />
            </div>

            {/* Form Alamat */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Detail Alamat</h3>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Provinsi</label>
                    <select 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none"
                        value={selectedProvId}
                        onChange={(e) => handleRegionChange('province', e)}
                    >
                        <option value="">{provinceName || "Pilih Provinsi..."}</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kota</label>
                    <select 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none disabled:bg-gray-100"
                        value={selectedCityId}
                        onChange={(e) => handleRegionChange('city', e)}
                        disabled={!selectedProvId && !provinceName}
                    >
                        <option value="">{wilayahLoading.cities ? "Memuat..." : (cityName || "Pilih Kota...")}</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kecamatan</label>
                        <select 
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none disabled:bg-gray-100"
                            value={selectedDistrictId}
                            onChange={(e) => handleRegionChange('district', e)}
                            disabled={!selectedCityId && !cityName}
                        >
                            <option value="">{wilayahLoading.districts ? "Memuat..." : (districtName || "Pilih...")}</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kode Pos</label>
                        <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="12xxx"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Detail Jalan</label>
                    <textarea
                        rows={2}
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="Jl. Contoh No. 123..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none resize-none"
                    />
                </div>
            </div>

            {/* Jam Operasional */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Jam Operasional</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buka</label>
                        <input
                            type="time"
                            value={workingStart}
                            onChange={(e) => setWorkingStart(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tutup</label>
                        <input
                            type="time"
                            value={workingEnd}
                            onChange={(e) => setWorkingEnd(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none"
                        />
                    </div>
                </div>
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