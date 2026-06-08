import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCart, getCartTotal } from '@/lib/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/categories', icon: Grid3X3, label: 'Categories' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(getCart());

  useEffect(() => {
    const handler = () => setCartItems(getCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const firstItem = cartItems[0];

  return (
    <div className="min-h-screen bg-background font-body">
      <div style={{ height: 'env(safe-area-inset-top)', background: 'hsl(var(--background))' }} />
      <main className="pb-20">
        <Outlet />
      </main>
      <WhatsAppFloat />

      {/* Floating View Cart Bar (like screenshot) */}
      <AnimatePresence>
        {cartCount > 0 && location.pathname !== '/cart' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-[68px] left-0 right-0 z-40 flex justify-center px-4"
          >
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-3 bg-primary text-white rounded-full px-5 py-3 shadow-2xl shadow-primary/40 active:scale-95 transition-transform"
              style={{ minWidth: 200 }}
            >
              {firstItem?.image_url && (
                <img src={firstItem.image_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/30" />
              )}
              <div className="flex-1 text-left">
                <p className="font-bold text-sm leading-none">View cart</p>
                <p className="text-[11px] text-white/70 mt-0.5">{cartCount} item{cartCount > 1 ? 's' : ''}</p>
              </div>
              <span className="font-bold text-sm">₹{cartTotal}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-0.5 px-4 py-1.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-2 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {label === 'Cart' && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 text-[10px] font-bold bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}