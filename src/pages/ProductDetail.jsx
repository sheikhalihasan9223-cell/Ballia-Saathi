import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Star, Plus, Minus, ShoppingCart, Zap, Heart, Package, Truck, Shield, RotateCcw } from 'lucide-react';
import { addToCart, getCart, updateQuantity } from '@/lib/cartStore';
import { getCategoryById } from '@/lib/categories';
import { motion } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import SmartSuggestions from '@/components/product/SmartSuggestions';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(0);
  const [userEmail, setUserEmail] = useState(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => localClient.entities.Product.filter({ id: productId }),
    select: data => data[0],
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related', product?.category],
    queryFn: () => localClient.entities.Product.filter({ category: product.category, is_active: true }),
    enabled: !!product?.category,
  });

  useEffect(() => {
    localClient.auth.me().then(u => setUserEmail(u?.email || null)).catch(() => {});
  }, []);

  useEffect(() => {
    const syncQty = () => {
      const cart = getCart();
      const item = cart.find(i => i.product_id === productId);
      setQty(item ? item.quantity : 0);
    };
    syncQty();
    window.addEventListener('cart-updated', syncQty);
    return () => window.removeEventListener('cart-updated', syncQty);
  }, [productId]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-muted-foreground">Product not found</div>
  );

  const discount = product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const category = getCategoryById(product.category);
  const related = relatedProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-lg mx-auto pb-32 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted hover:bg-muted/80">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-heading font-semibold text-sm">Product Details</span>
        <button className="p-2 rounded-xl bg-muted hover:bg-muted/80">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-4 aspect-square bg-white rounded-3xl overflow-hidden border border-border shadow-sm"
      >
        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-4" />
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {discount}% OFF
          </div>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Only {product.stock} left!
          </div>
        )}
      </motion.div>

      {/* Main Info */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-2">
          {category && <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{category.name}</span>}
          {product.brand && <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{product.brand}</span>}
        </div>
        <h1 className="font-heading font-bold text-2xl leading-tight">{product.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{product.unit}</p>

        {product.rating && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">{product.rating_count?.toLocaleString()} ratings</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end gap-3 mt-4">
          <span className="text-3xl font-heading font-extrabold text-foreground">₹{product.price}</span>
          {discount > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through mb-0.5">₹{product.original_price}</span>
              <span className="text-sm font-bold text-green-600 mb-0.5">Save ₹{product.original_price - product.price}</span>
            </>
          )}
        </div>

        {/* Delivery info */}
        <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <Zap className="w-4 h-4 text-green-600 fill-green-600" />
          <span className="text-sm font-medium text-green-700">Delivery in <strong>20 minutes</strong> · Free above ₹199</span>
        </div>

        {/* Add to Cart Section */}
        <div className="mt-5">
          {qty === 0 ? (
            <button
              onClick={() => addToCart(product)}
              className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart — ₹{product.price}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-primary rounded-2xl p-1.5">
                <button
                  onClick={() => updateQuantity(product.id, qty - 1)}
                  className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-primary-foreground hover:bg-white/25"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-lg font-bold text-primary-foreground">{qty}</span>
                  <p className="text-[10px] text-primary-foreground/70">in cart · ₹{product.price * qty}</p>
                </div>
                <button
                  onClick={() => updateQuantity(product.id, qty + 1)}
                  className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-primary-foreground hover:bg-white/25"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <Link
                to="/cart"
                className="w-full h-12 rounded-2xl border-2 border-primary text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Go to Cart
              </Link>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: Truck, label: '20 Min Delivery' },
            { icon: Shield, label: '100% Fresh' },
            { icon: RotateCcw, label: 'Easy Returns' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 bg-muted/40 rounded-2xl p-3">
              <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold text-center text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-5 bg-card border border-border rounded-2xl p-4">
            <h3 className="font-heading font-bold text-sm mb-2">About this product</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Product Details */}
        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Product Details
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Unit', value: product.unit },
              { label: 'Brand', value: product.brand || 'N/A' },
              { label: 'Category', value: category?.name || product.category },
              { label: 'Stock', value: product.stock > 0 ? `${product.stock} available` : 'Out of stock' },
              ...(product.tags?.length ? [{ label: 'Tags', value: product.tags.join(', ') }] : []),
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-semibold text-right max-w-[55%]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Suggestions */}
        <SmartSuggestions product={product} userEmail={userEmail} />

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-6 mb-4">
            <h3 className="font-heading font-bold text-lg mb-3">You might also like</h3>
            <div className="grid grid-cols-2 gap-3">
              {related.map(p => <ProductCard key={p.id} product={p} userEmail={userEmail} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
