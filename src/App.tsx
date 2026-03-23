import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/Layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading para componentes pesados
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Solicitacoes = lazy(() => import('./pages/Solicitacoes'));
const Demandas = lazy(() => import('./pages/Demandas'));
const Acessos = lazy(() => import('./pages/Acessos'));
const Perfil = lazy(() => import('./pages/Perfil'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const MapaFortaleza = lazy(() => import('./pages/MapaFortaleza'));
const ItemDetalhes = lazy(() => import('./pages/ItemDetalhes'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Auth = lazy(() => import('./components/Auth/Auth'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function ProtectedRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/solicitacoes" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Solicitacoes />
          </Suspense>
        } />
        <Route path="/demandas" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Demandas />
          </Suspense>
        } />
        <Route path="/acessos" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Acessos />
          </Suspense>
        } />
        <Route path="/mapa-fortaleza" element={
          <Suspense fallback={<LoadingSpinner />}>
            <MapaFortaleza />
          </Suspense>
        } />
        <Route path="/relatorios" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Relatorios />
          </Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminPanel />
          </Suspense>
        } />
        <Route path="/perfil" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Perfil />
          </Suspense>
        } />
        <Route path="/solicitacoes/:itemId" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ItemDetalhes />
          </Suspense>
        } />
        <Route path="/demandas/:itemId" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ItemDetalhes />
          </Suspense>
        } />
        <Route path="/todos/:itemId" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ItemDetalhes />
          </Suspense>
        } />
        <Route path="/notifications" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Notifications />
          </Suspense>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Auth />
                  </Suspense>
                } />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;