import { useState, useEffect } from 'react';
import { getCategories, saveCategories, defaultCategories } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Plus, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const emptyNew = { id: '', name: '', image: '', color: 'bg-gray-100 text-gray-600' };

export default function AdminCategories() {
  const [cats, setCats] = useState(getCategories());
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [open, setOpen] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newForm, setNewForm] = useState(emptyNew);

  useEffect(() => {
    const handler = () => setCats(getCategories());
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, image: cat.image || '' });
    setOpen(true);
  };

  const saveEdit = () => {
    const updated = cats.map(c => c.id === editing.id ? { ...c, ...form } : c);
    saveCategories(updated);
    setOpen(false);
    toast.success('Category updated');
  };

  const deleteCategory = (id) => {
    const updated = cats.filter(c => c.id !== id);
    saveCategories(updated);
    toast.success('Category removed');
  };

  const addCategory = () => {
    if (!newForm.id || !newForm.name) { toast.error('ID and name required'); return; }
    if (cats.find(c => c.id === newForm.id)) { toast.error('ID already exists'); return; }
    const updated = [...cats, { ...newForm }];
    saveCategories(updated);
    setNewCatOpen(false);
    setNewForm(emptyNew);
    toast.success('Category added');
  };

  const resetDefaults = () => {
    saveCategories(defaultCategories);
    toast.success('Reset to defaults');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-xl">Categories ({cats.length})</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetDefaults} className="rounded-xl gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label>ID (e.g. electronics)</Label><Input value={newForm.id} onChange={e => setNewForm({ ...newForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="category_id" /></div>
                <div><Label>Display Name</Label><Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} /></div>
                <div><Label>Image URL</Label><Input value={newForm.image} onChange={e => setNewForm({ ...newForm, image: e.target.value })} placeholder="https://..." /></div>
                {newForm.image && <img src={newForm.image} alt="preview" className="w-16 h-16 rounded-xl object-cover" />}
                <Button onClick={addCategory} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map(cat => {
          const Icon = typeof cat.icon === 'function' || typeof cat.icon === 'string' ? cat.icon : null;
          return (
            <div key={cat.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${cat.color} flex items-center justify-center`}>
                    {Icon && <Icon className="w-6 h-6" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground">{cat.id}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(cat)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10">
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                </button>
                {!defaultCategories.find(d => d.id === cat.id) && (
                  <button onClick={() => deleteCategory(cat.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Display Name</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></div>
            {form.image && <img src={form.image} alt="preview" className="w-16 h-16 rounded-xl object-cover" />}
            <Button onClick={saveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
