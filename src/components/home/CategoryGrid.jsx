import { Link } from 'react-router-dom';
import { getCategories, getCategoryGroups } from '@/lib/categories';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function CategoryGrid() {
  const [cats, setCats] = useState(getCategories());

  useEffect(() => {
    const handler = () => setCats(getCategories());
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  const groups = getCategoryGroups(cats).filter(group => group.name !== 'Personal & Home');

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-lg text-foreground">All Categories</h2>
        <Link to="/categories" className="text-xs text-primary font-semibold">See all</Link>
      </div>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.name}>
            <h3 className="font-heading font-bold text-[19px] leading-none text-foreground mb-3">
              {group.name}
            </h3>
            <div className="grid grid-cols-4 gap-x-3 gap-y-5">
              {group.categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  className={cat.wide ? 'col-span-2' : ''}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035 }}
                >
                  <Link to={`/category/${cat.id}`} className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
                    <div
                      className="w-full h-[74px] rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: cat.bgColor || '#f7f7f7' }}
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-center text-foreground leading-[1.12] max-w-[88px]">
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
