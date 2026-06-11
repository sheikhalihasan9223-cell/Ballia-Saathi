import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getCategoryGroups } from '@/lib/categories';
import { Heart, Search } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState(getCategories());

  useEffect(() => {
    const handler = () => setCategories(getCategories());
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  const groups = getCategoryGroups(categories).filter(group => group.name !== 'Personal & Home');

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 pt-7 pb-4">
        <div className="grid grid-cols-[44px_1fr_88px] items-center">
          <div />
          <h1 className="font-heading font-bold text-2xl text-center">All Categories</h1>
          <div className="flex items-center justify-end gap-3">
            <Link to="/profile/wishlist" className="w-8 h-8 flex items-center justify-center active:scale-95 transition-transform" aria-label="Wishlist">
              <Heart className="w-7 h-7" strokeWidth={2.3} />
            </Link>
            <Link to="/search" className="w-8 h-8 flex items-center justify-center active:scale-95 transition-transform" aria-label="Search">
              <Search className="w-7 h-7" strokeWidth={2.3} />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-8">
        {groups.map((group) => (
          <section key={group.name}>
            <h2 className="font-heading font-bold text-[23px] leading-none mb-4 text-foreground">
              {group.name}
            </h2>
            <div className="grid grid-cols-4 gap-x-3 gap-y-6">
              {group.categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`${cat.wide ? 'col-span-2' : ''} flex flex-col items-center gap-2 active:scale-95 transition-transform`}
                >
                  <div
                    className="w-full h-[90px] rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: cat.bgColor || '#f7f7f7' }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <span className="text-[16px] font-bold text-center text-foreground leading-[1.16] max-w-[112px]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <Link to="/search" className="flex items-center justify-center gap-2 bg-muted rounded-xl px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Search products</span>
        </Link>
      </div>
    </div>
  );
}
