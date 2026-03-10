import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, FileText, ClipboardList, LogOut, Shield, User, Settings, BarChart3, Map } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo-nexus-156.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'solicitacoes', name: 'Solicitações', icon: FileText },
    { id: 'demandas', name: 'Demandas', icon: ClipboardList },
    { id: 'mapa-fortaleza', name: 'Mapa', icon: Map },
    { id: 'relatorios', name: 'Relatórios', icon: BarChart3 },
  ];

  const adminTabs = [
    { id: 'admin', name: 'Admin', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="flex items-center">
                <img src={logo} alt="Nexus 156" className="h-40 w-auto object-contain" />
              </a>

              <div className="hidden md:flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(`/${tab.id}`)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aba Admin - só para administradores */}
              {profile?.role === 'admin' && (
                <div className="hidden md:flex space-x-1 ml-4 pl-4 border-l border-gray-200">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => navigate(`/${tab.id}`)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                {profile?.role === 'admin' ? (
                  <Shield className="w-5 h-5 text-orange-600" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}

                {/* Nome clicável que leva para perfil */}
                <button
                  onClick={() => navigate('/perfil')}
                  className="text-gray-700 font-medium hover:underline"
                >
                  {profile?.full_name?.split(' ')[0] || 'Usuário'}
                </button>

                {profile?.role === 'admin' && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={async () => await signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          <div className="md:hidden flex space-x-1 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/${tab.id}`)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}