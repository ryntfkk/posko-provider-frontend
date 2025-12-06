'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// [FIX] Ikon Marker Default Leaflet sering hilang di Next.js/React
// Kita perbaiki manual dengan menimpa konfigurasi ikon default
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationPickerProps {
  initialPosition?: [number, number]; // [lat, lng]
  onLocationSelect: (lat: number, lng: number) => void;
}

// Komponen Marker yang bisa digeser
function DraggableMarker({ position, onDragEnd }: { position: L.LatLngExpression, onDragEnd: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onDragEnd(lat, lng);
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup minWidth={90}>
        <span>Geser marker ini ke lokasi operasional Anda</span>
      </Popup>
    </Marker>
  );
}

// Komponen utama
const LocationPicker = ({ initialPosition, onLocationSelect }: LocationPickerProps) => {
  // Default ke Jakarta jika [0,0] atau null
  const defaultCenter: [number, number] = 
    (initialPosition && initialPosition[0] !== 0) 
    ? initialPosition 
    : [-6.2088, 106.8456]; 
  
  const [position, setPosition] = useState<[number, number]>(defaultCenter);

  // Update posisi internal jika props berubah (misal data baru dimuat)
  useEffect(() => {
    if (initialPosition && initialPosition[0] !== 0) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const handleDragEnd = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} onDragEnd={handleDragEnd} />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;