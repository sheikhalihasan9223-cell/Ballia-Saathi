import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Home, MapPin, Plus, Trash2, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const emptyAddr = { label: 'home', full_address: '', landmark: '', city: '', pincode: '', is_default: false };

export default function SavedAddresses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyAddr);
  const [menuOpen, setMenuOpen] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { localClient.auth.me().then(setUser); }, []);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', user?.email],
    queryFn: () => localClient.entities.Address.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Address.create({ ...data, user_email: user.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setOpen(false); setForm(emptyAddr); toast.success('Address saved'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Address.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setMenuOpen(null); toast.success('Address deleted'); },
  });

  const IconFor = ({ label }) => label === 'home'
    ? <Home className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
    : <MapPin className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />;

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg">Addresses</h1>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-10">
        {/* Add New */}
        <button onClick={() => setOpen(true)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-accent" />
            <span className="font-semibold text-accent">Add New Address</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {addresses.length > 0 && (
          <div>
            <h3 className="font-heading font-bold text-sm mb-2 px-1">Saved Addresses</h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {addresses.map((addr, i) => (
                <div key={addr.id} className={`flex items-start gap-3 p-4 ${i < addresses.length - 1 ? 'border-b border-border' : ''} relative`}>
                  <IconFor label={addr.label} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm capitalize">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {addr.full_address}{addr.city ? `, ${addr.city}` : ''}{addr.pincode ? ` ${addr.pincode}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-muted rounded-lg" onClick={() => setMenuOpen(menuOpen === addr.id ? null : addr.id)}>
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {menuOpen === addr.id && (
                    <div className="absolute right-4 top-12 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                      <button onClick={() => deleteMutation.mutate(addr.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle className="font-heading">New Address</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-primary text-xs font-semibold">Type</Label>
              <div className="flex gap-2 mt-1">
                {['home', 'work', 'other'].map(l => (
                  <button key={l} onClick={() => setForm({ ...form, label: l })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${form.label === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-primary text-xs font-semibold">Full Address *</Label>
              <Input value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} className="mt-1 bg-muted/40 rounded-xl" placeholder="House no, Street, Area" />
            </div>
            <div>
              <Label className="text-primary text-xs font-semibold">Landmark</Label>
              <Input value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className="mt-1 bg-muted/40 rounded-xl" placeholder="Near landmark (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-primary text-xs font-semibold">City *</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 bg-muted/40 rounded-xl" placeholder="City" />
              </div>
              <div>
                <Label className="text-primary text-xs font-semibold">Pincode</Label>
                <Input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="mt-1 bg-muted/40 rounded-xl" placeholder="Pincode" />
              </div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full rounded-xl bg-primary">
              {createMutation.isPending ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}