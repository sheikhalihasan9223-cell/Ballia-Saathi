import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Star } from 'lucide-react';

export default function AnalyticsAdmin() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = orders.length ? (totalRevenue / orders.length).toFixed(0) : 0;
  const topProducts = orders.flatMap(o => o.items || []).reduce((acc, item) => {
    const existing = acc.find(p => p.name === item.name);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
    } else {
      acc.push({ name: item.name, quantity: item.quantity, revenue: item.price * item.quantity });
    }
    return acc;
  }, []).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const categoryData = products.reduce((acc, p) => {
    const cat = p.category?.replace(/_/g, ' ') || 'Other';
    const existing = acc.find(c => c.name === cat);
    if (existing) existing.count++;
    else acc.push({ name: cat, count: 1 });
    return acc;
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="font-heading font-bold text-xl mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: 'Orders', value: orders.length, icon: ShoppingBag },
          { label: 'Avg Order', value: `₹${avgOrderValue}`, icon: TrendingUp },
          { label: 'Products', value: products.length, icon: Star },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-heading font-bold text-lg">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" width={100} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="revenue" fill="hsl(267, 84%, 58%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Products by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} angle={-20} />
                  <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="count" fill="hsl(328, 80%, 58%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}