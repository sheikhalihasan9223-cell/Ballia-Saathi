import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function Refunds() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['refund-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ user_email: user.email, status: 'cancelled' }, '-created_date'),
    enabled: !!user?.email,
  });

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg">Your Refunds</h1>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-10">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="font-heading font-bold text-lg">No Refunds</p>
            <p className="text-sm text-muted-foreground mt-1">You don't have any refunds yet</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Order ID</p>
                  <p className="font-bold text-sm">{order.order_number}</p>
                </div>
                <p className="font-heading font-bold text-xl">₹{order.total}</p>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">To: UPI</span>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Completed</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Refund initiated on {format(new Date(order.updated_date), "do MMM, yyyy 'at' hh:mm aa")}
              </p>
              <button className="mt-3 text-accent font-bold text-sm">Show Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}