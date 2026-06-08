import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { getCategoryById } from '@/lib/categories';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const category = getCategoryById(categoryId);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || null)).catch(() => {});
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => base44.entities.Product.filter({ category: categoryId, is_active: true }),
  });

  const Icon = category?.icon;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="font-heading font-bold text-lg">{category?.name || 'Category'}</h1>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{products.length} products</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-24">
        {products.map(p => <ProductCard key={p.id} product={p} userEmail={userEmail} />)}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No products in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}