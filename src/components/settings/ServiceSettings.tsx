// src/components/settings/ServiceSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import api from '@/lib/axios';
import { fetchMyProviderProfile, updateProviderServices } from '@/features/providers/api';
import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';

// Icons
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ToolIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

interface ProviderService {
  _id: string;
  serviceId: { _id: string; name: string; category: string; iconUrl: string; basePrice: number; };
  price: number;
  isActive: boolean;
}

interface ServiceSettingsProps {
  onBack: () => void;
}

export default function ServiceSettings({ onBack }: ServiceSettingsProps) {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedNewService, setSelectedNewService] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [provRes, allSvcRes] = await Promise.all([
          fetchMyProviderProfile(),
          fetchServices()
        ]);
        if (provRes.data?.services) setServices(provRes.data.services);
        setAllServices(allSvcRes.data || []);
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  const handleToggleService = async (index: number) => {
    const updated = [...services];
    updated[index].isActive = !updated[index].isActive;
    setServices(updated);
    
    try {
      await api.put('/providers/services', {
        services: updated.map(s => ({ serviceId: s.serviceId._id, price: s.price, isActive: s.isActive }))
      });
    } catch {
      updated[index].isActive = !updated[index].isActive; // Revert
      setServices([...updated]);
      alert("Gagal update status");
    }
  };

  const handleSavePrice = async (index: number) => {
    if (services[index].price < 1000) return alert("Harga min Rp 1.000");
    try {
      await api.put('/providers/services', {
        services: services.map(s => ({ serviceId: s.serviceId._id, price: s.price, isActive: s.isActive }))
      });
    } catch { alert("Gagal simpan harga"); }
  };

  const handleAddService = async () => {
    if (!selectedNewService || newServicePrice < 1000) return alert("Data tidak valid");
    setIsSaving(true);
    try {
      const newPayload = [
        ...services.map(s => ({ serviceId: s.serviceId._id, price: s.price, isActive: s.isActive })),
        { serviceId: selectedNewService, price: newServicePrice, isActive: true }
      ];
      const res = await updateProviderServices(newPayload);
      if(res.data?.services) setServices(res.data.services);
      setShowAddServiceModal(false);
      setSelectedNewService('');
      setNewServicePrice(0);
    } catch { alert("Gagal tambah layanan"); }
    finally { setIsSaving(false); }
  };

  const handleRemoveService = async (index: number) => {
    if(!confirm("Hapus layanan ini?")) return;
    const filtered = services.filter((_, i) => i !== index);
    try {
      await api.put('/providers/services', {
        services: filtered.map(s => ({ serviceId: s.serviceId._id, price: s.price, isActive: s.isActive }))
      });
      setServices(filtered);
    } catch { alert("Gagal hapus layanan"); }
  };

  const availableServices = allServices.filter(s => !services.some(ps => ps.serviceId._id === s._id));

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-4 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"><BackIcon /></button>
          <h1 className="text-lg font-bold text-gray-900">Kelola Layanan</h1>
        </div>
        <button onClick={() => setShowAddServiceModal(true)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><PlusIcon /></button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-md mx-auto space-y-3">
          {services.map((service, idx) => (
            <div key={service._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1">
                    {service.serviceId.iconUrl ? <Image src={service.serviceId.iconUrl} alt="Icon" width={24} height={24} /> : <ToolIcon />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{service.serviceId.name}</p>
                    <p className="text-xs text-gray-500">{service.serviceId.category}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={service.isActive} onChange={() => handleToggleService(idx)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                  <input 
                    type="number" 
                    value={service.price} 
                    onChange={(e) => {
                        const newS = [...services];
                        newS[idx].price = parseInt(e.target.value) || 0;
                        setServices(newS);
                    }}
                    onBlur={() => handleSavePrice(idx)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-red-500 outline-none text-sm font-bold" 
                  />
                </div>
                <button onClick={() => handleRemoveService(idx)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold mb-4">Tambah Layanan</h3>
            <div className="space-y-4">
                <select 
                    value={selectedNewService} 
                    onChange={(e) => {
                        setSelectedNewService(e.target.value);
                        const s = allServices.find(as => as._id === e.target.value);
                        if(s) setNewServicePrice(s.basePrice);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                >
                    <option value="">-- Pilih Layanan --</option>
                    {availableServices.map(s => <option key={s._id} value={s._id}>{s.name} ({s.category})</option>)}
                </select>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input 
                        type="number" 
                        value={newServicePrice} 
                        onChange={(e) => setNewServicePrice(parseInt(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold" 
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddServiceModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Batal</button>
                    <button onClick={handleAddService} disabled={isSaving || !selectedNewService} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Simpan</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}