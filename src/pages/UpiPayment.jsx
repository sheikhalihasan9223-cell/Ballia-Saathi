import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const UPI_APPS = [
  {
    name: 'PhonePe',
    color: '#5f259f',
    bg: '#f0e8ff',
    icon: '📲',
    // PhonePe uses intent URL on mobile, fallback to upi://
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=com.phonepe.app;end`,
  },
  {
    name: 'Google Pay',
    color: '#1a73e8',
    bg: '#e8f0fe',
    icon: '🇬',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://upi/pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
  },
  {
    name: 'Paytm',
    color: '#00BAF2',
    bg: '#e0f7fd',
    icon: '💳',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://upi/pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=net.one97.paytm;end`,
  },
  {
    name: 'BHIM UPI',
    color: '#004B8D',
    bg: '#e0ecf8',
    icon: '🏦',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://upi/pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
  },
  {
    name: 'Amazon Pay',
    color: '#FF9900',
    bg: '#fff4e0',
    icon: '📦',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://upi/pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=in.amazon.mShop.android.shopping;end`,
  },
  {
    name: 'WhatsApp Pay',
    color: '#25D366',
    bg: '#e4f9ed',
    icon: '💬',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
    intentUrl: (amount, upi) => `intent://upi/pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order#Intent;scheme=upi;package=com.whatsapp;end`,
  },
  {
    name: 'Other UPI App',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: '📱',
    deeplink: (amount, upi) => `upi://pay?pa=${upi}&pn=BalliaSaathi&am=${amount}&cu=INR&tn=BalliaSaathi+Order`,
  },
];

const MERCHANT_UPI_ID = '9264988023ali@slc';

export default function UpiPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount = 0, onSuccessPath = '/', orderData } = location.state || {};
  const [selected, setSelected] = useState(null);
  const [launched, setLaunched] = useState(false);

  const handleSelectApp = (app) => {
    setSelected(app.name);
    // Use Android intent URL if available (opens specific app), else generic upi:// deeplink
    const isAndroid = /android/i.test(navigator.userAgent);
    const url = (isAndroid && app.intentUrl)
      ? app.intentUrl(amount, MERCHANT_UPI_ID)
      : app.deeplink(amount, MERCHANT_UPI_ID);
    window.location.href = url;
    setLaunched(true);
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted hover:bg-muted/80 active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-lg">Pay via UPI</h1>
          <p className="text-xs text-muted-foreground">Choose your preferred UPI app</p>
        </div>
      </div>

      {/* Amount Banner */}
      <div className="mx-4 mt-5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Total Amount to Pay</p>
        <p className="font-heading font-extrabold text-4xl text-primary">₹{amount}</p>
        <p className="text-xs text-muted-foreground mt-2">Paying to: <span className="font-semibold text-foreground">Ballia Saathi</span></p>
        <p className="text-[10px] text-muted-foreground">UPI: {MERCHANT_UPI_ID}</p>
      </div>

      {/* UPI Apps Grid */}
      <div className="px-4 mt-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select Payment App</p>
        <div className="grid grid-cols-2 gap-3">
          {UPI_APPS.map((app, i) => (
            <motion.button
              key={app.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelectApp(app)}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left ${
                selected === app.name
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: app.bg }}
              >
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight" style={{ color: app.color }}>{app.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tap to open</p>
              </div>
              {selected === app.name && (
                <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* After launching app — confirmation */}
      {launched && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-5"
        >
          <p className="font-heading font-bold text-base text-green-700 dark:text-green-400 mb-1">
            🚀 Payment App Opened
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Complete your payment of <strong>₹{amount}</strong> in the app. Once done, tap the button below.
          </p>
          <button
            onClick={() => {
              // Place order as online payment confirmed
              navigate(onSuccessPath, { state: { paymentMethod: 'online', paymentApp: selected, orderData } });
            }}
            className="w-full py-3 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-98 transition-all"
          >
            ✅ I've Completed the Payment
          </button>
          <button
            onClick={() => { setSelected(null); setLaunched(false); }}
            className="w-full mt-2 py-2.5 rounded-2xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Try another app
          </button>
        </motion.div>
      )}

      {/* Security note */}
      <div className="mx-4 mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>🔒</span>
        <span>100% Secure Payment · Powered by UPI</span>
      </div>
    </div>
  );
}
