import { useState } from 'react';
import { localClient } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const emptyBanner = { title: '', subtitle: '', image_url: '', is_active: true, position: 1 };

export default function BannersAdmin() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyBanner);
  const queryClient = useQueryClient();

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => localClient.entities.Banner.list('position'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Banner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setOpen(false);
      setForm(emptyBanner);
      toast.success('Banner created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Banner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-xl">Banners ({banners.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-9"><Plus className="w-4 h-4 mr-1" /> Add Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">New Banner</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Position</Label><Input type="number" value={form.position} onChange={e => setForm({ ...form, position: +e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              </div>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full rounded-xl">
                {createMutation.isPending ? 'Creating...' : 'Create Banner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {banners.map(b => (
          <Card key={b.id} className="overflow-hidden">
            <div className="h-36 bg-muted relative">
              {b.image_url ? (
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-bold text-sm">{b.title}</p>
                <p className="text-white/70 text-xs">{b.subtitle}</p>
              </div>
            </div>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px] text-muted-foreground">Position: {b.position}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(b.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}