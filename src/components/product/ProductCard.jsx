import { useState, useEffect } from 'react';

const CATEGORY_IMAGES = {
  fruits_vegetables: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=300&fit=crop',
  dairy_bread: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop',
  snacks_drinks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
  meat_fish: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=300&h=300&fit=crop',
  staples: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop',
  personal_care: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop',
  household: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
  baby_care: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop',
  frozen: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=300&h=300&fit=crop',
  beverages: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop',
  // CSV category name fallbacks
  'Dairy & Breakfast': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop',
  'Personal Care': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop',
  'Snacks & Beverages': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
  'Frozen Foods': 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=300&h=300&fit=crop',
  'Baby Care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop',
  'Fruits & Vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=300&fit=crop',
  'Staples': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop',
  'Household': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
  'Meat & Fish': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=300&h=300&fit=crop',
  'Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=300&h=300&fit=crop';
function getCategoryImage(category) {
  return CATEGORY_IMAGES[category] || DEFAULT_IMAGE;
}
import { Link } from 'react-router-dom';
import { Plus, Minus, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addToCart, getCart, updateQuantity } from '@/lib/cartStore';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Shared hook — all ProductCards reuse the same cached query
function useWishlist(userEmail) {
  return useQuery({
    queryKey: ['wishlist-all', userEmail],
    queryFn: () => base44.entities.Wishlist.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 30000, // don't refetch for 30s
  });
}

export default function ProductCard({ product, userEmail }) {
  const [qty, setQty] = useState(0);
  const queryClient = useQueryClient();

  // Use injected userEmail prop (passed from parent, no per-card auth call)
  const { data: wishlistItems = [] } = useWishlist(userEmail);
  const wishlisted = wishlistItems.find(w => w.product_id === product.id) || null;

  useEffect(() => {
    const syncQty = () => {
      const cart = getCart();
      const item = cart.find(i => i.product_id === product.id);
      setQty(item ? item.quantity : 0);
    };
    syncQty();
    window.addEventListener('cart-updated', syncQty);
    return () => window.removeEventListener('cart-updated', syncQty);
  }, [product.id]);

  const addWishlist = useMutation({
    mutationFn: () => base44.entities.Wishlist.create({
      user_email: userEmail,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      product_price: product.price,
      product_unit: product.unit,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-all', userEmail] });
      toast.success('Added to wishlist');
    },
  });

  const removeWishlist = useMutation({
    mutationFn: () => base44.entities.Wishlist.delete(wishlisted.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-all', userEmail] });
      toast.success('Removed from wishlist');
    },
  });

  const discount = product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleUpdate = (e, newQty) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, newQty);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userEmail) { toast.error('Please login to use wishlist'); return; }
    if (wishlisted) removeWishlist.mutate();
    else addWishlist.mutate();
  };

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-card rounded-2xl border border-border overflow-hidden group relative"
      >
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </div>
        )}

        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        </button>

        <div className="relative aspect-square bg-muted/50 p-3 flex items-center justify-center overflow-hidden">
          <img
            src={product.image_url || getCategoryImage(product.category)}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105"
            onError={e => { e.target.src = getCategoryImage(product.category); }}
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/70 px-2 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{product.unit}</p>
          <h3 className="font-medium text-sm mt-0.5 line-clamp-2 leading-tight">{product.name}</h3>

          {product.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-muted-foreground">{product.rating}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm">₹{product.price}</span>
              {discount > 0 && (
                <span className="text-[11px] text-muted-foreground line-through">₹{product.original_price}</span>
              )}
            </div>

            {product.stock === 0 ? (
              <span className="text-[10px] font-bold text-destructive">Out of Stock</span>
            ) : qty === 0 ? (
              <Button
                size="sm"
                onClick={handleAdd}
                className="h-7 px-3 text-xs rounded-lg bg-primary hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" /> Add
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-primary rounded-lg">
                <button onClick={(e) => handleUpdate(e, qty - 1)} className="p-1.5 text-primary-foreground hover:bg-white/10 rounded-l-lg">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-primary-foreground w-5 text-center">{qty}</span>
                <button onClick={(e) => handleUpdate(e, qty + 1)} className="p-1.5 text-primary-foreground hover:bg-white/10 rounded-r-lg">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}