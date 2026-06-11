import { useParams } from 'react-router-dom';
import { localClient } from '@/api/localClient';
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
    localClient.auth.me().then(u => setUserEmail(u?.email || null)).catch(() => {});
  }, []);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => localClient.entities.Product.filter({ category: categoryId, is_active: true }),
  });

  const Icon = typeof category?.icon === 'function' || typeof category?.icon === 'string' ? category.icon : null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          {(category?.image || Icon) && (
            <div className={`w-8 h-8 rounded-lg ${category?.color || 'bg-muted'} flex items-center justify-center overflow-hidden`}>
              {category?.image ? (
                <img src={category.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
          )}
          <h1 className="font-heading font-bold text-lg">{category?.name || 'Category'}</h1>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{isLoading ? 'Loading products...' : `${products.length} products`}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-24">
        {isLoading && (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
          </div>
        )}
        {!isLoading && !isError && products.map(p => <ProductCard key={p.id} product={p} userEmail={userEmail} />)}
        {!isLoading && (isError || products?.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No products in this category yet. Add products from Admin Panel and choose {category?.name || 'this category'}.
          </div>
        )}
      </div>
    </div>
  );
}
