import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { addToCart } from '@/lib/cartStore';
import { toast } from 'sonner';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { localClient.auth.me().then(setUser); }, []);

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?.email],
    queryFn: () => localClient.entities.Wishlist.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => localClient.entities.Wishlist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg">Your Wishlist</h1>
        <span className="ml-auto text-sm text-muted-foreground">{wishlist.length} items</span>
      </div>

      <div className="px-4 pt-4 pb-10">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="font-heading font-bold text-lg">No Wishlist Items</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Tap the heart on any product to save it</p>
            <Link to="/" className="text-primary font-semibold text-sm">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wishlist.map(item => (
              <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="relative aspect-square bg-muted/50">
                  <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => { removeMutation.mutate(item.id); toast.success('Removed from wishlist'); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow"
                  >
                    <Heart className="w-4 h-4 fill-accent text-accent" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">{item.product_unit}</p>
                  <h3 className="font-medium text-sm line-clamp-2 mt-0.5">{item.product_name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">₹{item.product_price}</span>
                    <button
                      onClick={() => {
                        addToCart({ id: item.product_id, name: item.product_name, image_url: item.product_image, price: item.product_price, unit: item.product_unit });
                        toast.success('Added to cart');
                      }}
                      className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}