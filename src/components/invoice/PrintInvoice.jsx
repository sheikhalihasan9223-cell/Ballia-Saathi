import { format } from 'date-fns';

export function printInvoice(order, user) {
  const discount = order.discount || 0;
  const deliveryFee = order.delivery_fee || 0;
  const subtotal = order.subtotal || (order.total - deliveryFee + discount);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #222; background: #fff; padding: 40px; }
    .company { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; }
    .company h1 { font-size: 32px; font-weight: 900; color: #7c3aed; letter-spacing: 1px; }
    .company p { font-size: 13px; color: #666; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #555; }
    .section-title { font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .customer-box { background: #f9f6ff; border: 1px solid #e5d9ff; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .customer-box p { font-size: 13px; margin-bottom: 4px; }
    .customer-box strong { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #7c3aed; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr { border-bottom: 1px solid #f0eaff; }
    tbody tr:nth-child(even) { background: #faf8ff; }
    tbody td { padding: 9px 12px; font-size: 13px; }
    .totals { width: 280px; margin-left: auto; border: 1px solid #e5d9ff; border-radius: 8px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; }
    .totals-row:not(:last-child) { border-bottom: 1px solid #f0eaff; }
    .totals-row.total { background: #7c3aed; color: white; font-weight: 700; font-size: 15px; }
    .totals-row.discount { color: #16a34a; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="company">
    <h1>Ballia Saathi</h1>
    <p>Fresh Groceries Delivered to Your Door</p>
    <p>balliasaathi@gmail.com</p>
  </div>

  <div class="meta">
    <div>
      <strong>Invoice #:</strong> ${order.order_number}<br/>
      <strong>Date:</strong> ${format(new Date(order.created_date), 'dd MMM yyyy, hh:mm aa')}<br/>
      <strong>Payment:</strong> ${(order.payment_method || 'N/A').toUpperCase()}
      ${order.coupon_code ? `<br/><strong>Coupon:</strong> ${order.coupon_code}` : ''}
    </div>
    <div style="text-align:right">
      <span class="badge">${order.status?.replace(/_/g, ' ').toUpperCase()}</span>
    </div>
  </div>

  <div class="customer-box">
    <div class="section-title">Customer Details</div>
    <p><strong>${user?.full_name || order.user_email}</strong></p>
    <p>Email: ${order.user_email}</p>
    ${user?.phone ? `<p>Phone: ${user.phone}</p>` : ''}
    ${order.delivery_address ? `<p>Delivery Address: ${order.delivery_address}</p>` : ''}
  </div>

  <div class="section-title">Order Items</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Unit</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(order.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.unit || '-'}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.quantity}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
    <div class="totals-row"><span>Delivery Fee</span><span>₹${deliveryFee}</span></div>
    ${discount > 0 ? `<div class="totals-row discount"><span>Discount</span><span>-₹${discount}</span></div>` : ''}
    <div class="totals-row total"><span>Total</span><span>₹${order.total}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Ballia Saathi!</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}