import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '@/lib/categories';
import { Search } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState(getCategories());

  useEffect(() => {
    const handler = () => setCategories(getCategories());
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 pt-5 pb-3">
        <h1 className="font-heading font-bold text-xl mb-3">Shop by category</h1>
        <Link to="/search" className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search products...</span>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <p className="font-heading font-bold text-base mb-3 text-foreground">All Categories</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="rounded-2xl overflow-hidden border border-border active:scale-95 transition-transform"
              style={{ backgroundColor: cat.bgColor || '#fdf2f8' }}
            >
              <div className="p-4 pb-2">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-28 object-contain mx-auto"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="px-3 pb-3">
                <p className="font-semibold text-sm text-foreground leading-tight">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}