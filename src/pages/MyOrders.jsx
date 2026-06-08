import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { format } from 'date-fns';
import { sendPushNotification, ORDER_STATUS_MESSAGES } from '@/lib/useNotifications';

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const prevStatuses = useRef({});
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  // Real-time notifications when order status changes
  useEffect(() => {
    if (!orders.length) return;
    orders.forEach(order => {
      const prev = prevStatuses.current[order.id];
      if (prev && prev !== order.status) {
        const msg = ORDER_STATUS_MESSAGES[order.status];
        if (msg) sendPushNotification(msg.title, msg.body);
      }
      prevStatuses.current[order.id] = order.status;
    });
  }, [orders]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/profile" className="p-2 rounded-xl bg-muted hover:bg-muted/80">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading font-bold text-lg">My Orders</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/order/${order.id}`}
              className="bg-card rounded-2xl border border-border p-4 block hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading font-semibold text-sm">#{order.order_number}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-primary/10 text-primary'
                }`}>
                  {order.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {order.items?.slice(0, 3).map((item, i) => (
                  <img key={i} src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ))}
                {(order.items?.length || 0) > 3 && (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(order.created_date), 'MMM d, h:mm a')}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">₹{order.total}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}