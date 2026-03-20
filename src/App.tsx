import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Solicitacoes from './pages/Solicitacoes';
import Demandas from './pages/Demandas';
import Acessos from './pages/Acessos';
import Perfil from './pages/Perfil';
import AdminPanel from './pages/AdminPanel';
import Relatorios from './pages/Relatorios';
import MapaFortaleza from './pages/MapaFortaleza';
import ItemDetalhes from './pages/ItemDetalhes';
import Auth from './components/Auth/Auth';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitacoes" element={<Solicitacoes />} />
        <Route path="/demandas" element={<Demandas />} />
        <Route path="/acessos" element={<Acessos />} />
        <Route path="/mapa-fortaleza" element={<MapaFortaleza />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/solicitacoes/:itemId" element={<ItemDetalhes />} />
        <Route path="/demandas/:itemId" element={<ItemDetalhes />} />
        <Route path="/todos/:itemId" element={<ItemDetalhes />} />
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
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;