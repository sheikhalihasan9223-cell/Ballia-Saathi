import { Link } from 'react-router-dom';
import { getCategories } from '@/lib/categories';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function CategoryGrid({ dark } = {}) {
  const [cats, setCats] = useState(getCategories());

  useEffect(() => {
    const handler = () => setCats(getCategories());
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-base text-foreground">Shop by Category</h2>
        <Link to="/categories" className="text-xs text-primary font-semibold">See all</Link>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {cats.slice(0, 8).map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/category/${cat.id}`} className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
              <div
                className="w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center p-1.5"
                style={{ backgroundColor: cat.bgColor || '#fdf2f8' }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="text-[10px] font-medium text-center text-foreground/80 leading-tight line-clamp-2">
                {cat.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}