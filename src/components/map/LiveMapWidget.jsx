import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, Home, ExternalLink, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Converts lat/lng to x/y % in our mini map viewport
function toMapXY(lat, lng, bounds) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.min(Math.max(x, 5), 95), y: Math.min(Math.max(y, 5), 95) };
}

export default function LiveMapWidget({ orderId, deliveryAddress, dark = true }) {
  const [riderData, setRiderData] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    // Poll rider location every 5s
    const fetch = () => {
      base44.entities.RiderLocation.filter({ order_id: orderId })
        .then(res => { if (res[0]) setRiderData(res[0]); })
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const hasLiveRider = riderData && riderData.lat && riderData.lng && riderData.is_online;

  // Dynamic bounds around rider + a fixed destination
  const destLat = 25.7464, destLng = 84.0000;
  const riderLat = riderData?.lat || destLat + 0.02;
  const riderLng = riderData?.lng || destLng + 0.02;

  const bounds = {
    minLat: Math.min(destLat, riderLat) - 0.01,
    maxLat: Math.max(destLat, riderLat) + 0.01,
    minLng: Math.min(destLng, riderLng) - 0.01,
    maxLng: Math.max(destLng, riderLng) + 0.01,
  };

  const destPos = toMapXY(destLat, destLng, bounds);
  const riderPos = toMapXY(riderLat, riderLng, bounds);

  const openGoogleMaps = () => {
    if (hasLiveRider) {
      window.open(`https://www.google.com/maps?q=${riderLat},${riderLng}`, '_blank');
    } else if (deliveryAddress) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}`, '_blank');
    }
  };

  const bg = dark ? '#12122a' : '#f1f5f9';
  const gridColor = dark ? '#6366f1' : '#94a3b8';
  const textMuted = dark ? 'text-white/40' : 'text-gray-400';
  const cardBg = dark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200';

  return (
    <div className={`rounded-3xl overflow-hidden border ${cardBg}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasLiveRider ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>
            {hasLiveRider ? 'Live Tracking' : 'Delivery Map'}
          </span>
        </div>
        <button
          onClick={openGoogleMaps}
          className={`flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1 ${dark ? 'bg-white/5 text-primary hover:bg-white/10' : 'bg-primary/10 text-primary hover:bg-primary/20'} transition-colors`}
        >
          <ExternalLink className="w-3 h-3" /> Open Maps
        </button>
      </div>

      {/* Map canvas */}
      <div className="relative h-52 overflow-hidden" style={{ background: bg }}>
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`grid-${dark}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke={gridColor} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${dark})`} />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke={gridColor} strokeWidth="2" opacity="0.4" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke={gridColor} strokeWidth="2" opacity="0.4" />
        </svg>

        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1={`${riderPos.x}%`} y1={`${riderPos.y}%`}
            x2={`${destPos.x}%`} y2={`${destPos.y}%`}
            stroke="#a855f7" strokeWidth="2" strokeDasharray="6,4" opacity="0.7"
          />
        </svg>

        {/* Destination pin */}
        <div className="absolute" style={{ left: `${destPos.x}%`, top: `${destPos.y}%`, transform: 'translate(-50%, -100%)' }}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-lg shadow-green-500/50">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div className="w-0.5 h-3 bg-green-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            Delivery
          </div>
        </div>

        {/* Rider pin */}
        {hasLiveRider ? (
          <motion.div
            className="absolute"
            animate={{ left: `${riderPos.x}%`, top: `${riderPos.y}%` }}
            transition={{ duration: 3, ease: 'linear' }}
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg shadow-primary/50">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="w-0.5 h-3 bg-primary" />
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 -m-3 rounded-full bg-primary/30"
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {riderData?.rider_name || 'Rider'}
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Truck className="w-6 h-6 text-primary/40" />
              </div>
              <p className={`text-xs ${textMuted}`}>Live tracking starts</p>
              <p className={`text-[10px] ${textMuted}`}>when rider is en route</p>
            </div>
          </div>
        )}
      </div>

      {/* Rider info row */}
      {hasLiveRider && (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${dark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${dark ? 'bg-primary/20 border-primary/30' : 'bg-primary/10 border-primary/20'}`}>
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{riderData.rider_name || 'Rider'}</p>
              <p className={`text-[11px] ${textMuted}`}>Delivery Partner · GPS Active</p>
            </div>
          </div>
          {riderData.rider_phone && (
            <a
              href={`tel:${riderData.rider_phone}`}
              className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary rounded-xl px-3 py-2 text-xs font-semibold"
            >
              📞 Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}