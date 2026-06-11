import { useParams, Link } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle2, Package, Truck, MapPin, Clock, Zap, Home, Printer, Phone, MessageCircle } from 'lucide-react';
import { printInvoice } from '@/components/invoice/PrintInvoice';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sendPushNotification, ORDER_STATUS_MESSAGES } from '@/lib/useNotifications';
import LiveMapWidget from '@/components/map/LiveMapWidget';

const statusSteps = [
  { key: 'placed', label: 'Order Placed', desc: 'Your order has been received', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Store confirmed your order', icon: CheckCircle2 },
  { key: 'packing', label: 'Packing', desc: 'Your items are being packed', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is heading to you', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Order delivered successfully!', icon: Home },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const prevStatus = useRef(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => localClient.entities.Order.filter({ id: orderId }),
    select: data => data[0],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!order) return;
    if (prevStatus.current && prevStatus.current !== order.status) {
      const msg = ORDER_STATUS_MESSAGES[order.status];
      if (msg) sendPushNotification(msg.title, msg.body);
    }
    prevStatus.current = order.status;
  }, [order?.status]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-[#0f0f1a]">
      <div className="w-8 h-8 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!order) return <div className="text-center py-20 text-white/50 bg-[#0f0f1a] min-h-screen">Order not found</div>;

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isOutForDelivery = order.status === 'out_for_delivery';

  const whatsappMsg = encodeURIComponent(
    `Namaste! Mera order ${order.order_number} ke baare mein poochna tha. Status: ${order.status?.replace(/_/g, ' ')}`
  );

  return (
    <div className="max-w-lg mx-auto pb-24 bg-[#0f0f1a] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 bg-[#0f0f1a] sticky top-0 z-10 border-b border-white/5">
        <Link to="/orders" className="p-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-lg text-white">Track Order</h1>
          <p className="text-xs text-white/40">#{order.order_number}</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ETA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-5 mb-5 ${isDelivered ? 'bg-green-500/20 border border-green-500/30' : isCancelled ? 'bg-red-500/20 border border-red-500/30' : 'bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isDelivered ? <Home className="w-5 h-5 text-green-400" /> : <Zap className="w-5 h-5 text-primary" />}
            <span className="font-heading font-bold text-lg text-white">
              {isCancelled ? 'Order Cancelled' : isDelivered ? 'Delivered! 🎉' : 'Arriving in ~20 min'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              {isDelivered
                ? `Delivered on ${format(new Date(order.updated_date), 'MMM d, h:mm a')}`
                : isCancelled ? 'Your order was cancelled'
                : 'Your order is on its way!'}
            </span>
          </div>
          {!isCancelled && (
            <div className="mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(10, ((currentStepIndex + 1) / statusSteps.length) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Order ID highlight box */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-0.5">Order ID</p>
            <p className="text-lg font-heading font-bold text-white">#{order.order_number}</p>
            <p className="text-xs text-white/40">Placed on {format(new Date(order.created_date), 'MMM d, yyyy')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={`https://wa.me/91XXXXXXXXXX?text=${whatsappMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href="tel:+91XXXXXXXXXX"
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          </div>
        </div>

        {/* Live Map */}
        {(isOutForDelivery || isDelivered) && (
          <div className="mb-5">
            <LiveMapWidget orderId={orderId} deliveryAddress={order.delivery_address} dark />
          </div>
        )}

        {/* Status Steps */}
        {!isCancelled && (
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5 mb-5">
            <h3 className="font-heading font-semibold text-sm text-white mb-4">Order Progress</h3>
            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-primary text-white' : 'bg-white/5 text-white/30'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </motion.div>
                      {i < statusSteps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-0.5 transition-colors duration-500 ${i < currentStepIndex ? 'bg-primary' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-white' : 'text-white/30'}`}>{step.label}</p>
                      <p className={`text-xs mt-0.5 ${isCurrent ? 'text-primary font-medium' : 'text-white/30'}`}>{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 text-center">
            <p className="font-semibold text-red-400">Order was cancelled</p>
            <p className="text-xs text-white/40 mt-1">Refund will be processed in 3-5 business days</p>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
          <h3 className="font-heading font-semibold text-sm text-white mb-3">Items ({order.items?.length || 0})</h3>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white/5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-white/40">{item.unit} × {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-white/40">
              <span>Subtotal</span><span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Delivery</span><span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
            </div>
            <div className="flex justify-between font-bold text-white">
              <span>Total</span><span>₹{order.total}</span>
            </div>
          </div>
          {order.delivery_address && (
            <div className="mt-3 flex items-start gap-2 text-xs text-white/40 bg-white/5 rounded-xl p-3">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>{order.delivery_address}</span>
            </div>
          )}
          <button
            onClick={() => printInvoice(order, null)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" /> Download Invoice
          </button>
        </div>

        {/* Support strip */}
        <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Order mein koi problem?</p>
            <p className="text-white/40 text-xs">WhatsApp pe turant help milegi</p>
          </div>
          <a
            href={`https://wa.me/91XXXXXXXXXX?text=${whatsappMsg}`}
            target="_blank" rel="noopener noreferrer"
            className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform shrink-0"
          >
            Chat
          </a>
        </div>
      </div>
    </div>
  );
}