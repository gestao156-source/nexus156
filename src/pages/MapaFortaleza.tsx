import { useState, useEffect } from 'react';
import { MapPin, Filter, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useMapaDataSimple } from '../hooks/useMapaDataSimple';
import { MapaFilters, MapaItem } from '../types';
import FiltrosMapa from '../components/Mapa/FiltrosMapa';
import MapaInterativo from '../components/Mapa/MapaInterativo';
import '../styles/leaflet.css';

export default function MapaFortaleza() {
  // Filtros iniciais
  const filtrosIniciais: MapaFilters = {
    status: [], // Desmarcado - usuário deve escolher
    tipo: '', // Desmarcado - usuário deve escolher
    periodo: {
      inicio: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      fim: new Date()
    },
    regional: 0,
    apenasComCoordenadas: true, // Mudado para true - mostrar apenas com coordenadas
    ordenarPor: 'created_at',
    ordem: 'DESC'
  };

  const [filtros, setFiltros] = useState<MapaFilters>(filtrosIniciais);
  const [isMobile, setIsMobile] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<MapaItem | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  const { dados, loading, error, stats, refetch } = useMapaDataSimple(filtros);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setMostrarFiltros(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleItemSelect = (item: MapaItem) => {
    setItemSelecionado(item);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleAplicarFiltros = () => {
    refetch();
    if (isMobile) {
      setMostrarFiltros(false);
    }
  };

  const toggleFiltros = () => {
    setMostrarFiltros(!mostrarFiltros);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar mapa</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mapa de Fortaleza</h1>
              <p className="text-sm text-gray-600">
                {stats.total} registros • {stats.comCoordenadas} no mapa
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={toggleFiltros}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
              >
                {mostrarFiltros ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {isMobile && (
              <button
                onClick={toggleFiltros}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-blue-600 text-white"
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel de Filtros */}
        {mostrarFiltros && (
          <div className={`${isMobile ? 'absolute inset-0 z-40' : 'w-80'} bg-white shadow-lg overflow-y-auto`}>
            <FiltrosMapa
              filtros={filtros}
              onFiltrosChange={setFiltros}
              onAplicarFiltros={handleAplicarFiltros}
              stats={stats}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* Mapa */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados do mapa...</p>
              </div>
            </div>
          )}
          
          <MapaInterativo
            dados={dados}
            onItemSelect={handleItemSelect}
            isMobile={isMobile}
          />

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
            <h4 className="font-semibold text-sm mb-2">Legenda</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Aguardando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Em Análise</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Finalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>S - Solicitação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>D - Demanda</span>
              </div>
            </div>
          </div>

          {/* Estatísticas Flutuantes */}
          <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
            <div className="text-sm">
              <div className="font-semibold mb-1">Estatísticas</div>
              <div className="space-y-1">
                <div>Total: <span className="font-bold">{stats.total}</span></div>
                <div>Mapa: <span className="font-bold text-green-600">{stats.comCoordenadas}</span></div>
                <div>Sem Coord: <span className="font-bold text-yellow-600">{stats.semCoordenadas}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes (Mobile) */}
      {isMobile && itemSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-lg w-full max-h-96 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{itemSelecionado.assunto}</h3>
                <button
                  onClick={() => setItemSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Protocolo:</strong> {itemSelecionado.protocolo}</div>
                <div><strong>Tipo:</strong> {itemSelecionado.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}</div>
                <div><strong>Status:</strong> {itemSelecionado.status}</div>
                <div><strong>Responsável:</strong> {itemSelecionado.responsavel || 'Não definido'}</div>
                <div><strong>Endereço:</strong> {itemSelecionado.endereco_rua}, {itemSelecionado.endereco_numero}</div>
                <div><strong>Bairro:</strong> {itemSelecionado.endereco_bairro}</div>
                <div><strong>Criado:</strong> {new Date(itemSelecionado.created_at).toLocaleDateString()}</div>
              </div>
              
              <button
                onClick={() => window.open(`/${itemSelecionado.tipo}s?itemId=${itemSelecionado.id}`, '_blank')}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Detalhes Completos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
