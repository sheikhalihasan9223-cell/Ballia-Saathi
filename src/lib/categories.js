import { Apple, Milk, Cookie, Fish, Wheat, Sparkles, Home, Baby, Snowflake, Coffee, ShoppingBag, Heart, Zap } from 'lucide-react';

export const defaultCategories = [
  {
    id: 'fruits_vegetables',
    name: 'Fruits & Vegetables',
    icon: Apple,
    color: 'bg-green-100 text-green-600',
    gradient: 'from-green-400 to-emerald-500',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=300&fit=crop',
    bgColor: '#f0fdf4',
  },
  {
    id: 'dairy_bread',
    name: 'Dairy & Eggs',
    icon: Milk,
    color: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-400 to-cyan-500',
    image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=300&h=300&fit=crop',
    bgColor: '#eff6ff',
  },
  {
    id: 'meat_fish',
    name: 'Meat & Seafood',
    icon: Fish,
    color: 'bg-red-100 text-red-600',
    gradient: 'from-red-400 to-rose-500',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop',
    bgColor: '#fff1f2',
  },
  {
    id: 'staples',
    name: 'Rice, Pasta & Canned Food',
    icon: Wheat,
    color: 'bg-yellow-100 text-yellow-600',
    gradient: 'from-yellow-400 to-amber-500',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop',
    bgColor: '#fefce8',
  },
  {
    id: 'snacks_drinks',
    name: 'Snacks',
    icon: Cookie,
    color: 'bg-orange-100 text-orange-600',
    gradient: 'from-orange-400 to-amber-500',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop',
    bgColor: '#fff7ed',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-600',
    gradient: 'from-amber-400 to-orange-500',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop',
    bgColor: '#fffbeb',
  },
  {
    id: 'frozen',
    name: 'Frozen Food',
    icon: Snowflake,
    color: 'bg-cyan-100 text-cyan-600',
    gradient: 'from-cyan-400 to-teal-500',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop',
    bgColor: '#ecfeff',
  },
  {
    id: 'personal_care',
    name: 'Beauty & Self-Care',
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-600',
    gradient: 'from-pink-400 to-rose-500',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    bgColor: '#fdf2f8',
  },
  {
    id: 'household',
    name: 'Household Cleaning',
    icon: Home,
    color: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-400 to-violet-500',
    image: 'https://images.unsplash.com/photo-1585241936939-be4099591252?w=300&h=300&fit=crop',
    bgColor: '#faf5ff',
  },
  {
    id: 'baby_care',
    name: 'Baby & Kids',
    icon: Baby,
    color: 'bg-sky-100 text-sky-600',
    gradient: 'from-sky-400 to-blue-500',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop',
    bgColor: '#f0f9ff',
  },
];

// Allow admin overrides stored in localStorage
const CUSTOM_CATEGORIES_KEY = 'ballia_categories';

export function getCategories() {
  try {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (stored) {
      const custom = JSON.parse(stored);
      const defaultMap = Object.fromEntries(defaultCategories.map(c => [c.id, c]));
      return custom.map(c => ({ ...defaultMap[c.id], ...c }));
    }
  } catch {}
  return defaultCategories;
}

export function saveCategories(cats) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
  window.dispatchEvent(new Event('categories-updated'));
}

export const categories = defaultCategories;

export function getCategoryById(id) {
  return getCategories().find(c => c.id === id) || defaultCategories.find(c => c.id === id);
}