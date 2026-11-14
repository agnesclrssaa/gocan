import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AUTH_TOKEN_KEY } from './lib/api';
import FloatingCart from './components/customer/FloatingCart';
import { AlertCircle, X } from 'lucide-react';

// Intro Loading Screen
import IntroLoadingScreen from './components/common/IntroLoadingScreen';
import SplashScreen from './components/common/SplashScreen';
import WelcomeScreen from './components/common/WelcomeScreen';
import { useCallback, useState } from 'react';

// Layouts
import CanteenLayout from './layouts/CanteenLayout';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Canteens from './pages/customer/Canteens';
import CanteenDetail from './pages/customer/CanteenDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import OrderTracking from './pages/customer/OrderTracking';
import History from './pages/customer/History';
import MenuPreview from './pages/customer/MenuPreview';
import Profile from './pages/Profile';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Canteen (Merchant) Pages
import CanteenDashboard from './pages/canteen/CanteenDashboard';
import CanteenOrders from './pages/canteen/CanteenOrders';
import CanteenMenuSales from './pages/canteen/CanteenMenuSales';

// Runner (Delivery) Pages
import RunnerDashboard from './pages/runner/RunnerDashboard';
import RunnerOrders from './pages/runner/RunnerOrders';
import RunnerDetail from './pages/runner/RunnerDetail';
import RunnerPortal from './pages/runner/RunnerPortal';
import RunnerProfile from './pages/runner/RunnerProfile';
import CourierDashboard from './pages/CourierDashboard';

// Super Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCampus from './pages/admin/AdminCampus';
import AdminFinance from './pages/admin/AdminFinance';
import AdminManagement from './pages/admin/AdminManagement';
import AdminRunners from './pages/admin/AdminRunners';
import ProtectedRoute from './routes/ProtectedRoute';

const roleHome = {
  customer: '/',
  canteen: '/canteen-dashboard',
  canteen_staff: '/canteen-dashboard',
  runner: '/runner-portal',
  courier: '/courier-dashboard',
  admin: '/admin-portal',
};

function PublicEntryFlow() {
  const [screen, setScreen] = useState('splash');
  const { user, profile, loading } = useAuth();

  const finishSplash = useCallback(() => {
    setScreen('welcome');
  }, []);

  const startOrdering = useCallback(() => setScreen('auth'), []);

  if (loading && localStorage.getItem(AUTH_TOKEN_KEY)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F9]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2152B7] border-t-transparent" />
      </div>
    );
  }

  if (user && screen !== 'auth') {
    const destination = profile ? roleHome[profile.role] : '/';
    return <Navigate to={destination || '/unauthorized'} replace />;
  }

  if (screen === 'splash') {
    return (
      <SplashScreen
        onComplete={finishSplash}
        onSkip={finishSplash}
      />
    );
  }

  if (screen === 'welcome') {
    return (
      <WelcomeScreen onStart={startOrdering} />
    );
  }

  return <Outlet />;
}

function RoleLanding() {
  const { user, profile, loading, authError, refreshProfile, signOut } = useAuth();

  if (loading && localStorage.getItem(AUTH_TOKEN_KEY)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F9]">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0A2E6E] border-t-transparent" />
          <p className="text-sm font-bold text-slate-800">Memuat akun GoCan...</p>
        </div>
      </div>
    );
  }

  // Public users go through the splash and welcome flow before authentication.
  if (!user) return <Navigate to="/login" replace />;

  // Jika user login tetapi profil masih dalam antrean muat
  if (!profile) {
    if (authError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F0F4F9] p-4">
          <div role="alert" className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-black text-slate-900">Profil akun gagal dimuat</h1>
            <p className="text-sm text-slate-500">{authError}</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={refreshProfile}
                className="rounded-xl bg-[#0A2E6E] px-4 py-2.5 text-xs font-bold text-white"
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700"
              >
                Keluar
              </button>
            </div>
          </div>
        </main>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F9]">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0A2E6E] border-t-transparent" />
          <p className="text-sm font-bold text-slate-800">Menyiapkan profil Anda...</p>
        </div>
      </div>
    );
  }

  // Keep the storefront available at the root URL for customers and canteen partners.
  if (profile.role === 'customer') return <CustomerLayout><Home /></CustomerLayout>;

  if (profile.role === 'canteen' || profile.role === 'canteen_staff') return <Home />;

  // Role selain customer dialihkan ke portal masing-masing
  const destination = roleHome[profile.role];
  return destination ? (
    <Navigate to={destination} replace />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}

function Unauthorized() {
  const { user, profile, signOut } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F4F9] px-6 text-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <span className="text-2xl font-black">!</span>
        </div>
        <h1 className="text-2xl font-black text-[#0A2E6E]">Akses Tidak Diizinkan</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          {user
            ? `Akun Anda terdaftar dengan role "${profile?.role || 'tidak terdefinisi'}" yang tidak memiliki izin untuk membuka halaman ini.`
            : 'Silakan masuk dengan akun yang memiliki hak akses yang sesuai.'}
        </p>

        <div className="pt-2 flex flex-col gap-2">
          {user && profile?.role && roleHome[profile.role] && (
            <Link
              to={roleHome[profile.role]}
              className="py-2.5 px-4 rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold transition"
            >
              Kembali ke Portal Saya
            </Link>
          )}
          {user ? (
            <button
              onClick={() => signOut()}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Keluar dari Akun Ini
            </button>
          ) : (
            <Link
              to="/login"
              className="py-2.5 px-4 rounded-xl bg-[#0A2E6E] text-white text-xs font-bold transition"
            >
              Halaman Masuk
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function ApiNotice() {
  const { apiNotice, dismissApiNotice } = useAuth();

  if (!apiNotice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 text-sm text-slate-800 shadow-xl"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#0A2E6E]" />
      <p className="flex-1">{apiNotice.message}</p>
      <button
        type="button"
        onClick={dismissApiNotice}
        aria-label="Tutup notifikasi"
        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<RoleLanding />} />
            <Route path="/landing" element={<IntroLoadingScreen />} />
            <Route path="/intro" element={<IntroLoadingScreen />} />

            <Route element={<PublicEntryFlow />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/menu-preview" element={<CustomerLayout><MenuPreview /></CustomerLayout>} />

            <Route element={<ProtectedRoute requireApproval={false} />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route element={<CustomerLayout />}>
                <Route path="/canteens" element={<Canteens />} />
                <Route path="/canteen/:canteenId" element={<CanteenDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/orders/:orderId" element={<OrderTracking />} />
                <Route path="/order/:orderId" element={<OrderTracking />} />
                <Route path="/history" element={<History />} />
                <Route path="/customer-preview">
                  <Route index element={<Home />} />
                  <Route path="canteen/:canteenId" element={<CanteenDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="order-success/:orderId" element={<OrderSuccess />} />
                  <Route path="orders/:orderId" element={<OrderTracking />} />
                  <Route path="order/:orderId" element={<OrderTracking />} />
                  <Route path="history" element={<History />} />
                </Route>
              </Route>
            </Route>

            {/* Canteen Portal Routes (Terproteksi Role & Approval) */}
            <Route element={<ProtectedRoute allowedRoles={['canteen', 'canteen_staff']} requireApproval={false} />}>
              <Route path="/canteen-dashboard" element={<CanteenLayout />}>
                <Route index element={<CanteenDashboard />} />
                <Route path="orders" element={<CanteenOrders />} />
                <Route path="menu" element={<CanteenMenuSales />} />
              </Route>
              <Route path="/canteen-portal" element={<CanteenLayout />}>
                <Route index element={<CanteenDashboard />} />
                <Route path="orders" element={<CanteenOrders />} />
                <Route path="menu" element={<CanteenMenuSales />} />
              </Route>
            </Route>

            {/* Runner Portal Routes (Terproteksi Role & Approval) */}
            <Route element={<ProtectedRoute allowedRoles={['runner']} requireApproval={false} />}>
              <Route path="/runner-portal" element={<RunnerPortal />}>
                <Route index element={<RunnerDashboard />} />
                <Route path="orders" element={<RunnerOrders />} />
                <Route path="jobs" element={<RunnerOrders />} />
                <Route path="detail" element={<RunnerDetail />} />
                <Route path="profile" element={<RunnerProfile />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['courier']} requireApproval={false} />}>
              <Route path="/courier-dashboard" element={<CourierDashboard />} />
              <Route path="/courier-portal" element={<CourierDashboard />} />
            </Route>

            {/* Super Admin Portal Routes (Terproteksi Role Admin Sahaja) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} requireApproval={false} />}>
              <Route path="/admin-portal" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="campus" element={<AdminCampus />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="management" element={<AdminManagement />} />
                <Route path="runners" element={<AdminRunners />} />
              </Route>
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FloatingCart />
          <ApiNotice />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
