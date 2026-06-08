import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { categories } from '@/lib/categories';
import { toast } from 'sonner';

const emptyProduct = { name: '', price: 0, original_price: 0, category: 'fruits_vegetables', unit: '', stock: 0, brand: '', description: '', image_url: '', is_featured: false, is_daily_offer: false, offer_end_time: '', is_active: true, rating: 0, rating_count: 0 };

export default function AdminProducts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Product.update(editing.id, data)
      : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyProduct);
      toast.success(editing ? 'Product updated' : 'Product created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
  });

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      price: product.price || 0,
      original_price: product.original_price || 0,
      category: product.category || 'fruits_vegetables',
      unit: product.unit || '',
      stock: product.stock || 0,
      brand: product.brand || '',
      description: product.description || '',
      image_url: product.image_url || '',
      is_featured: product.is_featured || false,
      is_daily_offer: product.is_daily_offer || false,
      offer_end_time: product.offer_end_time || '',
      is_active: product.is_active !== false,
      rating: product.rating || 0,
      rating_count: product.rating_count || 0,
    });
    setOpen(true);
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  const downloadTemplate = () => {
    const headers = ['name', 'price', 'original_price', 'category', 'unit', 'stock', 'brand', 'description', 'image_url', 'is_featured', 'is_active'];
    const example = ['Fresh Tomatoes', 30, 40, 'fruits_vegetables', '1 kg', 100, 'Local Farm', 'Fresh red tomatoes', 'https://example.com/tomato.jpg', false, true];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  original_price: { type: 'number' },
                  category: { type: 'string' },
                  unit: { type: 'string' },
                  stock: { type: 'number' },
                  brand: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  is_featured: { type: 'boolean' },
                  is_active: { type: 'boolean' },
                }
              }
            }
          }
        }
      });

      if (result.status !== 'success' || !result.output) throw new Error(result.details || 'Failed to parse file');

      const rows = Array.isArray(result.output) ? result.output : (result.output.products || []);
      let success = 0, failed = 0;
      for (const row of rows) {
        if (!row.name || !row.price) { failed++; continue; }
        await base44.entities.Product.create({
          name: row.name,
          price: Number(row.price) || 0,
          original_price: Number(row.original_price) || 0,
          category: row.category || 'fruits_vegetables',
          unit: row.unit || '',
          stock: Number(row.stock) || 0,
          brand: row.brand || '',
          description: row.description || '',
          image_url: row.image_url || '',
          is_featured: row.is_featured === true || row.is_featured === 'true',
          is_active: row.is_active !== false && row.is_active !== 'false',
          rating: 0,
          rating_count: 0,
        });
        success++;
      }

      setImportResults({ success, failed, total: rows.length });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Imported ${success} products!`);
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-xl">Products ({products.length})</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48 h-9 rounded-xl" />
          </div>

          {/* Excel Import Button */}
          <Button variant="outline" className="rounded-xl h-9 border-green-500/50 text-green-700 hover:bg-green-50" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import Excel
          </Button>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyProduct); } }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-9"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} /></div>
                  <div><Label>Original Price</Label><Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: +e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g., 1 kg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} /></div>
                  <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                </div>
                <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_daily_offer} onCheckedChange={v => setForm({ ...form, is_daily_offer: v })} /><Label>🔥 Daily Offer</Label></div>
                </div>
                {form.is_daily_offer && (
                  <div>
                    <Label>Offer Ends At (optional countdown)</Label>
                    <Input type="datetime-local" value={form.offer_end_time} onChange={e => setForm({ ...form, offer_end_time: e.target.value })} />
                  </div>
                )}
                <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="w-full rounded-xl">
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Excel Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" /> Import Products
              </h3>
              <button onClick={() => { setImportOpen(false); setImportResults(null); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 mb-4 text-sm space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">📋 Supported columns:</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {['name*', 'price*', 'original_price', 'category', 'unit', 'stock', 'brand', 'description', 'image_url', 'is_featured', 'is_active'].map(col => (
                  <span key={col} className={col.includes('*') ? 'text-primary font-bold' : ''}>{col}</span>
                ))}
              </div>
              <p className="text-[11px] mt-2">* Required fields. Category values: fruits_vegetables, dairy_bread, snacks_drinks, meat_fish, staples, personal_care, household, baby_care, frozen, beverages</p>
            </div>

            <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-semibold mb-3">
              <Download className="w-4 h-4" /> Download CSV Template
            </button>

            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload Excel / CSV File</>
              )}
            </button>

            {importResults && (
              <div className="mt-4 bg-muted/50 rounded-2xl p-4">
                <p className="font-semibold text-sm mb-2">Import Results</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-bold">{importResults.success} imported</span>
                  </div>
                  {importResults.failed > 0 && (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-bold">{importResults.failed} skipped</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="overflow-hidden">
            <div className="h-32 bg-muted">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.brand} · {p.unit} · Stock: {p.stock}</p>
                </div>
                <span className="font-bold text-sm">₹{p.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {p.is_featured && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Featured</span>}
                {p.is_daily_offer && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">🔥 Daily Offer</span>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 rounded-lg h-8 text-xs" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs text-destructive border-destructive/20" onClick={() => deleteMutation.mutate(p.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}