import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, clearCart } from '@/lib/cartStore';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, MapPin, Navigation, Zap, Plus, CheckCircle2, Home, Briefcase } from 'lucide-react';
import { sendOrderToWhatsApp } from '@/lib/whatsappOrder';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const items = getCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= 199 ? 0 : 25;
  const [codConfirmed, setCodConfirmed] = useState(false);
  const COD_CHARGE = 10;
  const codFee = codConfirmed ? COD_CHARGE : 0;
  const total = subtotal + deliveryFee + codFee;

  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '' });
  const [locLoading, setLocLoading] = useState(false);
  const [showCodPopup, setShowCodPopup] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) { setUserEmail(u.email); setUserName(u.full_name || ''); setForm(f => ({ ...f, name: u.full_name || '' })); }
    });
  }, []);

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['checkout-addresses', userEmail],
    queryFn: () => base44.entities.Address.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    onSuccess: (data) => {
      if (data.length > 0 && !selectedAddressId) {
        const def = data.find(a => a.is_default) || data[0];
        setSelectedAddressId(def.id);
        setShowNewForm(false);
      } else if (data.length === 0) {
        setShowNewForm(true);
      }
    }
  });

  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const def = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      setSelectedAddressId(def.id);
    } else if (savedAddresses.length === 0) {
      setShowNewForm(true);
    }
  }, [savedAddresses]);

  const fetchLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const addr = data.address;
          setForm(f => ({
            ...f,
            address: `${addr.road || ''} ${addr.neighbourhood || addr.suburb || ''}`.trim(),
            city: addr.city || addr.town || addr.village || '',
            pincode: addr.postcode || '',
          }));
          toast.success('Location fetched!');
        } catch { toast.error('Could not fetch address'); }
        setLocLoading(false);
      },
      () => { toast.error('Location access denied'); setLocLoading(false); }
    );
  };

  const saveAndSelectAddress = async () => {
    if (!form.address || !form.city) { toast.error('Please fill address and city'); return null; }
    const newAddr = await base44.entities.Address.create({
      user_email: userEmail,
      full_address: form.address,
      city: form.city,
      pincode: form.pincode,
      label: 'home',
      is_default: savedAddresses.length === 0,
    });
    queryClient.invalidateQueries({ queryKey: ['checkout-addresses', userEmail] });
    queryClient.invalidateQueries({ queryKey: ['home-addresses', userEmail] });
    return newAddr;
  };

  const placeOrderMutation = useMutation({
    mutationFn: async (paymentMethod) => {
      const user = await base44.auth.me();
      const orderNumber = 'ZPR' + Date.now().toString(36).toUpperCase();

      let deliveryAddress = '';
      if (showNewForm || !selectedAddressId) {
        const saved = await saveAndSelectAddress();
        if (!saved) throw new Error('Address required');
        deliveryAddress = `${form.address}, ${form.city}${form.pincode ? ' - ' + form.pincode : ''}`;
      } else {
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        deliveryAddress = `${addr.full_address}, ${addr.city}${addr.pincode ? ' - ' + addr.pincode : ''}`;
      }

      return base44.entities.Order.create({
        order_number: orderNumber,
        items: items.map(i => ({
          product_id: i.product_id, name: i.name, image_url: i.image_url,
          price: i.price, quantity: i.quantity, unit: i.unit,
        })),
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
      // Send order to WhatsApp automatically
      sendOrderToWhatsApp(order, form.name, form.phone);
      navigate(`/order/${order.id}`);
      toast.success('Order placed! Opening WhatsApp...');
      import('@/lib/useNotifications').then(({ sendPushNotification, ORDER_STATUS_MESSAGES }) => {
        const msg = ORDER_STATUS_MESSAGES['placed'];
        if (msg) sendPushNotification(msg.title, msg.body);
      });
    },
  });

  const handlePay = (method) => {
    if (!form.name || !form.phone) { toast.error('Please fill name and phone'); return; }
    if (showNewForm && !form.address) { toast.error('Please fill the address'); return; }
    if (!showNewForm && !selectedAddressId) { toast.error('Please select a delivery address'); return; }
    if (method === 'cod') { setShowCodPopup(true); return; }
    placeOrderMutation.mutate(method);
  };

  const handleUpiPay = () => {
    if (!form.name || !form.phone) { toast.error('Please fill name and phone'); return; }
    if (showNewForm && !form.address) { toast.error('Please fill the address'); return; }
    if (!showNewForm && !selectedAddressId) { toast.error('Please select a delivery address'); return; }
    navigate('/upi-payment', { state: { amount: total, onSuccessPath: '/upi-confirm', orderData: { form, showNewForm, selectedAddressId } } });
  };

  const confirmCod = () => {
    setShowCodPopup(false);
    placeOrderMutation.mutate('cod');
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10 min-h-screen bg-background">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cart')} className="p-2 rounded-xl bg-muted hover:bg-muted/80">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-xl">Checkout</h1>
      </div>

      {/* Contact Details */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <h2 className="font-heading font-semibold text-base mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Contact Details
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="text-primary text-xs font-semibold">Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 bg-muted/40 rounded-xl" placeholder="Your full name" />
          </div>
          <div>
            <Label className="text-primary text-xs font-semibold">Mobile Number *</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="mt-1 bg-muted/40 rounded-xl" placeholder="10-digit mobile number" type="tel" />
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <h2 className="font-heading font-semibold text-base mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Delivery Address
        </h2>

        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-2 mb-3">
            {savedAddresses.map(addr => {
              const Icon = addr.label === 'work' ? Briefcase : Home;
              return (
                <button
                  key={addr.id}
                  onClick={() => { setSelectedAddressId(addr.id); setShowNewForm(false); }}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedAddressId === addr.id && !showNewForm
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selectedAddressId === addr.id && !showNewForm ? 'bg-primary text-white' : 'bg-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold capitalize">{addr.label} {addr.is_default && <span className="text-primary">(Default)</span>}</p>
                    <p className="text-xs text-muted-foreground truncate">{addr.full_address}, {addr.city} {addr.pincode}</p>
                  </div>
                  {selectedAddressId === addr.id && !showNewForm && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Add new address toggle */}
        <button
          onClick={() => { setShowNewForm(!showNewForm); if (!showNewForm) setSelectedAddressId(null); }}
          className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
            showNewForm ? 'border-primary bg-primary/5 text-primary' : 'border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary'
          }`}
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>

        {/* New address form */}
        {showNewForm && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-primary text-xs font-semibold">Address *</Label>
                <button onClick={fetchLocation} disabled={locLoading}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80">
                  <Navigation className="w-3 h-3" />
                  {locLoading ? 'Fetching...' : 'Auto Fetch'}
                </button>
              </div>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="bg-muted/40 rounded-xl" placeholder="House no, Street, Area" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary text-xs font-semibold">City *</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  className="mt-1 bg-muted/40 rounded-xl" placeholder="City" />
              </div>
              <div>
                <Label className="text-primary text-xs font-semibold">Pincode</Label>
                <Input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })}
                  className="mt-1 bg-muted/40 rounded-xl" placeholder="Pincode" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bill */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <h3 className="font-heading font-semibold text-sm mb-3">Bill Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
          </div>
          {codConfirmed && (
            <div className="flex justify-between"><span className="text-muted-foreground">COD Charge</span><span>₹{COD_CHARGE}</span></div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
            <span>To Pay</span><span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* COD Popup */}
      {showCodPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm">
            <div className="text-3xl text-center mb-3">💵</div>
            <h3 className="font-heading font-bold text-lg text-center mb-1">Cash on Delivery</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              A small COD handling charge of <strong className="text-foreground">₹{COD_CHARGE}</strong> will be added to your order total.
            </p>
            <div className="bg-muted/50 rounded-2xl p-3 mb-5 text-sm">
              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Order Total</span><span>₹{subtotal + deliveryFee}</span></div>
              <div className="flex justify-between mb-1"><span className="text-muted-foreground">COD Charge</span><span>+ ₹{COD_CHARGE}</span></div>
              <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Final Total</span><span>₹{subtotal + deliveryFee + COD_CHARGE}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCodPopup(false)}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => { setCodConfirmed(true); confirmCod(); }}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Options */}
      <h2 className="font-heading font-bold text-base mb-3">Choose Payment</h2>
      <div className="space-y-3">
        {/* Cash on Delivery */}
        <button
          onClick={() => handlePay('cod')}
          disabled={placeOrderMutation.isPending}
          className="w-full bg-card border-2 border-border hover:border-primary rounded-2xl p-4 flex items-center gap-4 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">💵</div>
          <div className="text-left">
            <p className="font-heading font-bold text-base">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 ml-auto group-hover:text-primary" />
        </button>

        {/* UPI */}
        <button
          onClick={() => handleUpiPay()}
          disabled={placeOrderMutation.isPending}
          className="w-full bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/30 hover:border-primary rounded-2xl p-4 flex items-center gap-4 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="font-heading font-extrabold text-primary text-sm">UPI</span>
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-base">Pay by UPI</p>
            <p className="text-xs text-muted-foreground">GPay • PhonePe • Paytm • MobiKwik</p>
            <div className="flex gap-1 mt-1">
              {['📲','🇬','💳','💸'].map((e,i) => <span key={i} className="text-sm">{e}</span>)}
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 ml-auto group-hover:text-primary" />
        </button>
      </div>

      {placeOrderMutation.isPending && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Placing order...</span>
        </div>
      )}

      {/* Instant Order at bottom */}
      <div className="mt-6 bg-muted/50 rounded-2xl p-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-primary fill-primary" />
        <div>
          <p className="text-sm font-semibold">Instant Order</p>
          <p className="text-xs text-muted-foreground">Pay while we deliver — select Cash on Delivery above</p>
        </div>
      </div>
    </div>
  );
}