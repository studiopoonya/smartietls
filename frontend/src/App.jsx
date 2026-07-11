import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Setup = lazy(() => import('./pages/Setup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Writing = lazy(() => import('./pages/learn/Writing'));
const Speaking = lazy(() => import('./pages/learn/Speaking'));
const Reading = lazy(() => import('./pages/learn/Reading'));
const Listening = lazy(() => import('./pages/learn/Listening'));
const CurriculumPage = lazy(() => import('./pages/learn/CurriculumPage'));
const LessonView = lazy(() => import('./pages/learn/LessonView'));
const MockTest = lazy(() => import('./pages/MockTest'));
const Vocabulary    = lazy(() => import('./pages/Vocabulary'));
const Progress      = lazy(() => import('./pages/Progress'));
const Tips            = lazy(() => import('./pages/Tips'));
const Scholarships    = lazy(() => import('./pages/Scholarships'));
const AdminOverview     = lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail   = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminUserProgress = lazy(() => import('./pages/admin/AdminUserProgress'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 },
    mutations: { retry: 0 },
  },
});

function ThemeApplier() {
  const theme = useAppStore(s => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? 'dark');
  }, [theme]);
  return null;
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Protected({ children }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const user = useAppStore(s => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.is_admin) return <Navigate to="/admin" replace />;
  return children;
}

function AdminGuard({ children }) {
  const user = useAppStore(s => s.user);
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<Protected><AppLayout /></Protected>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learn/:skill" element={<CurriculumPage />} />
              <Route path="/learn/:skill/lesson/:lessonId" element={<LessonView />} />
              <Route path="/learn/writing/practice" element={<Writing />} />
              <Route path="/learn/speaking/practice" element={<Speaking />} />
              <Route path="/learn/reading/practice" element={<Reading />} />
              <Route path="/learn/listening/practice" element={<Listening />} />
              <Route path="/mock-test" element={<MockTest />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/scholarships" element={<Scholarships />} />
            </Route>
            <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/users/:id/progress" element={<AdminUserProgress />} />
              <Route path="/setup" element={<Setup />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
