import { useEffect } from 'react';
import { Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const riderIcon = L.divIcon({
  html: `<div style="background:#7c3aed;width:40px;height:40px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(124,58,237,0.6);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.panTo([coords.lat, coords.lng], { animate: true, duration: 1 });
  }, [coords, map]);
  return null;
}

export default function RiderMap({ currentCoords, isOnline }) {
  const defaultCenter = currentCoords
    ? [currentCoords.lat, currentCoords.lng]
    : [25.7464, 84.0000];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height: '380px' }}>
      {!isOnline && (
        <div className="absolute inset-0 z-[999] bg-[#0a0a18]/80 flex items-center justify-center flex-col gap-2 rounded-2xl">
          <Truck className="w-10 h-10 text-white/20" />
          <p className="text-white/30 text-sm font-medium">Go online to enable GPS tracking</p>
        </div>
      )}
      {isOnline && !currentCoords && (
        <div className="absolute inset-0 z-[999] bg-[#0a0a18]/60 flex items-center justify-center flex-col gap-2 rounded-2xl">
          <div className="w-8 h-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Getting your location...</p>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {currentCoords && (
          <>
            <Marker position={[currentCoords.lat, currentCoords.lng]} icon={riderIcon} />
            <Circle
              center={[currentCoords.lat, currentCoords.lng]}
              radius={80}
              pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.15, weight: 2 }}
            />
            <RecenterMap coords={currentCoords} />
          </>
        )}
      </MapContainer>

      {currentCoords && (
        <div className="absolute bottom-3 left-3 z-[999] bg-black/70 backdrop-blur-sm text-white text-[10px] rounded-xl px-3 py-1.5 font-mono pointer-events-none">
          📍 {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}