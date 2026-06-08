import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, getCartTotal, clearCart } from '@/lib/cartStore';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, Tag, Zap, ChevronRight, ShoppingBag, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Cart() {
  const [items, setItems] = useState(getCart());
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener('cart-updated', sync);
    return () => window.removeEventListener('cart-updated', sync);
  }, []);

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.filter({ is_active: true }),
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 199 ? 0 : 25;
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = Math.min((subtotal * appliedCoupon.discount_value) / 100, appliedCoupon.max_discount || Infinity);
    } else {
      discount = appliedCoupon.discount_value;
    }
  }
  const total = subtotal + deliveryFee - discount;

  const applyCoupon = () => {
    const coupon = coupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    if (!coupon) {
      toast.error('Invalid coupon code');
      return;
    }
    if (subtotal < (coupon.min_order || 0)) {
      toast.error(`Minimum order amount is ₹${coupon.min_order}`);
      return;
    }
    setAppliedCoupon(coupon);
    toast.success(`Coupon "${coupon.code}" applied!`);
  };

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const orderNumber = 'ZPR' + Date.now().toString(36).toUpperCase();
      return base44.entities.Order.create({
        order_number: orderNumber,
        items: items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          image_url: i.image_url,
          price: i.price,
          quantity: i.quantity,
          unit: i.unit,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        status: 'placed',
        payment_method: 'online',
        coupon_code: appliedCoupon?.code || '',
        estimated_delivery: '20 minutes',
        user_email: user.email,
      });
    },
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/order/${order.id}`);
      toast.success('Order placed successfully!');
    },
  });

  if (!items.length) {
    return (
      <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="font-heading font-bold text-xl">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Add some items to get started</p>
        <Link to="/">
          <Button className="rounded-2xl">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-44">
      <h1 className="font-heading font-bold text-xl mb-4">Cart ({items.length})</h1>

      {/* Items */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.product_id}
              layout
              exit={{ opacity: 0, x: -100 }}
              className="bg-card rounded-2xl border border-border p-3 flex gap-3"
            >
              <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Coupon */}
      <div className="mt-6 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Apply Coupon</span>
        </div>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <div>
              <span className="font-bold text-sm text-primary">{appliedCoupon.code}</span>
              <span className="text-xs text-muted-foreground ml-2">-₹{discount.toFixed(0)}</span>
            </div>
            <button onClick={() => setAppliedCoupon(null)} className="text-xs text-destructive font-medium">Remove</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              className="rounded-xl h-10"
            />
            <Button onClick={applyCoupon} variant="outline" className="rounded-xl h-10 shrink-0">
              Apply
            </Button>
          </div>
        )}
        {/* Show available coupons */}
        <div className="mt-3 space-y-1.5">
          {coupons.slice(0, 2).map(c => (
            <button
              key={c.id}
              onClick={() => { setCouponCode(c.code); }}
              className="w-full text-left flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
            >
              <Tag className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium">{c.code}</span>
              <span className="text-[10px] text-muted-foreground">— {c.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Banner */}
      {discount > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-green-700 text-sm font-semibold">🎉 Yay! You saved ₹{discount.toFixed(0)} on this order</span>
          <ChevronRight className="w-4 h-4 text-green-600" />
        </div>
      )}

      {/* Bill Summary - Zepto Style */}
      <div className="mt-4 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Tag className="w-4 h-4 text-foreground" />
          </div>
          <h3 className="font-heading font-bold text-sm">Bill Summary</h3>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item Total</span>
            <span>
              {discount > 0 && <span className="line-through text-muted-foreground mr-1 text-xs">₹{(subtotal + discount).toFixed(0)}</span>}
              ₹{subtotal.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Delivery Fee</span>
              {deliveryFee > 0 && (
                <p className="text-[10px] text-primary">Free above ₹199 · Add ₹{Math.max(0, 199 - subtotal)} more</p>
              )}
            </div>
            <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Handling Fee</span>
            <span className="text-green-600 font-semibold">FREE</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Coupon Discount</span>
              <span>-₹{discount.toFixed(0)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2.5 flex justify-between">
            <span className="font-bold text-base">To Pay</span>
            <span className="font-bold text-base">₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Savings Breakdown */}
      {discount > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-sm text-green-800">Savings on this order</span>
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg">₹{discount.toFixed(0)}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white">%</span>
                <div>
                  <p className="text-green-800 font-medium text-xs">Discount on MRP</p>
                  <p className="text-green-600 text-[10px]">Including coupon savings</p>
                </div>
              </div>
              <span className="text-green-800 font-bold text-sm">₹{discount.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Special Offers */}
      <div className="mt-4 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Special offers for you</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div className="min-w-[160px] bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-xs font-bold text-primary">Deals for you</p>
            <p className="text-[10px] text-primary/70 font-medium uppercase mt-0.5">UNLOCKED</p>
            <div className="mt-2 h-1 bg-primary/20 rounded-full"><div className="h-1 bg-primary rounded-full w-full" /></div>
          </div>
          <div className="min-w-[160px] bg-accent/5 border border-accent/20 rounded-xl p-3">
            <p className="text-xs font-bold text-accent">Special Offer</p>
            <p className="text-[10px] text-accent/70 font-medium uppercase mt-0.5">UNLOCKED</p>
            <div className="mt-2 h-1 bg-accent/20 rounded-full"><div className="h-1 bg-accent rounded-full w-3/4" /></div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom: Go to Payment */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => navigate('/checkout')}
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl"
          >
            <Zap className="w-5 h-5 mr-2 fill-current" />
            Go to Payment — ₹{total.toFixed(0)}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}