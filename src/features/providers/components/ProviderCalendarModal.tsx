// src/features/providers/components/ProviderCalendarModal.tsx

import { Provider } from '../types';
import { CloseIcon, ChevronLeft, ChevronRight } from './Icons';

interface ProviderCalendarModalProps {
  provider: Provider;
  isOpen: boolean;
  currentMonth: Date;
  onClose: () => void;
  onChangeMonth: (delta: number) => void;
}

export default function ProviderCalendarModal({
  provider,
  isOpen,
  currentMonth,
  onClose,
  onChangeMonth,
}: ProviderCalendarModalProps) {
  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayIndex }, (_, i) => <div key={`blank-${i}`} />);

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month, day);
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const dateStr = offsetDate.toISOString().split('T')[0];

    const blockedSet = new Set(provider.blockedDates?.map((d: string) => d.split('T')[0]) || []);
    const bookedSet = new Set(provider.bookedDates?.map((d: string) => d.split('T')[0]) || []);

    const isBlocked = blockedSet.has(dateStr);
    const isBooked = bookedSet.has(dateStr);
    const isPast = dateStr < new Date().toISOString().split('T')[0];

    let bgClass = 'bg-green-50 text-green-700 border-green-100';
    let label = 'Ada';

    if (isPast) {
      bgClass = 'bg-gray-50 text-gray-300 border-gray-100';
      label = '';
    } else if (isBooked) {
      bgClass = 'bg-red-50 text-red-600 border-red-100';
      label = 'Penuh';
    } else if (isBlocked) {
      bgClass = 'bg-gray-100 text-gray-400 border-gray-200';
      label = 'Libur';
    }

    return (
      <div key={day} className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs ${bgClass}`}>
        <span className="font-bold">{day}</span>
        {! isPast && <span className="text-[8px] uppercase tracking-tight">{label}</span>}
      </div>
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900">Jadwal Ketersediaan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl">
            <button onClick={() => onChangeMonth(-1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 text-gray-600">
              <ChevronLeft />
            </button>
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => onChangeMonth(1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 text-gray-600">
              <ChevronRight />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-gray-400">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 max-h-[300px] overflow-y-auto">
            {blanks}
            {dayCells}
          </div>

          <div className="flex gap-3 mt-6 justify-center text-[10px] text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>Tersedia
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>Penuh
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>Libur
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">Pilih layanan dan tentukan tanggal saat checkout.</p>
          <button
            onClick={onClose}
            className="mt-3 w-full py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}