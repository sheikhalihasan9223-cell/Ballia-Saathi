import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addToCart } from '@/lib/cartStore';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return setTimeLeft({ h: 0, m: 0, s: 0 });
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1">
      {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((v, i) => (
        <span key={i} className="flex items-center">
          <span className="bg-red-500 text-white text-[10px] font-bold rounded px-1 py-0.5 min-w-[22px] text-center">{v}</span>
          {i < 2 && <span className="text-red-500 font-bold text-[10px] mx-0.5">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function DailyOffers({ products }) {
  if (!products || products.length === 0) return null;

  const handleAdd = (p, e) => {
    e.preventDefault();
    addToCart({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, unit: p.unit });
    toast.success(`${p.name} added!`);
  };

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h2 className="font-heading font-bold text-base text-foreground">Daily Offers</h2>
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIMITED</span>
        </div>
        <Link to="/search" className="text-xs text-primary font-semibold">View All</Link>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {products.map((p) => {
            const discount = p.original_price > p.price
              ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
              : null;
            return (
              <Link key={p.id} to={`/product/${p.id}`} className="w-36 shrink-0 bg-card border border-border rounded-2xl overflow-hidden active:scale-95 transition-transform">
                <div className="relative bg-muted/30 p-2">
                  <img src={p.image_url} alt={p.name} className="w-full h-24 object-contain" />
                  {discount && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">{p.name}</p>
                  {p.offer_end_time && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Clock className="w-3 h-3 text-red-500 shrink-0" />
                      <CountdownTimer endTime={p.offer_end_time} />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">₹{p.price}</p>
                      {p.original_price > p.price && (
                        <p className="text-[10px] text-muted-foreground line-through">₹{p.original_price}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleAdd(p, e)}
                      className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-base active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}