const WA_NUMBER = '919565189483';

export function sendOrderToWhatsApp(order, customerName, customerPhone) {
  const itemLines = order.items
    .map(item => `  ${item.quantity} x ${item.name}`)
    .join('\n');

  const message = `🛒 *New Order — Ballia Saathi*

👤 *Name:* ${customerName || 'N/A'}
📱 *Phone:* ${customerPhone || 'N/A'}

📦 *Items:*
${itemLines}

💰 *Total:* ₹${order.total}
🚚 *Address:* ${order.delivery_address || 'N/A'}
💳 *Payment:* ${order.payment_method?.toUpperCase() || 'N/A'}
🔖 *Order ID:* #${order.order_number}

_Ballia Saathi — Aapka Grocery, 20 minute mein!_`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}