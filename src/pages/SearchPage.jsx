import { useState, useMemo, useEffect } from 'react';
import { localClient } from '@/api/localClient';
import { useQuery } from '@tanstack/react-query';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product/ProductCard';
import { categories } from '@/lib/categories';
import VoiceSearch from '@/components/VoiceSearch';

export default function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Read ?q= from URL for voice search
  const urlQ = new URLSearchParams(window.location.search).get('q') || '';
  const [query, setQuery] = useState(urlQ);

  useEffect(() => {
    localClient.auth.me().then(u => setUserEmail(u?.email || null)).catch(() => {});
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => localClient.entities.Product.filter({ is_active: true }),
  });

  const filtered = useMemo(() => {
    let result = products;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (maxPrice && !isNaN(Number(maxPrice))) result = result.filter(p => p.price <= Number(maxPrice));
    if (sortBy === 'price_low') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'discount') result = [...result].sort((a, b) => {
      const da = a.original_price > a.price ? ((a.original_price - a.price) / a.original_price) : 0;
      const db = b.original_price > b.price ? ((b.original_price - b.price) / b.original_price) : 0;
      return db - da;
    });
    return result;
  }, [products, query, selectedCategory, sortBy, maxPrice]);

  const clearAll = () => { setQuery(''); setSelectedCategory(null); setSortBy('relevance'); setMaxPrice(''); };
  const hasFilters = query || selectedCategory || sortBy !== 'relevance' || maxPrice;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
      {/* Search Input */}
      <div className="relative mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Grocery, sabzi, dal, chawal..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-2xl bg-muted/60 border-border text-sm"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 active:scale-90 transition-transform">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center">
          <VoiceSearch />
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${showFilters ? 'bg-primary text-white border-primary' : 'bg-muted border-border text-muted-foreground'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-primary font-semibold flex items-center gap-1 active:opacity-70">
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-4">
          {/* Sort */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'relevance', label: 'Relevance' },
                { val: 'price_low', label: 'Price: Low to High' },
                { val: 'price_high', label: 'Price: High to Low' },
                { val: 'rating', label: 'Top Rated' },
                { val: 'discount', label: 'Best Discount' },
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => setSortBy(s.val)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                    sortBy === s.val ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max price */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2">Max Price (₹)</p>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="e.g. 200"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="h-9 rounded-xl text-sm w-32"
              />
              {[50, 100, 200, 500].map(p => (
                <button key={p} onClick={() => setMaxPrice(String(p))}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${maxPrice === String(p) ? 'bg-primary text-white border-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                  ₹{p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category scrollable chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-semibold text-foreground">Koi product nahi mila</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or remove filters</p>
          <button onClick={clearAll} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(p => <ProductCard key={p.id} product={p} userEmail={userEmail} />)}
        </div>
      )}
    </div>
  );
}