import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { MapaItem } from '../../types';
import { verificarAtraso } from '../../utils/calculoDiasUteis';

interface MapaInterativoProps {
  dados: MapaItem[];
  onItemSelect: (item: MapaItem) => void;
  isMobile: boolean;
  pinsLimitados?: boolean;
  totalDisponiveis?: number;
  onBoundsChange?: (bounds: any) => void;
}

// Componente para detectar mudanças no mapa
function MapBoundsListener({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    }
  });

  return null;
}

export default function MapaInterativo({ 
  dados, 
  onItemSelect, 
  isMobile, 
  pinsLimitados = false, 
  totalDisponiveis = 0,
  onBoundsChange 
}: MapaInterativoProps) {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const mapRef = useRef<any>(null);

  // Debug dos dados recebidos
  useEffect(() => {
    console.log('🗺️ MapaInterativo recebeu:', {
      total: dados.length,
      comCoordenadas: dados.filter(d => d.possui_coordenadas).length,
      dados: dados.map(d => ({
        id: d.id,
        tipo: d.tipo,
        possui_coordenadas: d.possui_coordenadas,
        lat: d.endereco_latitude,
        lng: d.endereco_longitude
      }))
    });
  }, [dados]);

  // Determinar clustering baseado no volume
  const shouldUseClustering = useMemo(() => {
    const dadosComCoordenadas = dados.filter(d => d.possui_coordenadas);
    return dadosComCoordenadas.length > 200 && clusteringEnabled;
  }, [dados, clusteringEnabled]);

  // Ícones responsivos com lógica de atraso
  const getIcon = (item: MapaItem) => {
    const tamanho = isMobile ? 30 : 40;
    
    // Verificar se está atrasado
    const estaAtrasado = verificarAtraso(item.status, item.data_contato);
    
    // Definir cor baseada no status e atraso
    let cor: string;
    if (estaAtrasado) {
      cor = '#EF4444'; // Vermelho para atrasado
    } else {
      const cores: Record<string, string> = {
        aguardando: '#F59E0B', // Amarelo
        em_analise: '#3B82F6', // Azul
        finalizado: '#10B981'  // Verde
      };
      cor = cores[item.status] || '#6B7280'; // Cinza padrão
    }

    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="${tamanho}" height="${tamanho * 1.6}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path fill="${cor}" d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 12.5 25z"/>
          <circle fill="white" cx="12.5" cy="12.5" r="${tamanho/8}"/>
          <text x="12.5" y="12.5" text-anchor="middle" dy="3" fill="white" font-size="${tamanho/10}" font-weight="bold">
            ${item.tipo === 'solicitacao' ? 'S' : 'D'}
          </text>
        </svg>
      `)}`,
      iconSize: [tamanho, tamanho * 1.6],
      iconAnchor: [tamanho/2, tamanho * 1.6],
      popupAnchor: [1, -tamanho * 1.4],
      shadowSize: [tamanho * 0.8, tamanho * 1.2]
    });
  };

  // Renderizar marcadores
  const marcadores = useMemo(() => {
    const dadosFiltrados = dados.filter(item => item.possui_coordenadas);
    
    // Virtualização para grandes volumes
    if (dadosFiltrados.length > 1000) {
      return dadosFiltrados.slice(0, 1000).map(item => (
        <Marker
          key={item.id}
          position={[item.endereco_latitude!, item.endereco_longitude!]}
          icon={getIcon(item)}
          eventHandlers={{
            click: () => onItemSelect(item)
          }}
        >
          <Popup maxWidth={isMobile ? 200 : 300}>
            <PopupConteudo item={item} isMobile={isMobile} />
          </Popup>
        </Marker>
      ));
    }
    
    return dadosFiltrados.map(item => (
      <Marker
        key={item.id}
        position={[item.endereco_latitude!, item.endereco_longitude!]}
        icon={getIcon(item)}
        eventHandlers={{
          click: () => onItemSelect(item)
        }}
      >
        <Popup maxWidth={isMobile ? 200 : 300}>
          <PopupConteudo item={item} isMobile={isMobile} />
        </Popup>
      </Marker>
    ));
  }, [dados, onItemSelect, isMobile, shouldUseClustering]);

  // Ajustar bounds com animação
  useEffect(() => {
    if (dados.length > 0 && mapRef.current) {
      const validCoords = dados.filter(d => d.possui_coordenadas);
      if (validCoords.length > 0) {
        const bounds = new LatLngBounds(
          validCoords.map(d => [d.endereco_latitude!, d.endereco_longitude!])
        );
        
        if (bounds) {
          mapRef.current.flyToBounds(bounds, { duration: 1.5 });
        } else {
          setBounds(bounds);
        }
      }
    }
  }, [dados, bounds]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={[-3.7319, -38.5267]}
        zoom={isMobile ? 11 : 12}
        bounds={bounds || undefined}
        className="h-full w-full"
        zoomControl={!isMobile}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Listener para mudanças de bounds */}
        {onBoundsChange && (
          <MapBoundsListener onBoundsChange={onBoundsChange} />
        )}

        {marcadores}

        {/* Controle de clustering */}
        {!isMobile && (
          <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg z-10">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={clusteringEnabled}
                onChange={(e) => setClusteringEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Clustering</span>
            </label>
          </div>
        )}

        {/* Mensagem de limite de pins */}
        {pinsLimitados && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold">!</span>
              </div>
              <span className="text-sm font-medium">
                Aproxime o zoom para ver mais resultados ({totalDisponiveis} disponíveis)
              </span>
            </div>
          </div>
        )}

        {/* Mensagem quando não há dados na regional */}
        {dados.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg z-10 max-w-sm">
            <div className="text-center">
              <div className="text-6xl mb-3">🗺️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum registro encontrado</h3>
              <p className="text-sm text-gray-600 mb-4">
                Esta regional não possui solicitações ou demandas com coordenadas geográficas.
              </p>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Dica:</strong> Tente selecionar outra regional ou desmarque o filtro "Apenas com coordenadas".
                </p>
              </div>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}

// Componente de popup responsivo
function PopupConteudo({ item, isMobile }: { item: MapaItem; isMobile: boolean }) {
  return (
    <div className={`${isMobile ? 'p-2 min-w-64' : 'p-3 min-w-80'}`}>
      <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} mb-2`}>{item.assunto}</div>
      
      <div className={`${isMobile ? 'space-y-1' : 'space-y-2'} text-sm`}>
        <div className="flex justify-between">
          <span className="font-medium">Protocolo:</span>
          <span className="font-mono">{item.protocolo}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Tipo:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            item.tipo === 'solicitacao' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {item.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            item.status === 'aguardando' ? 'bg-yellow-100 text-yellow-800' :
            item.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {item.status.replace('_', ' ')}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Endereço:</span>
          <div className="text-gray-600">
            {item.endereco_rua}, {item.endereco_numero}
            {item.endereco_bairro && <><br/>{item.endereco_bairro}</>}
          </div>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Responsável:</span>
          <span>{item.responsavel || 'Não definido'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Criado:</span>
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <button
        onClick={() => window.open(`/${item.tipo}s?itemId=${item.id}`, '_blank')}
        className={`mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors ${
          isMobile ? 'py-2 text-sm' : 'py-2'
        }`}
      >
        Ver Detalhes
      </button>
    </div>
  );
}
