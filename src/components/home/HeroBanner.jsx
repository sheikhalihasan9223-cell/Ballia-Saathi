import { useState, useEffect, useRef } from 'react';
import { localClient } from '@/api/localClient';
import { useQuery } from '@tanstack/react-query';
import { Zap, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const FALLBACK_BANNERS = [
  {
    id: 'fb1',
    title: 'Fresh Grocery Delivered Fast',
    subtitle: 'Ballia mein 20 minute delivery — ताज़ा सामान घर पर',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop',
    link: '/search',
  },
  {
    id: 'fb2',
    title: '🥦 Sabzi, Dal, Chawal Sab Yahan',
    subtitle: 'Best prices on daily groceries — हर रोज़ बेस्ट दाम',
    image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=400&fit=crop',
    link: '/search',
  },
  {
    id: 'fb3',
    title: '🎉 Super Savings Today!',
    subtitle: 'Up to 40% off on fresh fruits & vegetables',
    image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=400&fit=crop',
    link: '/search',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const { data: dbBanners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: () => localClient.entities.Banner.filter({ is_active: true }, 'position'),
  });

  const banners = dbBanners.length > 0 ? dbBanners : FALLBACK_BANNERS;

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrent(c => (c + 1) % banners.length);
      else setCurrent(c => (c - 1 + banners.length) % banners.length);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl mx-4 mt-3"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35 }}
          className="relative h-44 sm:h-52 rounded-2xl overflow-hidden"
        >
          <Link to={banners[current]?.link || '/search'} className="block w-full h-full">
            <img
              src={banners[current]?.image_url}
              alt={banners[current]?.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-accent fill-accent" />
                <span className="text-accent text-xs font-bold uppercase tracking-wider">Ballia Saathi</span>
              </div>
              <h2 className="text-white font-heading font-bold text-lg sm:text-xl leading-snug max-w-[220px]">
                {banners[current]?.title}
              </h2>
              <p className="text-white/75 text-xs mt-1 max-w-[200px] leading-snug">
                {banners[current]?.subtitle}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl self-start active:scale-95 transition-transform shadow-lg">
                <ShoppingBag className="w-3.5 h-3.5" /> Shop Now
              </span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}