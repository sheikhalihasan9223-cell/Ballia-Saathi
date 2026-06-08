import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, MapPin, Package, Mail, Phone, Shield, Users } from 'lucide-react';

const statusColors = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  packing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function UserCard({ user, orders, addresses }) {
  const [expanded, setExpanded] = useState(false);
  const userOrders = orders.filter(o => o.user_email === user.email);
  const userAddresses = addresses.filter(a => a.user_email === user.email);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button
          className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{user.full_name || 'Unknown'}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {user.role || 'user'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {userOrders.length} orders · {userAddresses.length} addresses · Joined {user.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border bg-muted/20 p-4 space-y-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs font-bold text-muted-foreground mb-2">Contact</p>
              <p className="text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</p>
              {user.phone && <a href={`tel:${user.phone}`} className="text-xs flex items-center gap-1.5 mt-1 text-primary"><Phone className="w-3 h-3" /> {user.phone}</a>}
            </div>

            {userAddresses.length > 0 && (
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Saved Locations ({userAddresses.length})</p>
                <div className="space-y-2">
                  {userAddresses.map((addr, i) => (
                    <div key={i} className="text-xs border-l-2 border-primary/30 pl-2">
                      <p className="font-medium capitalize">{addr.label} {addr.is_default && <span className="text-[10px] text-primary">(default)</span>}</p>
                      <p className="text-muted-foreground">{addr.full_address}{addr.landmark ? `, ${addr.landmark}` : ''}</p>
                      <p className="text-muted-foreground">{addr.city} {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Orders ({userOrders.length})</p>
              {userOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {userOrders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">#{order.order_number}</p>
                        <p className="text-muted-foreground">{format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{order.total}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {userOrders.length > 10 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{userOrders.length - 10} more orders</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UsersAdmin() {
  const [activeTab, setActiveTab] = useState('users');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['admin-addresses'],
    queryFn: () => base44.entities.Address.list('-created_date', 200),
  });

  const admins = allUsers.filter(u => u.role === 'admin');
  const users = allUsers.filter(u => u.role !== 'admin');

  const tabs = [
    { key: 'users', label: 'Users', icon: Users, count: users.length },
    { key: 'admins', label: 'Admins', icon: Shield, count: admins.length },
  ];

  const displayList = activeTab === 'admins' ? admins : users;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="font-heading font-bold text-xl mb-6">Team & Users</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-card shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20 text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'admins' && (
        <div className="mb-4 p-3 bg-accent/5 border border-accent/20 rounded-xl text-xs text-accent font-medium flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Admins have full access to the dashboard. Invite admins carefully.
        </div>
      )}

      <div className="space-y-3">
        {displayList.map(user => (
          <UserCard key={user.id} user={user} orders={orders} addresses={addresses} />
        ))}
        {displayList.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No {activeTab} found</p>
        )}
      </div>
    </div>
  );
}