import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { logoUrl } from '@/api/localClient';

import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import Home from '@/pages/Home.jsx';
import SearchPage from '@/pages/SearchPage.jsx';
import CategoryPage from '@/pages/CategoryPage';
import ProductDetail from '@/pages/ProductDetail.jsx';
import Cart from '@/pages/Cart';
import Profile from './pages/Profile.jsx';
import MyOrders from '@/pages/MyOrders';
import OrderTracking from '@/pages/OrderTracking.jsx';

import Checkout from '@/pages/Checkout';
import Refunds from '@/pages/profile/Refunds';
import WishlistPage from '@/pages/profile/WishlistPage';
import SavedAddresses from '@/pages/profile/SavedAddresses';
import HelpSupport from '@/pages/profile/HelpSupport';
import ProfileEdit from '@/pages/profile/ProfileEdit';
import PaymentManagement from '@/pages/profile/PaymentManagement';
import CategoriesPage from '@/pages/CategoriesPage';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminProducts from '@/pages/admin/Products';
import AdminOrders from '@/pages/admin/Orders';
import UsersAdmin from '@/pages/admin/UsersAdmin';
import CouponsAdmin from '@/pages/admin/Coupons';
import BannersAdmin from '@/pages/admin/Banners';
import AnalyticsAdmin from '@/pages/admin/Analytics';
import SupportAdmin from '@/pages/admin/SupportAdmin';
import AdminCategories from '@/pages/admin/AdminCategories';
import RiderPanel from '@/pages/RiderPanel';
import UpiPayment from '@/pages/UpiPayment';
import UpiConfirm from '@/pages/UpiConfirm';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src={logoUrl} alt="Ballia Saathi" className="w-12 h-12 rounded-2xl object-cover animate-pulse" />
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Customer Routes with bottom nav */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>

      {/* Full-screen pages (no bottom nav) */}
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/order/:orderId" element={<OrderTracking />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/profile/refunds" element={<Refunds />} />
      <Route path="/profile/wishlist" element={<WishlistPage />} />
      <Route path="/profile/addresses" element={<SavedAddresses />} />
      <Route path="/profile/help" element={<HelpSupport />} />
      <Route path="/profile/edit" element={<ProfileEdit />} />
      <Route path="/profile/payment" element={<PaymentManagement />} />

      {/* Rider Panel */}
      <Route path="/rider" element={<RoleRoute roles={['rider', 'super_admin']}><RiderPanel /></RoleRoute>} />
      <Route path="/upi-payment" element={<UpiPayment />} />
      <Route path="/upi-confirm" element={<UpiConfirm />} />

      {/* Admin Routes */}
      <Route element={<RoleRoute roles={['admin', 'super_admin']}><AdminLayout /></RoleRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/users" element={<UsersAdmin />} />
        <Route path="/admin/coupons" element={<CouponsAdmin />} />
        <Route path="/admin/banners" element={<BannersAdmin />} />
        <Route path="/admin/analytics" element={<AnalyticsAdmin />} />
        <Route path="/admin/support" element={<SupportAdmin />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const RoleRoute = ({ roles, children }) => {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role || 'user')) return <Navigate to="/profile" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
