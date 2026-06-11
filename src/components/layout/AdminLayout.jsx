import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Image, BarChart3, ChevronLeft, MessageCircle, Grid3X3, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoUrl } from '@/api/localClient';

const sidebarItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/rider', icon: Truck, label: 'Rider Panel' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/categories', icon: Grid3X3, label: 'Categories' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { path: '/admin/banners', icon: Image, label: 'Banners' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/support', icon: MessageCircle, label: 'Support' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border fixed h-full z-40">
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logoUrl} alt="Ballia Saathi" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <span className="font-heading font-bold text-lg">Ballia Saathi</span>
              <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4" /> Back to Store
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logoUrl} alt="Ballia Saathi" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-heading font-bold">Ballia Saathi</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile bottom nav for admin */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around py-2">
          {sidebarItems.slice(0, 5).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path} className="flex flex-col items-center gap-0.5 px-2 py-1">
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
