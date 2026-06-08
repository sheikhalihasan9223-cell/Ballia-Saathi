import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

const emptyCoupon = { code: '', description: '', discount_type: 'percentage', discount_value: 0, min_order: 0, max_discount: 0, is_active: true, expires_at: '' };

export default function CouponsAdmin() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCoupon);
  const queryClient = useQueryClient();

  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setOpen(false);
      setForm(emptyCoupon);
      toast.success('Coupon created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-xl">Coupons ({coupons.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-9"><Plus className="w-4 h-4 mr-1" /> Add Coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">New Coupon</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Discount</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: +e.target.value })} /></div>
                <div><Label>Min Order</Label><Input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: +e.target.value })} /></div>
                <div><Label>Max Off</Label><Input type="number" value={form.max_discount} onChange={e => setForm({ ...form, max_discount: +e.target.value })} /></div>
              </div>
              <div><Label>Expires</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full rounded-xl">
                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{c.code}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.min_order ? ` · Min ₹${c.min_order}` : ''}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{c.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
                {c.expires_at && <span className="text-[10px] text-muted-foreground">Expires: {c.expires_at}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}