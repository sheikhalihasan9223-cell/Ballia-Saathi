import {
  createUserWithEmailAndPassword,
  confirmPasswordReset,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  firebaseAuth,
  firebaseStorage,
  firestore,
  googleProvider,
  isFirebaseConfigured,
} from '@/lib/firebase';

const STORE_PREFIX = 'ballia_saathi';
const CURRENT_USER_KEY = `${STORE_PREFIX}_current_user`;
const TOKEN_KEY = `${STORE_PREFIX}_token`;
const USER_ROLE_UPDATED_EVENT = 'ballia-saathi-user-role-updated';

const now = () => new Date().toISOString();
const FIRESTORE_READ_TIMEOUT_MS = 600;
const PRODUCT_CATALOG_VERSION = 'blinkit_selected_categories_v2';
const PRODUCT_CATALOG_VERSION_KEY = `${STORE_PREFIX}_product_catalog_version`;
const PRODUCT_CLEAR_VERSION = 'products_deleted_2026_06_10';
const PRODUCT_CLEAR_VERSION_KEY = `${STORE_PREFIX}_product_clear_version`;

const id = (prefix) => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

const logoUrl = '/assets/ballia-saathi-logo.png';

const initialData = {
  User: [
    {
      id: 'user_admin',
      email: 'admin@balliasaathi.local',
      full_name: 'Ballia Saathi Admin',
      name: 'Ballia Saathi Admin',
      role: 'admin',
      phone: '+91 98765 43210',
      avatar_url: logoUrl,
      created_date: now(),
      updated_date: now(),
    },
  ],
  Product: [],
  Banner: [
    {
      id: 'banner_daily',
      title: 'Daily Grocery Deals',
      subtitle: 'Fresh essentials delivered around Ballia.',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=500&fit=crop',
      link: '/categories/fruits_vegetables',
      is_active: true,
      position: 1,
      created_date: now(),
      updated_date: now(),
    },
  ],
  Coupon: [
    {
      id: 'coupon_welcome',
      code: 'WELCOME10',
      description: '10% off your local demo order',
      discount_type: 'percentage',
      discount_value: 10,
      min_order: 199,
      max_discount: 80,
      usage_limit: 500,
      used_count: 0,
      is_active: true,
      expires_at: '2026-12-31',
      created_date: now(),
      updated_date: now(),
    },
  ],
  Address: [],
  Order: [],
  RiderLocation: [],
  SupportTicket: [],
  Wishlist: [],
};

const entityNames = Object.keys(initialData);

const storageKey = (entityName) => `${STORE_PREFIX}_${entityName}`;

const read = (entityName) => {
  ensureSeeded();
  try {
    return JSON.parse(localStorage.getItem(storageKey(entityName))) || [];
  } catch {
    return [];
  }
};

const write = (entityName, records) => {
  localStorage.setItem(storageKey(entityName), JSON.stringify(records));
  return records;
};

const ensureSeeded = () => {
  if (typeof localStorage === 'undefined') return;

  for (const [entityName, records] of Object.entries(initialData)) {
    if (!localStorage.getItem(storageKey(entityName))) {
      localStorage.setItem(storageKey(entityName), JSON.stringify(records));
    }
  }

  if (localStorage.getItem(PRODUCT_CLEAR_VERSION_KEY) !== PRODUCT_CLEAR_VERSION) {
    localStorage.setItem(storageKey('Product'), JSON.stringify([]));
    localStorage.setItem(PRODUCT_CLEAR_VERSION_KEY, PRODUCT_CLEAR_VERSION);
    localStorage.removeItem(PRODUCT_CATALOG_VERSION_KEY);
  }
};

const sortRecords = (records, sort) => {
  if (!sort) return records;

  const descending = sort.startsWith('-');
  const key = descending ? sort.slice(1) : sort;

  return [...records].sort((a, b) => {
    const left = a[key] ?? '';
    const right = b[key] ?? '';
    if (left < right) return descending ? 1 : -1;
    if (left > right) return descending ? -1 : 1;
    return 0;
  });
};

const matches = (record, criteria = {}) =>
  Object.entries(criteria).every(([key, value]) => record[key] === value);

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);

const createEntityApi = (entityName) => ({
  async list(sort, limit) {
    if (entityName === 'Product') await ensureProductCatalogLoaded();

    if (isFirebaseConfigured) {
      try {
        return await listFirestoreRecords(entityName, {}, sort, limit);
      } catch (error) {
        console.warn(`Using local ${entityName} data because Firestore is unavailable:`, error);
      }
    }
    const records = sortRecords(read(entityName), sort);
    return typeof limit === 'number' ? records.slice(0, limit) : records;
  },

  async filter(criteria = {}, sort, limit) {
    if (entityName === 'Product') await ensureProductCatalogLoaded();

    if (isFirebaseConfigured) {
      try {
        return await listFirestoreRecords(entityName, criteria, sort, limit);
      } catch (error) {
        console.warn(`Using local ${entityName} data because Firestore is unavailable:`, error);
      }
    }
    const records = sortRecords(read(entityName).filter((record) => matches(record, criteria)), sort);
    return typeof limit === 'number' ? records.slice(0, limit) : records;
  },

  async create(data) {
    if (isFirebaseConfigured) {
      try {
        const record = await createFirestoreRecord(entityName, data);
        mirrorLocalRecord(entityName, record);
        return record;
      } catch (error) {
        console.warn(`Creating ${entityName} locally because Firestore is unavailable:`, error);
      }
    }
    const record = {
      ...data,
      id: data.id || id(entityName.toLowerCase()),
      created_date: data.created_date || now(),
      updated_date: now(),
    };
    write(entityName, [record, ...read(entityName)]);
    return record;
  },

  async update(recordId, data) {
    if (isFirebaseConfigured) {
      try {
        const record = await updateFirestoreRecord(entityName, recordId, data);
        mirrorLocalRecord(entityName, record);
        return record;
      } catch (error) {
        console.warn(`Updating ${entityName} locally because Firestore is unavailable:`, error);
      }
    }
    let updated;
    const records = read(entityName).map((record) => {
      if (record.id !== recordId) return record;
      updated = { ...record, ...data, id: record.id, updated_date: now() };
      return updated;
    });
    if (!updated) {
      updated = {
        ...data,
        id: recordId,
        created_date: data.created_date || now(),
        updated_date: now(),
      };
      write(entityName, [updated, ...records]);
      if (entityName === 'User') upsertLocalUser(updated);
      return updated;
    }
    write(entityName, records);
    if (entityName === 'User') upsertLocalUser(updated);
    return updated;
  },

  async delete(recordId) {
    if (isFirebaseConfigured) {
      try {
        await withTimeout(
          deleteDoc(doc(firestore, collectionName(entityName), recordId)),
          FIRESTORE_READ_TIMEOUT_MS,
          `${entityName} Firestore delete`,
        );
        write(entityName, read(entityName).filter((record) => record.id !== recordId));
        return { id: recordId, deleted: true };
      } catch (error) {
        console.warn(`Deleting ${entityName} locally because Firestore is unavailable:`, error);
      }
    }
    write(entityName, read(entityName).filter((record) => record.id !== recordId));
    return { id: recordId, deleted: true };
  },
});

const mirrorLocalRecord = (entityName, record) => {
  if (entityName === 'User') {
    upsertLocalUser(record);
    return;
  }

  const records = read(entityName);
  const existing = records.find((item) => item.id === record.id);
  write(
    entityName,
    existing
      ? records.map((item) => (item.id === record.id ? { ...item, ...record } : item))
      : [record, ...records],
  );
};

const collectionName = (entityName) => entityName.charAt(0).toLowerCase() + entityName.slice(1);

const listFirestoreRecords = async (entityName, criteria = {}, sort, limit) => {
  const snapshot = await withTimeout(
    getDocs(collection(firestore, collectionName(entityName))),
    entityName === 'User' ? 2000 : FIRESTORE_READ_TIMEOUT_MS,
    `${entityName} Firestore read`,
  );
  const records = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((record) => matches(record, criteria));

  const mergedRecords = entityName === 'User'
    ? mergeRecords(records, read('User')).filter((record) => matches(record, criteria))
    : entityName === 'Product' && records.length === 0
      ? read('Product').filter((record) => matches(record, criteria))
      : records;

  const sorted = sortRecords(mergedRecords, sort);
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
};

const mergeRecords = (primary, secondary) => {
  const seen = new Set();
  return [...primary, ...secondary].filter((record) => {
    const key = record.id || record.email;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const createFirestoreRecord = async (entityName, data) => {
  const record = {
    ...data,
    created_date: data.created_date || now(),
    updated_date: now(),
  };
  const docRef = data.id
    ? doc(firestore, collectionName(entityName), data.id)
    : await withTimeout(
        addDoc(collection(firestore, collectionName(entityName)), record),
        FIRESTORE_READ_TIMEOUT_MS,
        `${entityName} Firestore create`,
      );

  if (data.id) {
    await withTimeout(
      setDoc(docRef, record),
      FIRESTORE_READ_TIMEOUT_MS,
      `${entityName} Firestore create`,
    );
  }

  return { ...record, id: docRef.id };
};

const updateFirestoreRecord = async (entityName, recordId, data) => {
  const docRef = doc(firestore, collectionName(entityName), recordId);
  const updated = { ...data, updated_date: now() };
  await withTimeout(
    updateDoc(docRef, updated),
    FIRESTORE_READ_TIMEOUT_MS,
    `${entityName} Firestore update`,
  );
  const snapshot = await withTimeout(
    getDoc(docRef),
    FIRESTORE_READ_TIMEOUT_MS,
    `${entityName} Firestore read`,
  );
  if (!snapshot.exists()) throw new Error(`${entityName} record not found`);
  return { id: snapshot.id, ...snapshot.data() };
};

const normalizeUser = (user) => {
  if (!user?.email) return null;
  const emailName = user.email.split('@')[0];
  const fullName = user.full_name || user.name || emailName;
  const role = user.role || (user.email.toLowerCase().startsWith('admin') ? 'admin' : 'user');
  return {
    id: user.id || `user_${user.email.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    ...user,
    full_name: fullName,
    name: fullName,
    role,
    created_date: user.created_date || now(),
    updated_date: now(),
  };
};

const setCurrentUser = (user) => {
  const normalized = normalizeUser(user);
  if (!normalized) return null;

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
  localStorage.setItem(TOKEN_KEY, `local-${normalized.id}`);
  localStorage.setItem('token', `local-${normalized.id}`);
  localStorage.setItem('user', JSON.stringify(normalized));

  upsertLocalUser(normalized);

  return normalized;
};

const upsertLocalUser = (user) => {
  const normalized = normalizeUser(user);
  if (!normalized) return null;

  const users = read('User');
  const existing = users.find((item) => item.id === normalized.id || item.email === normalized.email);
  const merged = existing
    ? {
        ...existing,
        ...normalized,
        role: normalized.role === 'user' && existing.role ? existing.role : normalized.role,
      }
    : normalized;

  if (existing) {
    write('User', users.map((item) => (
      item.id === existing.id || item.email === existing.email
        ? { ...merged, id: item.id || normalized.id, updated_date: now() }
        : item
    )));
  } else {
    write('User', [merged, ...users]);
  }

  const cached = getCachedUser();
  if (cached && (cached.id === merged.id || cached.email === merged.email)) {
    const updatedCurrent = { ...cached, ...merged, updated_date: now() };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
    localStorage.setItem('user', JSON.stringify(updatedCurrent));
    window.dispatchEvent(new CustomEvent(USER_ROLE_UPDATED_EVENT, { detail: updatedCurrent }));
  }

  return merged;
};

const getUserByIdentity = async (user) => {
  if (!user?.email && !user?.id) return user;
  const users = read('User');
  return users.find((item) => item.id === user.id || item.email === user.email) || user;
};

const getCurrentUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('user'));
    const user = normalizeUser(stored);
    if (user) return setCurrentUser(user);
  } catch {}

  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
  if (!token) throw Object.assign(new Error('Not signed in'), { status: 401 });

  return setCurrentUser({
    email: 'admin@balliasaathi.local',
    full_name: 'Ballia Saathi Admin',
    role: 'admin',
    avatar_url: logoUrl,
  });
};

const getCachedUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('user'));
    return normalizeUser(stored);
  } catch {
    return null;
  }
};

const waitForFirebaseUser = () =>
  new Promise((resolve, reject) => {
    if (!firebaseAuth) {
      reject(Object.assign(new Error('Firebase is not configured'), { status: 500 }));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });

const normalizeFirebaseUser = async (user) => {
  if (!user) throw Object.assign(new Error('Not signed in'), { status: 401 });

  const userDoc = doc(firestore, collectionName('User'), user.uid);
  let saved = {};
  try {
    const snapshot = await withTimeout(
      getDoc(userDoc),
      FIRESTORE_READ_TIMEOUT_MS,
      'User profile Firestore read',
    );
    saved = snapshot.exists() ? snapshot.data() : {};
  } catch (error) {
    console.warn('Could not load Firestore user profile; using auth profile only:', error);
  }

  const localSaved = await getUserByIdentity({ id: user.uid, email: user.email });
  const normalized = normalizeUser({
    id: user.uid,
    email: user.email,
    full_name: user.displayName || saved.full_name || localSaved.full_name || user.email?.split('@')[0],
    name: user.displayName || saved.name || localSaved.name || user.email?.split('@')[0],
    phone: saved.phone || localSaved.phone || user.phoneNumber || '',
    avatar_url: saved.avatar_url || localSaved.avatar_url || user.photoURL || '',
    role: saved.role || localSaved.role || (user.email?.toLowerCase().startsWith('admin') ? 'admin' : 'user'),
    created_date: saved.created_date || localSaved.created_date || now(),
    ...saved,
  });

  try {
    setDoc(userDoc, normalized, { merge: true }).catch((error) => {
      console.warn('Could not save Firestore user profile yet:', error);
    });
  } catch (error) {
    console.warn('Could not save Firestore user profile yet:', error);
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
  localStorage.setItem('user', JSON.stringify(normalized));
  const merged = upsertLocalUser(normalized) || normalized;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(merged));
  localStorage.setItem('user', JSON.stringify(merged));
  return merged;
};

const parseCsv = (text) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);

  const [headers = [], ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), coerceValue(cells[index]?.trim() || '')])),
  );
};

const coerceValue = (value) => {
  const normalized = String(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
};

const categoryMap = {
  'BABY AND KIDS': 'baby_care',
  'BEAUTY AND SELF CARE': 'personal_care',
  'BEVERAGES': 'beverages',
  'DAIRY AND EGGS': 'dairy_bread',
  'FROZEN FOODS': 'frozen',
  'HOUSEHOLD CLEANING': 'household',
  'MEAT AND SEA FOOD': 'meat_fish',
  'RICE PASTA AND CANNED FOODS': 'staples',
  'SNACKS': 'snacks_drinks',
  'FRUITS AND VEGETABLES': 'fruits_vegetables',
  'FRUITS & VEGETABLES': 'fruits_vegetables',
};

const normalizeProductCategory = (category) => {
  const key = String(category || '').trim().toUpperCase();
  return categoryMap[key] || key.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
};

const ensureProductCatalogLoaded = async () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(PRODUCT_CLEAR_VERSION_KEY) === PRODUCT_CLEAR_VERSION) return;
  const existingProducts = read('Product');
  const catalogLooksLoaded = existingProducts.length > 50;
  if (localStorage.getItem(PRODUCT_CATALOG_VERSION_KEY) === PRODUCT_CATALOG_VERSION && catalogLooksLoaded) return;

  try {
    const response = await fetch('/data/blinkit_selected_categories.csv');
    if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
    const rows = parseCsv(await response.text());
    const products = rows
      .filter((row) => row.name && row.price)
      .map((row, index) => ({
        id: `catalog_${index + 1}_${String(row.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 48)}`,
        name: String(row.name || '').trim(),
        price: Number(row.price) || 0,
        original_price: Number(row.original_price) || Number(row.price) || 0,
        category: normalizeProductCategory(row.category),
        unit: String(row.unit || '').trim(),
        stock: Number(row.stock) || 100,
        brand: String(row.brand || '').trim(),
        description: String(row.description || row.name || '').trim(),
        image_url: String(row.image_url || '').trim(),
        is_featured: row.is_featured === true,
        is_daily_offer: Number(row.original_price) > Number(row.price),
        is_active: row.is_active !== false,
        rating: 4.5,
        rating_count: 10 + (index % 90),
        created_date: now(),
        updated_date: now(),
      }));

    if (products.length) {
      write('Product', [...initialData.Product, ...products]);
      localStorage.setItem(PRODUCT_CATALOG_VERSION_KEY, PRODUCT_CATALOG_VERSION);
    }
  } catch (error) {
    console.warn('Could not load bundled product catalog:', error);
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const dataUrlToText = (dataUrl) => {
  const [meta, data = ''] = dataUrl.split(',');
  if (!meta.startsWith('data:')) return dataUrl;
  return meta.includes(';base64') ? atob(data) : decodeURIComponent(data);
};

ensureSeeded();

export const localClient = {
  entities: Object.fromEntries(entityNames.map((entityName) => [entityName, createEntityApi(entityName)])),

  auth: {
    async me() {
      if (isFirebaseConfigured) {
        const cached = getCachedUser();
        if (cached) return normalizeUser({ ...cached, ...(await getUserByIdentity(cached)) });
        if (firebaseAuth.currentUser) return normalizeFirebaseUser(firebaseAuth.currentUser);
        throw Object.assign(new Error('Not signed in'), { status: 401 });
      }
      const current = getCurrentUser();
      return normalizeUser({ ...current, ...(await getUserByIdentity(current)) });
    },

    async register({ email, password }) {
      if (isFirebaseConfigured) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        return normalizeFirebaseUser(credential.user);
      }
      if (!email || !password) throw new Error('Email and password are required');
      localStorage.setItem(`${STORE_PREFIX}_pending_registration`, JSON.stringify({ email, password }));
      return { email, otp_required: true };
    },

    async login({ email, password }) {
      if (isFirebaseConfigured) {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return normalizeFirebaseUser(credential.user);
      }
      return setCurrentUser({ email, full_name: email.split('@')[0] });
    },

    async verifyOtp({ email }) {
      const user = setCurrentUser({ email, full_name: email.split('@')[0] });
      return { access_token: localStorage.getItem(TOKEN_KEY), user };
    },

    async resendOtp() {
      return { sent: true };
    },

    async resetPasswordRequest(email) {
      if (isFirebaseConfigured) {
        return sendPasswordResetEmail(firebaseAuth, email);
      }
      return { sent: true };
    },

    async resetPassword({ resetToken, newPassword }) {
      if (isFirebaseConfigured) {
        return confirmPasswordReset(firebaseAuth, resetToken, newPassword);
      }
      return { success: true };
    },

    async updateMe(data) {
      if (isFirebaseConfigured) {
        const user = firebaseAuth.currentUser || (await waitForFirebaseUser());
        await updateProfile(user, {
          displayName: data.full_name || data.name || user.displayName,
          photoURL: data.avatar_url || user.photoURL,
        });
        await setDoc(doc(firestore, collectionName('User'), user.uid), {
          ...data,
          updated_date: now(),
        }, { merge: true });
        return normalizeFirebaseUser(user);
      }
      const user = setCurrentUser({ ...getCurrentUser(), ...data });
      return user;
    },

    setToken(token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('token', token);
    },

    async logout(redirectUrl) {
      if (isFirebaseConfigured) {
        await signOut(firebaseAuth);
      }
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (redirectUrl) window.location.href = '/login';
    },

    redirectToLogin() {
      window.location.href = '/login';
    },

    async loginWithProvider() {
      if (isFirebaseConfigured) {
        const credential = await signInWithPopup(firebaseAuth, googleProvider);
        return normalizeFirebaseUser(credential.user);
      }
      throw new Error('Google login needs Firebase environment variables.');
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        if (file.name.toLowerCase().endsWith('.csv')) {
          return { file_url: await readFileAsDataUrl(file), file };
        }
        if (isFirebaseConfigured && firebaseStorage) {
          const fileRef = ref(firebaseStorage, `uploads/${Date.now()}-${file.name}`);
          await uploadBytes(fileRef, file);
          return { file_url: await getDownloadURL(fileRef), file };
        }
        return { file_url: await readFileAsDataUrl(file), file };
      },

      async ExtractDataFromUploadedFile({ file_url }) {
        if (!file_url) return { status: 'error', details: 'No file was provided.' };

        const text = dataUrlToText(file_url);
        if (!text.includes(',')) {
          return { status: 'error', details: 'Local import currently supports CSV files. Download the template and upload CSV.' };
        }
        return { status: 'success', output: { products: parseCsv(text) } };
      },

      async InvokeLLM({ prompt } = {}) {
        const text = String(prompt || '').toLowerCase();

        if (text.includes('track') || text.includes('status')) {
          return 'I checked your recent order details. If your order is already placed, you can track the latest status from Your Orders; share the order number here and our team will confirm the exact update.';
        }

        if (text.includes('cancel')) {
          return 'I can help with cancellation. Orders can usually be cancelled while they are still placed or confirmed; if packing or delivery has started, our team will review it manually.';
        }

        if (text.includes('refund')) {
          return 'Refunds usually take 3-5 business days after approval. Online payments go back to the original payment method, and COD refunds can be handled as store credit.';
        }

        if (text.includes('delivery')) {
          return 'Sorry about the delivery trouble. Please share your order number and issue, and our support team will follow up as quickly as possible.';
        }

        if (text.includes('review') || text.includes('feedback')) {
          return 'Thank you for sharing feedback. Tell us what went well or what we should improve, and we will pass it to the Ballia Saathi team.';
        }

        return 'Thanks for contacting Ballia Saathi support. Tell me your order number or describe the issue, and I will help with orders, refunds, delivery, or account questions.';
      },
    },
  },
};

export { logoUrl };
