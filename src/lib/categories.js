import { Apple, Milk, Cookie, Fish, Wheat, Sparkles, Home, Baby, Snowflake, Coffee, ShoppingBag, IceCreamBowl, Candy, Soup } from 'lucide-react';

const categoryAsset = (name) => `/assets/categories/${name}.png`;

export const defaultCategories = [
  {
    id: 'fruits_vegetables',
    name: 'Fruits & Vegetables',
    icon: Apple,
    group: 'Grocery & Kitchen',
    wide: true,
    color: 'bg-green-100 text-green-600',
    gradient: 'from-green-400 to-emerald-500',
    image: categoryAsset('fruits-vegetables'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'dairy_bread',
    name: 'Dairy, Bread & Eggs',
    icon: Milk,
    group: 'Grocery & Kitchen',
    color: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-400 to-cyan-500',
    image: categoryAsset('dairy-bread-eggs'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'staples',
    name: 'Atta, Rice, Oil & Dals',
    icon: Wheat,
    group: 'Grocery & Kitchen',
    color: 'bg-yellow-100 text-yellow-600',
    gradient: 'from-yellow-400 to-amber-500',
    image: categoryAsset('atta-rice-oil-dals'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'meat_fish',
    name: 'Meat, Fish & Eggs',
    icon: Fish,
    group: 'Grocery & Kitchen',
    color: 'bg-red-100 text-red-600',
    gradient: 'from-red-400 to-rose-500',
    image: categoryAsset('meat-fish-eggs'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'masala_dry_fruits',
    name: 'Masala & Dry Fruits',
    icon: Soup,
    group: 'Grocery & Kitchen',
    color: 'bg-rose-100 text-rose-600',
    gradient: 'from-rose-400 to-orange-500',
    image: categoryAsset('masala-dry-fruits'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'breakfast_sauces',
    name: 'Breakfast & Sauces',
    icon: ShoppingBag,
    group: 'Grocery & Kitchen',
    color: 'bg-orange-100 text-orange-600',
    gradient: 'from-orange-400 to-red-500',
    image: categoryAsset('breakfast-sauces'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'packaged_food',
    name: 'Packaged Food',
    icon: Cookie,
    group: 'Grocery & Kitchen',
    color: 'bg-amber-100 text-amber-600',
    gradient: 'from-amber-400 to-orange-500',
    image: categoryAsset('packaged-food'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'tea_coffee',
    name: 'Tea, Coffee & More',
    icon: Coffee,
    group: 'Snacks & Drinks',
    wide: true,
    color: 'bg-amber-100 text-amber-600',
    gradient: 'from-amber-400 to-orange-500',
    image: categoryAsset('tea-coffee-more'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'ice_creams',
    name: 'Ice Creams & More',
    icon: IceCreamBowl,
    group: 'Snacks & Drinks',
    color: 'bg-cyan-100 text-cyan-600',
    gradient: 'from-cyan-400 to-blue-500',
    image: categoryAsset('ice-creams-more'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'frozen',
    name: 'Frozen Food',
    icon: Snowflake,
    group: 'Snacks & Drinks',
    color: 'bg-cyan-100 text-cyan-600',
    gradient: 'from-cyan-400 to-teal-500',
    image: categoryAsset('frozen-food'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'sweet_cravings',
    name: 'Sweet Cravings',
    icon: Candy,
    group: 'Snacks & Drinks',
    color: 'bg-pink-100 text-pink-600',
    gradient: 'from-pink-400 to-rose-500',
    image: categoryAsset('sweet-cravings'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'beverages',
    name: 'Cold Drinks & Juices',
    icon: Coffee,
    group: 'Snacks & Drinks',
    color: 'bg-sky-100 text-sky-600',
    gradient: 'from-sky-400 to-blue-500',
    image: categoryAsset('cold-drinks-juices'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'snacks_drinks',
    name: 'Munchies',
    icon: Cookie,
    group: 'Snacks & Drinks',
    color: 'bg-orange-100 text-orange-600',
    gradient: 'from-orange-400 to-amber-500',
    image: categoryAsset('munchies'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'biscuits_cookies',
    name: 'Biscuits & Cookies',
    icon: Cookie,
    group: 'Snacks & Drinks',
    color: 'bg-yellow-100 text-yellow-700',
    gradient: 'from-yellow-400 to-orange-500',
    image: categoryAsset('biscuits-cookies'),
    bgColor: '#f7f7f7',
  },
  {
    id: 'personal_care',
    name: 'Beauty & Self-Care',
    icon: Sparkles,
    group: 'Personal & Home',
    color: 'bg-pink-100 text-pink-600',
    gradient: 'from-pink-400 to-rose-500',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    bgColor: '#fdf2f8',
  },
  {
    id: 'household',
    name: 'Household Cleaning',
    icon: Home,
    group: 'Personal & Home',
    color: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-400 to-violet-500',
    image: 'https://images.unsplash.com/photo-1585241936939-be4099591252?w=300&h=300&fit=crop',
    bgColor: '#faf5ff',
  },
  {
    id: 'baby_care',
    name: 'Baby & Kids',
    icon: Baby,
    group: 'Personal & Home',
    color: 'bg-sky-100 text-sky-600',
    gradient: 'from-sky-400 to-blue-500',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop',
    bgColor: '#f0f9ff',
  },
];

// Allow admin overrides stored in localStorage
const CUSTOM_CATEGORIES_KEY = 'ballia_categories';
const CATEGORIES_VERSION_KEY = 'ballia_categories_version';
const CATEGORIES_VERSION = 'blinkit_style_categories_v1';

const cleanStoredCategory = (category) => {
  const { icon: _icon, ...safeCategory } = category || {};
  return safeCategory;
};

export function getCategories() {
  try {
    const version = localStorage.getItem(CATEGORIES_VERSION_KEY);
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (stored) {
      const custom = JSON.parse(stored).map(cleanStoredCategory);
      const defaultMap = Object.fromEntries(defaultCategories.map(c => [c.id, c]));
      if (version !== CATEGORIES_VERSION) {
        const customOnly = custom.filter(c => !defaultMap[c.id]);
        const migrated = [...defaultCategories, ...customOnly];
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(migrated));
        localStorage.setItem(CATEGORIES_VERSION_KEY, CATEGORIES_VERSION);
        return migrated;
      }
      const customIds = new Set(custom.map(c => c.id));
      const mergedCustom = custom.map(c => ({ ...defaultMap[c.id], ...c }));
      const missingDefaults = defaultCategories.filter(c => !customIds.has(c.id));
      return [...mergedCustom, ...missingDefaults];
    }
  } catch {}
  return defaultCategories;
}

export function saveCategories(cats) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
  localStorage.setItem(CATEGORIES_VERSION_KEY, CATEGORIES_VERSION);
  window.dispatchEvent(new Event('categories-updated'));
}

export const categories = defaultCategories;

export function getCategoryById(id) {
  return getCategories().find(c => c.id === id) || defaultCategories.find(c => c.id === id);
}

export function getCategoryGroups(cats = getCategories()) {
  return cats.reduce((groups, cat) => {
    const groupName = cat.group || 'More Categories';
    const existing = groups.find(group => group.name === groupName);
    if (existing) {
      existing.categories.push(cat);
    } else {
      groups.push({ name: groupName, categories: [cat] });
    }
    return groups;
  }, []);
}
