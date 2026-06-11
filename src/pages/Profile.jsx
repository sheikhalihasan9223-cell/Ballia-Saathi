import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Package,
  HelpCircle,
  Heart,
  Wallet,
  MapPin,
  User,
  Gift,
  CreditCard,
  RefreshCw,
  LogOut,
  Shield,
  Phone,
  Truck,
  Moon,
  Sun,
} from 'lucide-react';
import { getDarkMode, setDarkMode } from '@/lib/themeStore';

export default function Profile() {
  const [profileUser, setProfileUser] = useState(null);
  const [isDark, setIsDark] = useState(getDarkMode());
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const refreshUser = () => {
      localClient.auth.me().then(setProfileUser).catch(() => {});
    };

    refreshUser();
    window.addEventListener('focus', refreshUser);
    window.addEventListener('ballia-saathi-user-role-updated', refreshUser);

    return () => {
      window.removeEventListener('focus', refreshUser);
      window.removeEventListener('ballia-saathi-user-role-updated', refreshUser);
    };
  }, []);

  const profileRole = profileUser?.role || 'user';
  const isSuperAdmin = profileRole === 'super_admin';
  const isCustomer = profileRole === 'user' || isSuperAdmin;
  const isAdmin = profileRole === 'admin' || isSuperAdmin;
  const isRider = profileRole === 'rider' || isSuperAdmin;

  const { data: addresses = [] } = useQuery({
    queryKey: ['profile-addresses', profileUser?.email],
    queryFn: () => localClient.entities.Address.filter({ user_email: profileUser.email }),
    enabled: !!profileUser?.email && isCustomer,
  });

  const toggleDark = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    setDarkMode(newVal);
  };

  const topActions = [
    { icon: Package, label: 'Your Orders', path: '/orders', color: 'text-foreground' },
    { icon: HelpCircle, label: 'Help & Support', path: '/profile/help', color: 'text-foreground' },
    { icon: Heart, label: 'Your Wishlist', path: '/profile/wishlist', color: 'text-foreground' },
  ];

  const menuItems = [
    { icon: Package, label: 'Your Orders', path: '/orders' },
    { icon: HelpCircle, label: 'Help & Support', path: '/profile/help' },
    { icon: Heart, label: 'Your Wishlist', path: '/profile/wishlist' },
    { icon: RefreshCw, label: 'Your Refunds', path: '/profile/refunds' },
    {
      icon: MapPin,
      label: 'Saved Addresses',
      path: '/profile/addresses',
      badge: addresses.length > 0 ? `${addresses.length} Address${addresses.length > 1 ? 'es' : ''}` : null,
    },
    { icon: CreditCard, label: 'Payment Management', path: '/profile/payment' },
    { icon: Gift, label: 'E-Gift Cards', path: '#' },
  ];

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-28">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border bg-background">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="font-heading font-bold text-lg">Profile</h1>
      </div>

      <div className="flex items-center gap-4 px-4 py-5 border-b border-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {profileUser?.avatar_url
            ? <img src={profileUser.avatar_url} alt="" className="w-full h-full object-cover" />
            : <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-xl leading-tight truncate">{profileUser?.full_name || 'User'}</h2>
            <span className="text-[10px] uppercase font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {profileRole}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {profileUser?.phone || profileUser?.email || ''}
          </p>
        </div>
        {isCustomer && (
          <Link to="/profile/edit" className="text-xs text-primary font-semibold border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5">
            Edit
          </Link>
        )}
      </div>

      {isCustomer && (
        <>
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {topActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.path}
                  className="flex flex-col items-center gap-2 py-5 hover:bg-muted/40 active:bg-muted/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center bg-background">
                    <Icon className={`w-5 h-5 ${action.color}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight text-foreground">{action.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mx-4 mt-4 mb-2 bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Ballia Saathi Cash & Gift Card</p>
                  <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Available Balance <span className="font-bold text-foreground">₹0</span></p>
              <button className="text-xs font-bold border border-border bg-background rounded-xl px-4 py-2 hover:bg-muted transition-colors">
                Add Balance
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mx-4 mt-4 mb-2 flex flex-col gap-2">
        {isAdmin && (
          <Link to="/admin"
            className="flex items-center gap-3 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl px-4 py-3.5 hover:opacity-90 transition-opacity">
            <Shield className="w-5 h-5 text-accent" />
            <span className="flex-1 text-sm font-semibold text-accent">Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-accent/60" />
          </Link>
        )}
        {isRider && (
          <Link to="/rider"
            className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 hover:opacity-90 transition-opacity">
            <Truck className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm font-semibold text-primary">Rider Panel</span>
            <ChevronRight className="w-4 h-4 text-primary/60" />
          </Link>
        )}
      </div>

      {isCustomer && (
        <div className="mx-4 mt-3 mb-4">
          <h3 className="font-heading font-bold text-base mb-2 px-1">Your Information</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} to={item.path}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-muted/40 active:bg-muted/60 transition-colors border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-background shrink-0">
                    <Icon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] text-muted-foreground mr-1">{item.badge}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-4 mb-3">
        <div className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Dark Mode</p>
              <p className="text-[11px] text-muted-foreground">{isDark ? 'Currently dark' : 'Currently light'}</p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isDark ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <div className="mx-4">
        <button
          onClick={() => logout(true)}
          className="w-full py-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-center text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
        <p className="text-center text-[11px] text-muted-foreground mt-3 mb-2">Ballia Saathi v1.0.0</p>
      </div>
    </div>
  );
}
