import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCart, clearCart } from '@/lib/cartStore';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendOrderToWhatsApp } from '@/lib/whatsappOrder';
import { toast } from 'sonner';

// This page receives payment confirmation from UpiPayment and places the order
export default function UpiConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { paymentMethod = 'online', paymentApp } = location.state || {};

  const items = getCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= 199 ? 0 : 25;
  const total = subtotal + deliveryFee;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const orderNumber = 'ZPR' + Date.now().toString(36).toUpperCase();
      const addresses = await base44.entities.Address.filter({ user_email: user.email });
      const addr = addresses.find(a => a.is_default) || addresses[0];
      const deliveryAddress = addr ? `${addr.full_address}, ${addr.city}` : 'Address not set';
      return base44.entities.Order.create({
        order_number: orderNumber,
        items: items.map(i => ({ product_id: i.product_id, name: i.name, image_url: i.image_url, price: i.price, quantity: i.quantity, unit: i.unit })),
        subtotal, delivery_fee: deliveryFee, discount: 0, total,
        status: 'placed', payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        estimated_delivery: '20 minutes',
        user_email: user.email,
      });
    },
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      sendOrderToWhatsApp(order, '', '');
      toast.success(`Payment via ${paymentApp || 'UPI'} confirmed! Order placed.`);
      navigate(`/order/${order.id}`);
    },
    onError: () => {
      toast.error('Order failed, please try again');
      navigate('/checkout');
    },
  });

  useEffect(() => {
    placeOrder.mutate();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background flex-col gap-4">
      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Confirming your order...</p>
    </div>
  );
}