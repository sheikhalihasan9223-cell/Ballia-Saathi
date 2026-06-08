import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bs_notifications';

export function getStoredNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function addStoredNotification(notif) {
  const existing = getStoredNotifications();
  const updated = [{ ...notif, id: Date.now(), read: false, ts: new Date().toISOString() }, ...existing].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('notifications-updated'));
}

export function markAllRead() {
  const existing = getStoredNotifications();
  const updated = existing.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('notifications-updated'));
}

export function sendPushNotification(title, body, icon = '/favicon.ico') {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon });
    } catch (e) {}
  }
  addStoredNotification({ title, body });
}

// Marketing notifications — call these from admin or scheduled
export const MARKETING_NOTIFICATIONS = [
  { title: '🥦 Taaza Sabzi Aayi!', body: 'Fresh vegetables just arrived — order now for same-day delivery!' },
  { title: '🎉 Weekend Offer Shuru!', body: 'Up to 40% off on groceries this weekend. Limited stock!' },
  { title: '🥛 Amul Milk Back in Stock', body: 'Amul Milk is available again. Order before it runs out!' },
  { title: '💸 New Discount Available!', body: 'Use code BALLIA20 for ₹20 off on orders above ₹199.' },
];

export function sendMarketingNotification(index = 0) {
  const notif = MARKETING_NOTIFICATIONS[index % MARKETING_NOTIFICATIONS.length];
  sendPushNotification(notif.title, notif.body);
}

// Map order status → notification text
export const ORDER_STATUS_MESSAGES = {
  placed: { title: '✅ Order Placed!', body: 'Your order has been received and is being processed.' },
  confirmed: { title: '🏪 Order Confirmed!', body: 'The store has confirmed your order. Packing will begin shortly.' },
  packing: { title: '📦 Order Being Packed', body: 'Your items are being carefully packed for delivery.' },
  out_for_delivery: { title: '🛵 Out for Delivery!', body: 'Your delivery agent is on the way. Arriving in ~20 minutes!' },
  delivered: { title: '🎉 Order Delivered!', body: 'Your order has been delivered. Enjoy your groceries!' },
  cancelled: { title: '❌ Order Cancelled', body: 'Your order has been cancelled. Refund in 3–5 business days.' },
};

export function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission || 'default');
  const [notifications, setNotifications] = useState(getStoredNotifications());

  useEffect(() => {
    const handler = () => setNotifications(getStoredNotifications());
    window.addEventListener('notifications-updated', handler);
    return () => window.removeEventListener('notifications-updated', handler);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      sendPushNotification('🎉 Welcome to Ballia Saathi!', 'You\'ll now receive order updates & flash sale alerts.');
    }
    return result;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { permission, requestPermission, notifications, unreadCount, markAllRead };
}