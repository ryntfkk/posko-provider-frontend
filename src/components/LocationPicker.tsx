// src/components/LocationPicker.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useCallback } from 'react';

// --- 1. Konfigurasi Icon Leaflet (MERAH) ---
const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = RedIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

// --- 2. Komponen Marker & Logic Peta ---
function LocationMarker({ 
  onLocationSelect, 
  onEndLocate,
  onError,
  initialLat,
  initialLng
}: { 
  onLocationSelect: (lat: number, lng: number) => void,
  onEndLocate: () => void,
  onError: (e: any) => void,
  initialLat?: number,
  initialLng?: number
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      onEndLocate(); // Matikan loading
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 16);
    },
    locationerror(e) {
      onError(e); // Kirim error ke handler
    },
  });

  useEffect(() => {
    if (initialLat && initialLng) {
      const newPos = new L.LatLng(initialLat, initialLng);
      setPosition(newPos);
      map.flyTo(newPos, 16);
    }
  }, [initialLat, initialLng, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi Terpilih</Popup>
    </Marker>
  );
}

// --- 3. Komponen Custom Controls (Zoom & GPS) ---
function MapControls({ onStartLocate }: { onStartLocate: () => void }) {
  const map = useMap();

  useEffect(() => {
    const customControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control flex flex-col gap-2 !mb-14 !mr-4');
        
        const createBtn = (iconSvg: string, onClick: (e: MouseEvent) => void, title: string) => {
            const btn = L.DomUtil.create('button', 'bg-white w-10 h-10 flex items-center justify-center cursor-pointer rounded-lg hover:bg-gray-50 transition-colors shadow-none border-none outline-none', container);
            btn.innerHTML = iconSvg;
            btn.title = title;
            btn.type = "button";
            btn.onclick = (e: any) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(e);
            };
            return btn;
        };

        // Zoom In
        createBtn(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-600"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>`,
            () => map.zoomIn(),
            "Perbesar"
        );

        // Zoom Out
        createBtn(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-600"><path d="M5 12h14"/></svg>`,
            () => map.zoomOut(),
            "Perkecil"
        );

        L.DomUtil.create('div', 'h-1', container);

        // Tombol GPS
        createBtn(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-600"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`,
            () => {
                onStartLocate(); // Aktifkan status loading
                // Meminta Leaflet mencari lokasi
                map.locate({ enableHighAccuracy: true }); 
            },
            "Lokasi Saya"
        );

        L.DomEvent.disableClickPropagation(container);
        return container;
      },
    });
    
    const controlInstance = new customControl();
    map.addControl(controlInstance);

    return () => {
      map.removeControl(controlInstance);
    };
  }, [map, onStartLocate]);

  return null;
}

// --- 4. Modal Tutorial & Fallback ---
function PermissionHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center animate-fadeIn border border-gray-100 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <p className="text-xs text-gray-500 mb-1 leading-relaxed">
            Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.
        </p>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-transform hover:-translate-y-0.5 shadow-lg shadow-red-200 mt-3"
        >
          Pilih Manual di Peta
        </button>
      </div>
    </div>
  );
}

// --- 5. Komponen Utama ---
export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 1. Handle Selesai (Sukses)
  const handleEndLocate = useCallback(() => {
    setIsLocating(false);
  }, []);

  // 2. Handle Error
  const handleError = useCallback((e: any) => {
    // Filter error kosong (bug Leaflet di beberapa browser/ekstensi)
    if (!e || (!e.code && !e.message)) {
        return; 
    }
    
    setIsLocating(false); // Matikan loading jika error valid
    console.error("GPS Error:", e);
    setShowHelp(true); // Tampilkan modal bantuan
  }, []);

  // 3. Handle Mulai (Tanpa Timer Manual)
  const handleStartLocate = useCallback(() => {
    setIsLocating(true);
    setShowHelp(false);
  }, []);

  return (
    <div className="relative w-full h-full z-0 group overflow-hidden rounded-xl bg-gray-100">
      
      <PermissionHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Loading Overlay */}
      {isLocating && (
        <div className="absolute inset-0 z-[5000] bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse border border-red-100">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-gray-600">Mencari koordinat...</span>
            </div>
        </div>
      )}

      <MapContainer 
        center={[-6.200000, 106.816666]} 
        zoom={13} 
        scrollWheelZoom={true} 
        zoomControl={false} 
        className="h-full w-full z-0"
        style={{ height: '100%', minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker 
            onLocationSelect={onLocationSelect} 
            onEndLocate={handleEndLocate}
            onError={handleError}
            initialLat={initialLat}
            initialLng={initialLng}
        />

        <MapControls onStartLocate={handleStartLocate} />
      </MapContainer>
    </div>
  );
}