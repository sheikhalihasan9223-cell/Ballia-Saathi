import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { localClient, logoUrl } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Package, CheckCircle2, Navigation, User, Truck,
  Wifi, WifiOff, ExternalLink, ChevronLeft, TrendingUp, Star, IndianRupee, Home, ShoppingBag, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { sendPushNotification, ORDER_STATUS_MESSAGES } from '@/lib/useNotifications';
import RiderMap from '@/components/rider/RiderMap';

const statusColors = {
  placed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  packing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  out_for_delivery: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const DELIVERY_FEE_PER_ORDER = 40;
const BONUS_THRESHOLD = 10;
const BONUS_AMOUNT = 200;

const TABS = [
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'map', label: 'Live Map', icon: MapPin },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function RiderPanel() {
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [currentCoords, setCurrentCoords] = useState(null);
  const watchIdRef = useRef(null);
  const locationDocRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    localClient.auth.me().then(u => {
      setRider(u);
      localClient.entities.RiderLocation.filter({ rider_email: u.email })
        .then(res => {
          if (res[0]) {
            locationDocRef.current = res[0];
            setIsOnline(res[0].is_online || false);
            if (res[0].is_online && res[0].lat) {
              setCurrentCoords({ lat: res[0].lat, lng: res[0].lng });
            }
          }
        });
    }).catch(() => {});
  }, []);

  // Fetch ALL orders that need attention — placed, confirmed, packing
  const { data: availableOrders = [], refetch: refetchAvailable } = useQuery({
    queryKey: ['rider-available'],
    queryFn: async () => {
      const [placed, confirmed, packing] = await Promise.all([
        localClient.entities.Order.filter({ status: 'placed' }),
        localClient.entities.Order.filter({ status: 'confirmed' }),
        localClient.entities.Order.filter({ status: 'packing' }),
      ]);
      return [...placed, ...confirmed, ...packing];
    },
    refetchInterval: 10000,
  });

  const { data: activeDeliveries = [] } = useQuery({
    queryKey: ['rider-active'],
    queryFn: () => localClient.entities.Order.filter({ status: 'out_for_delivery' }),
    refetchInterval: 8000,
  });

  const { data: deliveredOrders = [] } = useQuery({
    queryKey: ['rider-delivered'],
    queryFn: () => localClient.entities.Order.filter({ status: 'delivered' }),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, status }) => localClient.entities.Order.update(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      queryClient.invalidateQueries({ queryKey: ['rider-active'] });
      queryClient.invalidateQueries({ queryKey: ['rider-delivered'] });
      const msg = ORDER_STATUS_MESSAGES[vars.status];
      if (msg) sendPushNotification(msg.title, msg.body);
    }
  });

  const startTracking = (riderData) => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentCoords({ lat, lng });
        const data = {
          rider_email: riderData?.email,
          rider_name: riderData?.full_name || 'Rider',
          rider_phone: riderData?.phone || '',
          lat, lng,
          is_online: true,
          status: 'available',
          last_updated: new Date().toISOString(),
        };
        if (locationDocRef.current?.id) {
          await localClient.entities.RiderLocation.update(locationDocRef.current.id, data);
        } else {
          const created = await localClient.entities.RiderLocation.create(data);
          locationDocRef.current = created;
        }
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (locationDocRef.current?.id) {
      await localClient.entities.RiderLocation.update(locationDocRef.current.id, { is_online: false, status: 'offline' });
    }
    setCurrentCoords(null);
  };

  const toggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    if (next) { startTracking(rider); toast.success('You are now Online! 🟢'); }
    else { stopTracking(); toast.info('You are now Offline'); }
  };

  const acceptOrder = async (order) => {
    await updateOrder.mutateAsync({ id: order.id, status: 'out_for_delivery' });
    if (locationDocRef.current?.id) {
      await localClient.entities.RiderLocation.update(locationDocRef.current.id, {
        order_id: order.id,
        order_number: order.order_number,
        status: 'delivering'
      });
    }
    toast.success('Order accepted! Navigate to customer.');
  };

  const markDelivered = async (order) => {
    await updateOrder.mutateAsync({ id: order.id, status: 'delivered' });
    if (locationDocRef.current?.id) {
      await localClient.entities.RiderLocation.update(locationDocRef.current.id, {
        order_id: '', order_number: '', status: 'available'
      });
    }
    toast.success('Order marked as delivered! 🎉');
  };

  // Earnings calculations
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(new Date());
  const thisMonth = startOfMonth(new Date());

  const todayDeliveries = deliveredOrders.filter(o => new Date(o.updated_date) >= today);
  const weekDeliveries = deliveredOrders.filter(o => new Date(o.updated_date) >= thisWeek);
  const monthDeliveries = deliveredOrders.filter(o => new Date(o.updated_date) >= thisMonth);

  const todayEarnings = todayDeliveries.length * DELIVERY_FEE_PER_ORDER;
  const weekEarnings = weekDeliveries.length * DELIVERY_FEE_PER_ORDER;
  const monthEarnings = monthDeliveries.length * DELIVERY_FEE_PER_ORDER;
  const bonusEarned = Math.floor(weekDeliveries.length / BONUS_THRESHOLD) * BONUS_AMOUNT;

  return (
    <div className="min-h-screen bg-[#0a0a18] text-white max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a18]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <img src={logoUrl} alt="Ballia Saathi" className="w-9 h-9 rounded-xl object-cover bg-white" />
            <div>
              <h1 className="font-heading font-bold text-base text-white">Rider Panel</h1>
              <p className="text-[11px] text-white/40">{rider?.full_name || 'Delivery Partner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetchAvailable(); toast.success('Refreshed!'); }}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-bold text-xs transition-all ${
                isOnline
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'bg-white/5 border-white/15 text-white/40 hover:bg-white/10'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>

        {/* GPS pill */}
        {currentCoords && (
          <button
            onClick={() => window.open(`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`, '_blank')}
            className="mt-2.5 w-full flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 hover:bg-primary/15"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-primary flex-1 text-left">
              GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
            </span>
            <ExternalLink className="w-3 h-3 text-primary/50" />
          </button>
        )}

        {/* Active delivery banner */}
        {activeDeliveries.length > 0 && (
          <div className="mt-2.5 bg-orange-500/15 border border-orange-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs text-orange-400 font-semibold flex-1">
              {activeDeliveries.length} active delivery in progress
            </span>
            <button onClick={() => setActiveTab('orders')} className="text-[10px] text-orange-300 font-bold">View →</button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'orders' && (
          <OrdersTab
            isOnline={isOnline}
            availableOrders={availableOrders}
            activeDeliveries={activeDeliveries}
            onAccept={acceptOrder}
            onMarkDelivered={markDelivered}
            onToggleOnline={toggleOnline}
          />
        )}
        {activeTab === 'map' && (
          <MapTab currentCoords={currentCoords} isOnline={isOnline} />
        )}
        {activeTab === 'earnings' && (
          <EarningsTab
            todayCount={todayDeliveries.length}
            weekCount={weekDeliveries.length}
            monthCount={monthDeliveries.length}
            todayEarnings={todayEarnings}
            weekEarnings={weekEarnings}
            monthEarnings={monthEarnings}
            bonusEarned={bonusEarned}
            recentDeliveries={deliveredOrders.slice(0, 20)}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab rider={rider} isOnline={isOnline} totalDeliveries={deliveredOrders.length} monthEarnings={monthEarnings} />
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-[#0a0a18]/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-2 px-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const badgeCount = id === 'orders' ? availableOrders.length + activeDeliveries.length : 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all relative ${
                  isActive ? 'bg-primary/15' : 'hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-white/40'}`} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-white/40'}`}>{label}</span>
                {badgeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────────────
function OrdersTab({ isOnline, availableOrders, activeDeliveries, onAccept, onMarkDelivered, onToggleOnline }) {
  return (
    <div className="px-4 py-4 space-y-5">
      {!isOnline && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
          <WifiOff className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 font-bold text-lg">You're Offline</p>
          <p className="text-white/25 text-sm mt-1">Go online to start receiving orders</p>
          <button onClick={onToggleOnline} className="mt-5 px-8 py-3 bg-green-500 text-white font-bold rounded-2xl text-sm hover:bg-green-600 transition-colors">
            Go Online 🟢
          </button>
        </div>
      )}

      {isOnline && (
        <>
          {/* Active Deliveries */}
          {activeDeliveries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h2 className="text-sm font-bold text-orange-400">Active Delivery ({activeDeliveries.length})</h2>
              </div>
              <div className="space-y-3">
                {activeDeliveries.map(order => (
                  <OrderCard key={order.id} order={order} isActive onMarkDelivered={() => onMarkDelivered(order)} />
                ))}
              </div>
            </div>
          )}

          {/* Available Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white/60">New Orders ({availableOrders.length})</h2>
              {availableOrders.length > 0 && (
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                  ₹{DELIVERY_FEE_PER_ORDER} per delivery
                </span>
              )}
            </div>

            {availableOrders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <Package className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-sm font-medium">No orders right now</p>
                <p className="text-white/20 text-xs mt-1">New orders will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map(order => (
                  <OrderCard key={order.id} order={order} onAccept={() => onAccept(order)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ORDER CARD ────────────────────────────────────────────────────────────────
function OrderCard({ order, isActive, onAccept, onMarkDelivered }) {
  const openMaps = () => {
    const q = order.delivery_address || 'Ballia, UP';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${isActive ? 'bg-orange-500/10 border-orange-500/25' : 'bg-[#1a1a2e] border-white/10'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-white">#{order.order_number}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{format(new Date(order.created_date), 'MMM d, h:mm a')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">+₹{DELIVERY_FEE_PER_ORDER}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Items summary */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} className="bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50">
            {item.name} ×{item.quantity}
          </div>
        ))}
        {(order.items?.length || 0) > 3 && (
          <div className="bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/40">+{order.items.length - 3} more</div>
        )}
      </div>

      {/* Order value */}
      <div className="flex items-center gap-3 mb-3 bg-white/5 rounded-xl px-3 py-2">
        <ShoppingBag className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/60 flex-1">{order.items?.length || 0} items</span>
        <span className="text-sm font-bold text-white">₹{order.total}</span>
        <span className="text-[10px] text-white/40">({order.payment_method?.toUpperCase() || 'COD'})</span>
      </div>

      {/* Delivery address */}
      {order.delivery_address && (
        <button
          onClick={openMaps}
          className="w-full flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 mb-3 hover:bg-white/10 transition-colors text-left"
        >
          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-xs text-white/70 flex-1 leading-snug">{order.delivery_address}</span>
          <ExternalLink className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={openMaps}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" /> Navigate
        </button>
        {isActive ? (
          <button
            onClick={onMarkDelivered}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
          </button>
        ) : (
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" /> Accept
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── MAP TAB ───────────────────────────────────────────────────────────────────
function MapTab({ currentCoords, isOnline }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white">Live Location</h2>
        {isOnline && currentCoords && (
          <button
            onClick={() => window.open(`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`, '_blank')}
            className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-semibold"
          >
            <ExternalLink className="w-3 h-3" /> Open in Google Maps
          </button>
        )}
      </div>
      <RiderMap currentCoords={currentCoords} isOnline={isOnline} />
      {!isOnline && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 text-center">
          <WifiOff className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">Go online to activate live tracking</p>
        </div>
      )}
      {isOnline && currentCoords && (
        <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Latitude</span>
            <span className="text-xs font-mono text-white font-semibold">{currentCoords.lat.toFixed(6)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Longitude</span>
            <span className="text-xs font-mono text-white font-semibold">{currentCoords.lng.toFixed(6)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Status</span>
            <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live GPS Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EARNINGS TAB ──────────────────────────────────────────────────────────────
function EarningsTab({ todayCount, weekCount, monthCount, todayEarnings, weekEarnings, monthEarnings, bonusEarned, recentDeliveries }) {
  const [period, setPeriod] = useState('week');

  const stats = {
    today: { count: todayCount, earnings: todayEarnings, label: 'Today' },
    week: { count: weekCount, earnings: weekEarnings, label: 'This Week' },
    month: { count: monthCount, earnings: monthEarnings, label: 'This Month' },
  };
  const current = stats[period];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Period selector */}
      <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
        {['today', 'week', 'month'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              period === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Main earnings card */}
      <div className="bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 border border-primary/30 rounded-3xl p-6 text-center">
        <p className="text-white/60 text-sm font-medium mb-1">{current.label} Earnings</p>
        <p className="text-5xl font-heading font-bold text-white">₹{current.earnings}</p>
        <p className="text-white/40 text-xs mt-2">{current.count} deliveries × ₹{DELIVERY_FEE_PER_ORDER}</p>
        {bonusEarned > 0 && (
          <div className="mt-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-4 py-2 inline-block">
            <p className="text-yellow-400 text-xs font-bold">🎉 Bonus Earned: +₹{bonusEarned}</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Deliveries', value: current.count, icon: Package, color: 'text-primary' },
          { label: 'Per Order', value: `₹${DELIVERY_FEE_PER_ORDER}`, icon: IndianRupee, color: 'text-green-400' },
          { label: 'Bonus', value: `₹${bonusEarned}`, icon: Star, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-3 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Bonus progress */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white">Weekly Bonus Progress</p>
          <p className="text-xs text-yellow-400 font-bold">+₹{BONUS_AMOUNT} at {BONUS_THRESHOLD} deliveries</p>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((weekCount % BONUS_THRESHOLD) / BONUS_THRESHOLD * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-white/30 mt-1.5">{weekCount % BONUS_THRESHOLD}/{BONUS_THRESHOLD} deliveries to next bonus</p>
      </div>

      {/* Recent deliveries */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Recent Deliveries</h3>
        {recentDeliveries.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <p className="text-white/30 text-sm">No deliveries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDeliveries.map(order => (
              <div key={order.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">#{order.order_number}</p>
                  <p className="text-[11px] text-white/40">
                    {order.updated_date ? format(new Date(order.updated_date), 'MMM d, h:mm a') : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-400">+₹{DELIVERY_FEE_PER_ORDER}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE TAB ───────────────────────────────────────────────────────────────
function ProfileTab({ rider, isOnline, totalDeliveries, monthEarnings }) {
  const navigate = useNavigate();

  const rating = 4.8;
  const acceptance = totalDeliveries > 0 ? 95 : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-3xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            {rider?.avatar_url
              ? <img src={rider.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <User className="w-7 h-7 text-primary" />
            }
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-lg text-white">{rider?.full_name || 'Rider'}</h2>
            <p className="text-xs text-white/40">{rider?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Rating', value: rating, suffix: '⭐', color: 'text-yellow-400' },
            { label: 'Deliveries', value: totalDeliveries, suffix: '', color: 'text-white' },
            { label: 'Acceptance', value: `${acceptance}%`, suffix: '', color: 'text-green-400' },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="bg-black/20 rounded-2xl p-3 text-center">
              <p className={`text-lg font-bold ${color}`}>{value}{suffix}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings summary */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">This Month</h3>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">₹{monthEarnings}</span>
          <span className="text-xs text-white/40 mb-1">earnings</span>
        </div>
        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${Math.min(monthEarnings / 200, 100)}%` }} />
        </div>
        <p className="text-[10px] text-white/30 mt-1">Monthly target: ₹5,000</p>
      </div>

      {/* Performance */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-white">Performance</h3>
        {[
          { label: 'Customer Rating', value: rating, max: 5, pct: (rating / 5) * 100, color: 'from-yellow-400 to-orange-400' },
          { label: 'Acceptance Rate', value: `${acceptance}%`, max: 100, pct: acceptance, color: 'from-green-400 to-emerald-500' },
          { label: 'On-time Delivery', value: '92%', max: 100, pct: 92, color: 'from-primary to-accent' },
        ].map(({ label, value, pct, color }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/50">{label}</span>
              <span className="text-xs text-white font-bold">{value}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle info */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">Rider Details</h3>
        {[
          { label: 'Name', value: rider?.full_name || '—' },
          { label: 'Email', value: rider?.email || '—' },
          { label: 'Phone', value: rider?.phone || 'Not set' },
          { label: 'Member Since', value: rider?.created_date ? format(new Date(rider.created_date), 'MMM yyyy') : '—' },
          { label: 'Role', value: rider?.role || 'rider' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-white/40">{label}</span>
            <span className="text-xs text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Back to app */}
      <button
        onClick={() => navigate('/')}
        className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
      >
        <Home className="w-4 h-4" /> Back to Main App
      </button>
    </div>
  );
}
