import { useMemo, useRef, useState } from 'react';
import { localClient } from '@/api/localClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Layers, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getCategories, getCategoryById } from '@/lib/categories';
import { toast } from 'sonner';

const emptyProduct = {
  name: '',
  price: 0,
  original_price: 0,
  category: 'fruits_vegetables',
  unit: '',
  stock: 0,
  brand: '',
  description: '',
  image_url: '',
  is_featured: false,
  is_daily_offer: false,
  offer_end_time: '',
  is_active: true,
  rating: 0,
  rating_count: 0,
};

export default function AdminProducts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const categoryOptions = useMemo(() => getCategories(), []);
  const categoryName = (categoryId) => getCategoryById(categoryId)?.name || categoryId || 'Uncategorized';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => localClient.entities.Product.list('-created_date'),
  });

  const productCounts = useMemo(() => products.reduce((counts, product) => {
    const key = product.category || 'uncategorized';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}), [products]);

  const filtered = useMemo(() => products.filter((product) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [
      product.name,
      product.brand,
      product.unit,
      categoryName(product.category),
    ].some(value => String(value || '').toLowerCase().includes(term));
    const matchesCategory = activeCategory === 'all' || (product.category || 'uncategorized') === activeCategory;
    return matchesSearch && matchesCategory;
  }), [products, search, activeCategory]);

  const groupedProducts = useMemo(() => {
    const groups = new Map();
    filtered.forEach((product) => {
      const key = product.category || 'uncategorized';
      if (!groups.has(key)) {
        groups.set(key, { id: key, name: categoryName(key), products: [] });
      }
      groups.get(key).products.push(product);
    });
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? localClient.entities.Product.update(editing.id, data)
      : localClient.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyProduct);
      toast.success(editing ? 'Product updated' : 'Product created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) => localClient.entities.Product.delete(productId),
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

  const downloadTemplate = () => {
    const headers = ['name', 'price', 'original_price', 'category', 'unit', 'stock', 'brand', 'description', 'image_url', 'is_featured', 'is_active'];
    const example = ['Fresh Tomatoes', 30, 40, 'fruits_vegetables', '1 kg', 100, 'Local Farm', 'Fresh red tomatoes', 'https://example.com/tomato.jpg', false, true];
    const blob = new Blob([[headers.join(','), example.join(',')].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    try {
      const { file_url } = await localClient.integrations.Core.UploadFile({ file });
      const result = await localClient.integrations.Core.ExtractDataFromUploadedFile({ file_url });
      if (result.status !== 'success' || !result.output) throw new Error(result.details || 'Failed to parse file');

      const rows = Array.isArray(result.output) ? result.output : (result.output.products || []);
      let success = 0;
      let failed = 0;
      for (const row of rows) {
        if (!row.name || !row.price) {
          failed += 1;
          continue;
        }
        await localClient.entities.Product.create({
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
        success += 1;
      }

      setImportResults({ success, failed, total: rows.length });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Imported ${success} products`);
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
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

          <Button variant="outline" className="rounded-xl h-9 border-green-500/50 text-green-700 hover:bg-green-50" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import Excel
          </Button>

          <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setEditing(null); setForm(emptyProduct); } }}>
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
                  <div>
                    <Label>Price (₹)</Label>
                    <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Original Price</Label>
                    <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: +e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={value => setForm({ ...form, category: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g., 1 kg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Stock</Label>
                    <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={value => setForm({ ...form, is_featured: value })} /><Label>Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={value => setForm({ ...form, is_active: value })} /><Label>Active</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_daily_offer} onCheckedChange={value => setForm({ ...form, is_daily_offer: value })} /><Label>Daily Offer</Label></div>
                </div>
                {form.is_daily_offer && (
                  <div>
                    <Label>Offer Ends At</Label>
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

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-bold text-sm">Filter by category</h2>
          <span className="text-xs text-muted-foreground">Showing {filtered.length} of {products.length} products</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${activeCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'}`}
          >
            All Products ({products.length})
          </button>
          {categoryOptions.filter(category => productCounts[category.id]).map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${activeCategory === category.id ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'}`}
            >
              {category.name} ({productCounts[category.id]})
            </button>
          ))}
        </div>
      </div>

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
              <p className="font-semibold text-foreground mb-2">Supported columns:</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {['name*', 'price*', 'original_price', 'category', 'unit', 'stock', 'brand', 'description', 'image_url', 'is_featured', 'is_active'].map(column => (
                  <span key={column} className={column.includes('*') ? 'text-primary font-bold' : ''}>{column}</span>
                ))}
              </div>
              <p className="text-[11px] mt-2">Use the same category IDs shown in the Add Product category dropdown.</p>
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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <p className="font-semibold text-sm">No products found</p>
          <p className="text-xs text-muted-foreground mt-1">Try another search or category.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedProducts.map(group => (
            <section key={group.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-lg">{group.name}</h2>
                <span className="text-xs font-semibold text-muted-foreground">{group.products.length} product{group.products.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.products.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="h-32 bg-muted">
                      {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">{product.brand} · {product.unit} · Stock: {product.stock}</p>
                        </div>
                        <span className="font-bold text-sm shrink-0">₹{product.price}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {product.is_featured && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Featured</span>}
                        {product.is_daily_offer && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Daily Offer</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${product.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 rounded-lg h-8 text-xs" onClick={() => openEdit(product)}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs text-destructive border-destructive/20" onClick={() => deleteMutation.mutate(product.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
