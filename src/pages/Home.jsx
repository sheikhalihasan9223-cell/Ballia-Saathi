import { localClient, logoUrl } from '@/api/localClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductSection from '@/components/home/ProductSection';
import DailyOffers from '@/components/home/DailyOffers';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, ChevronDown, RefreshCw, Bell, Zap, Truck, Shield, Phone } from 'lucide-react';
import { getCartCount, getCartTotal } from '@/lib/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/lib/useNotifications';
import VoiceSearch from '@/components/VoiceSearch';
import NotificationsPanel from '@/components/home/NotificationsPanel';
import { getCategories } from '@/lib/categories';

export default function Home() {
  const [cartCount, setCartCount] = useState(getCartCount());
  const [cartTotal, setCartTotal] = useState(getCartTotal());
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const touchStartY = useRef(null);
  const queryClient = useQueryClient();
  const { permission, requestPermission } = useNotifications();

  useEffect(() => {
    const handler = () => {
      setCartCount(getCartCount());
      setCartTotal(getCartTotal());
    };
    window.addEventListener('cart-updated', handler);
    localClient.auth.me().then(u => {
      setUserEmail(u?.email || null);
      setUserName(u?.full_name?.split(' ')[0] || '');
    }).catch(() => {});
    const t = setTimeout(() => {
      if (Notification.permission === 'default') setShowNotifBanner(true);
    }, 3000);
    return () => { window.removeEventListener('cart-updated', handler); clearTimeout(t); };
  }, []);

  const { data: addresses = [] } = useQuery({
    queryKey: ['home-addresses', userEmail],
    queryFn: () => localClient.entities.Address.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => localClient.entities.Product.filter({ is_active: true }),
  });

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
  const featured = products.filter(p => p.is_featured);
  const deals = products.filter(p => p.original_price > p.price).slice(0, 8);
  const dailyOffers = products.filter(p => p.is_daily_offer);
  const categorySections = getCategories()
    .map(category => ({
      ...category,
      products: products.filter(product => product.category === category.id),
    }))
    .filter(category => category.products.length > 0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) setPullY(Math.min(delta * 0.4, 70));
  };

  const handleTouchEnd = async () => {
    if (pullY > 50) {
      setIsPulling(true);
      await queryClient.refetchQueries({ queryKey: ['products'] });
      setIsPulling(false);
    }
    setPullY(0);
    touchStartY.current = null;
  };

  return (
    <div
      className="max-w-lg mx-auto bg-background min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        animate={{ height: pullY > 0 || isPulling ? 40 : 0, opacity: pullY > 20 || isPulling ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex items-center justify-center overflow-hidden bg-primary/10"
      >
        <RefreshCw className={`w-4 h-4 text-primary ${isPulling ? 'animate-spin' : ''}`} />
        <span className="text-xs text-primary ml-2 font-medium">{isPulling ? 'Refreshing...' : 'Release to refresh'}</span>
      </motion.div>

      <AnimatePresence>
        {showNotifBanner && permission === 'default' && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="mx-4 mt-3 rounded-2xl bg-gradient-to-r from-primary/90 to-accent/90 p-3 flex items-center gap-3 z-40"
          >
            <Bell className="w-5 h-5 text-white shrink-0" />
            <p className="text-xs text-white flex-1">Enable notifications for order updates & deals</p>
            <button
              onClick={() => { requestPermission(); setShowNotifBanner(false); }}
              className="text-[11px] font-bold bg-white text-primary rounded-xl px-3 py-1.5 shrink-0 active:scale-95 transition-transform"
            >
              Allow
            </button>
            <button onClick={() => setShowNotifBanner(false)} className="text-white/60 text-xs">x</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="Ballia Saathi" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <span className="font-heading font-bold text-base text-foreground leading-tight block">Ballia Saathi</span>
              <p className="text-[10px] text-muted-foreground font-medium">
                {userName ? `Namaste, ${userName}` : 'Ballia ka apna grocery app'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceSearch />
            <NotificationsPanel />
            <Link to="/cart" className="relative flex items-center gap-1.5 bg-primary text-white rounded-xl px-3 py-2 active:scale-95 transition-transform">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold">₹{cartTotal}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[10px] font-bold bg-accent text-white rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <Link to="/profile/addresses" className="flex items-center gap-1.5 px-4 pb-2">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[220px]">
            {defaultAddress ? `${defaultAddress.full_address}, ${defaultAddress.city}` : 'Apna address add karein'}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        </Link>

        <div className="mx-4 mb-2 flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[11px] font-semibold text-green-600">Ballia mein 20 minute delivery</span>
        </div>

        <div className="px-4 pb-3">
          <Link
            to="/search"
            className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 hover:opacity-90 active:scale-98 transition-all border border-border"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Grocery, sabzi, dal, chawal...</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-around px-4 py-3 border-b border-border">
        {[
          { icon: Zap, label: '20 Min', sub: 'Delivery' },
          { icon: Shield, label: '100%', sub: 'Fresh' },
          { icon: Truck, label: 'Free', sub: 'Above ₹199' },
          { icon: Phone, label: 'Support', sub: '24/7' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-foreground">{label}</span>
            <span className="text-[9px] text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>

      <div>
        <HeroBanner />

        <div className="mx-4 mt-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4">
          <p className="text-foreground font-heading font-bold text-base leading-snug">
            Ballia ka apna grocery delivery app
          </p>
          <p className="text-muted-foreground text-xs mt-1">Fresh items delivered to your doorstep.</p>
          <Link to="/search" className="mt-3 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform">
            <Search className="w-3.5 h-3.5" /> Shop Now
          </Link>
        </div>

        <CategoryGrid />
        <DailyOffers products={dailyOffers} />
        <ProductSection title="Best Deals" products={deals} link="/search" userEmail={userEmail} />
        <ProductSection title="Featured Products" products={featured} link="/search" userEmail={userEmail} />

        <div className="px-4 mt-7 mb-1">
          <h2 className="font-heading font-extrabold text-xl leading-tight">All Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Shop by category</p>
        </div>
        {categorySections.map(category => (
          <ProductSection
            key={category.id}
            title={category.name}
            products={category.products.slice(0, 12)}
            link={`/category/${category.id}`}
            userEmail={userEmail}
          />
        ))}

        <div className="mx-4 mt-6 mb-2 rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 55%, #f97316 100%)' }}>
          <div className="p-5 relative z-10">
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Ballia Saathi Promise</p>
            <p className="font-heading font-extrabold text-white text-2xl leading-tight">
              GET EVERYTHING<br />
              IN <span className="bg-white text-primary px-2 py-0.5 rounded-lg">20 MINUTES</span>
            </p>
            <p className="text-white/80 text-xs mt-2">Fresh groceries delivered to your door</p>
            <Link to="/search" className="mt-3 inline-flex items-center gap-1.5 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform">
              Order Now
            </Link>
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
