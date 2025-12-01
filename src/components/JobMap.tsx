// src/components/JobMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Memperbaiki icon marker default Leaflet yang sering hilang di Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface JobMapProps {
  coordinates: [number, number]; // [Longitude, Latitude] dari MongoDB biasanya, tapi Leaflet butuh [Lat, Lng]
}

export default function JobMap({ coordinates }: JobMapProps) {
  // MongoDB GeoJSON menyimpan sebagai [Longitude, Latitude]
  // Leaflet membutuhkan [Latitude, Longitude]
  const position: [number, number] = [coordinates[1], coordinates[0]];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden z-0 relative">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup>
            Lokasi Pengerjaan
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}