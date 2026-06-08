import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, MapPin, User, Phone, Mail, Package, Printer, Navigation, ExternalLink } from 'lucide-react';
import LiveMapWidget from '@/components/map/LiveMapWidget';
import { printInvoice } from '@/components/invoice/PrintInvoice';

const statuses = ['placed', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

const statusColors = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  packing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['admin-addresses'],
    queryFn: () => base44.entities.Address.list('-created_date', 200),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
      // Trigger notification for the customer
      import('@/lib/useNotifications').then(({ sendPushNotification, ORDER_STATUS_MESSAGES }) => {
        const msg = ORDER_STATUS_MESSAGES[vars.status];
        if (msg) sendPushNotification(msg.title, msg.body);
      });
    },
  });

  const getUserForOrder = (order) => users.find(u => u.email === order.user_email);
  const getAddressesForOrder = (order) => addresses.filter(a => a.user_email === order.user_email);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="font-heading font-bold text-xl mb-6">Orders ({orders.length})</h1>

      <div className="space-y-3">
        {orders.map(order => {
          const isExpanded = expandedId === order.id;
          const user = getUserForOrder(order);
          const userAddresses = getAddressesForOrder(order);

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header row */}
                <button
                  className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-sm">#{order.order_number}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.user_email} · {format(new Date(order.created_date), 'MMM d, h:mm a')}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1">
                            {item.image_url && <img src={item.image_url} alt="" className="w-5 h-5 rounded object-cover" />}
                            <span className="text-[10px]">{item.name} x{item.quantity}</span>
                          </div>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm">₹{order.total}</p>
                      <Select
                        value={order.status}
                        onValueChange={(status) => updateStatus.mutate({ id: order.id, status })}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs rounded-lg" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                    {/* User Info */}
                    <div className="bg-card rounded-xl p-3 border border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer Details</p>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{user?.full_name || order.user_email}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {order.user_email}</p>
                        {user?.phone
                          ? <a href={`tel:${user.phone}`} className="text-xs text-primary flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone}</a>
                          : <p className="text-xs text-muted-foreground italic">No phone on file</p>
                        }
                      </div>
                    </div>

                    {/* Delivery Address + Live Map */}
                    <div className="bg-card rounded-xl p-3 border border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Delivery Location</p>
                      {order.delivery_address ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 hover:text-primary/80 mb-3"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          {order.delivery_address}
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground mb-3">No address recorded</p>
                      )}
                      {/* Live map for out_for_delivery orders */}
                      {order.status === 'out_for_delivery' && (
                        <div onClick={e => e.stopPropagation()}>
                          <LiveMapWidget orderId={order.id} deliveryAddress={order.delivery_address} dark={false} />
                        </div>
                      )}
                      {userAddresses.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-[10px] text-muted-foreground mb-1">Saved addresses:</p>
                          {userAddresses.map((addr, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• [{addr.label}] {addr.full_address}, {addr.city} {addr.pincode}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* All items */}
                    <div className="bg-card rounded-xl p-3 border border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> All Items</p>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-muted" />}
                            <div className="flex-1">
                              <p className="text-xs font-medium">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">{item.unit} × {item.quantity}</p>
                            </div>
                            <span className="text-xs font-bold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                          <span>Total</span><span>₹{order.total}</span>
                        </div>
                        {order.payment_method && (
                          <p className="text-xs text-muted-foreground">Payment: {order.payment_method.toUpperCase()}</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); printInvoice(order, getUserForOrder(order)); }}
                          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No orders yet</p>
        )}
      </div>
    </div>
  );
}