import ProductCard from '@/components/product/ProductCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductSection({ title, products, link, userEmail }) {
  if (!products?.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="font-heading font-bold text-lg">{title}</h2>
        {link && (
          <Link to={link} className="text-primary text-xs font-semibold flex items-center gap-0.5">
            See All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {products.map(product => (
          <div key={product.id} className="w-36 shrink-0">
            <ProductCard product={product} userEmail={userEmail} />
          </div>
        ))}
      </div>
    </div>
  );
}