// src/components/settings/AccountSettings.tsx
'use client';

const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;

export default function AccountSettings({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
          <BackIcon />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Akun & Keamanan</h1>
      </header>
      
      <div className="flex-1 p-5 bg-gray-50">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Ganti Password</h3>
            <div className="space-y-3">
              <input type="password" placeholder="Password Lama" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
              <input type="password" placeholder="Password Baru" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
              <input type="password" placeholder="Konfirmasi Password Baru" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-red-500 transition-colors" />
              <button className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800">Update Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}