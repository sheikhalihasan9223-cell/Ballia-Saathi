import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, ShoppingBag, Users, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(267, 84%, 58%)', 'hsl(328, 80%, 58%)', 'hsl(200, 80%, 55%)', 'hsl(150, 60%, 50%)', 'hsl(40, 90%, 55%)'];

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 50),
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const LOW_STOCK_THRESHOLD = 10;
  const lowStockProducts = products
    .filter(p => p.is_active !== false && typeof p.stock === 'number' && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const stats = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-primary to-accent' },
    { title: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
    { title: 'Products', value: products.length, icon: Package, color: 'from-green-500 to-emerald-500' },
    { title: 'Users', value: users.length, icon: Users, color: 'from-orange-500 to-amber-500' },
  ];

  // Revenue by day (last 7 orders grouped)
  const revenueData = orders.slice(0, 20).reduce((acc, order) => {
    const date = new Date(order.created_date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.revenue += order.total || 0;
      existing.orders += 1;
    } else {
      acc.push({ date, revenue: order.total || 0, orders: 1 });
    }
    return acc;
  }, []).reverse();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your Zappr store</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                />
                <Bar dataKey="revenue" fill="hsl(267, 84%, 58%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No orders yet</p>
            )}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-bold text-primary">{activeOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-bold text-green-600">{deliveredOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="mt-6 border-orange-300 dark:border-orange-700">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert ({lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Product</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Unit</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Stock</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 flex items-center gap-2">
                        {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />}
                        <span className="font-medium">{p.name}</span>
                      </td>
                      <td className="py-3 text-muted-foreground capitalize">{p.category?.replace(/_/g, ' ')}</td>
                      <td className="py-3 text-muted-foreground">{p.unit || '—'}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {p.stock === 0 ? '❌ Out of Stock' : `⚠️ ${p.stock} left`}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link to="/admin/products" className="text-xs text-primary font-semibold hover:underline">Restock →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Order</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Items</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">#{order.order_number}</td>
                    <td className="py-3 text-muted-foreground">{order.user_email || '—'}</td>
                    <td className="py-3">{order.items?.length || 0}</td>
                    <td className="py-3 font-medium">₹{order.total}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}