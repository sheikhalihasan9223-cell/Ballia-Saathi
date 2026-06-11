import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { Sparkles } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

// Pairing map: product name keywords → suggested category or tags
const PAIRINGS = {
  bread: ['dairy_bread', 'butter', 'jam', 'milk'],
  milk: ['dairy_bread', 'tea', 'coffee', 'cereals'],
  rice: ['staples', 'dal', 'lentils'],
  dal: ['staples', 'rice', 'spices'],
  apple: ['fruits_vegetables', 'banana', 'orange'],
  banana: ['fruits_vegetables', 'apple', 'mango'],
  atta: ['staples', 'oil', 'ghee'],
  oil: ['staples', 'atta', 'ghee'],
  tea: ['beverages', 'milk', 'biscuit'],
  biscuit: ['snacks_drinks', 'tea', 'chocolate'],
  chicken: ['meat_fish', 'spices', 'oil'],
  egg: ['dairy_bread', 'bread', 'butter'],
  sugar: ['staples', 'tea', 'milk'],
  paneer: ['dairy_bread', 'spices', 'oil'],
  tomato: ['fruits_vegetables', 'onion', 'potato'],
  onion: ['fruits_vegetables', 'tomato', 'potato'],
};

function getRelatedCategories(productName, productCategory) {
  const nameLower = productName?.toLowerCase() || '';
  for (const [key, values] of Object.entries(PAIRINGS)) {
    if (nameLower.includes(key)) return values;
  }
  return [productCategory];
}

export default function SmartSuggestions({ product, userEmail }) {
  const relatedCategories = getRelatedCategories(product?.name, product?.category);
  const primaryCategory = relatedCategories[0];

  const { data: suggestions = [] } = useQuery({
    queryKey: ['smart-suggestions', product?.id, primaryCategory],
    queryFn: () => localClient.entities.Product.filter({ category: primaryCategory, is_active: true }),
    enabled: !!product?.id,
    select: (data) => data.filter(p => p.id !== product.id).slice(0, 4),
  });

  if (!suggestions.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="font-heading font-bold text-base">People also buy</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Customers who buy <strong>{product?.name}</strong> also buy these:
      </p>
      <div className="grid grid-cols-2 gap-3">
        {suggestions.map(p => (
          <ProductCard key={p.id} product={p} userEmail={userEmail} />
        ))}
      </div>
    </div>
  );
}