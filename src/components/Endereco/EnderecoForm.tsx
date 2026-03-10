import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { GeocodingService, EnderecoCompleto, Coordenadas } from '../../services/geocoding';

// Fix para problema de ícones do Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface EnderecoFormProps {
  value: Partial<EnderecoCompleto>;
  onChange: (endereco: Partial<EnderecoCompleto>) => void;
  disabled?: boolean;
  showMap?: boolean;
}

// Componente para eventos do mapa
const MapEvents = ({ 
  onMapClick 
}: { 
  onMapClick: (lat: number, lng: number) => void 
}) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Componente do mapa
const MapaInterativo = ({ 
  coordenada, 
  onCoordenadaChange, 
  disabled 
}: { 
  coordenada: Coordenadas | null; 
  onCoordenadaChange: (lat: number, lng: number) => void; 
  disabled?: boolean;
}) => {
  const [map, setMap] = useState<any>(null);

  // Atualizar centro do mapa quando coordenada mudar
  useEffect(() => {
    if (map && coordenada) {
      map.setView([coordenada.lat, coordenada.lng], 15);
      console.log('🗺️ Mapa atualizado para:', coordenada);
    }
  }, [coordenada, map]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!disabled) {
      onCoordenadaChange(lat, lng);
    }
  };

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={coordenada || [-3.7319, -38.5267]} // Default: Fortaleza
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={handleMapClick} />
        {coordenada && (
          <Marker
            position={[coordenada.lat, coordenada.lng]}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default function EnderecoForm({ 
  value, 
  onChange, 
  disabled = false, 
  showMap = true 
}: EnderecoFormProps) {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [coordenadaAtual, setCoordenadaAtual] = useState<Coordenadas | null>(
    value.latitude && value.longitude 
      ? { lat: value.latitude, lng: value.longitude }
      : null
  );

  // Atualizar coordenada quando o valor mudar
  useEffect(() => {
    if (value.latitude && value.longitude) {
      setCoordenadaAtual({ lat: value.latitude, lng: value.longitude });
    } else {
      setCoordenadaAtual(null);
    }
  }, [value.latitude, value.longitude]);

  // Buscar CEP
  const handleBuscarCEP = async () => {
    if (!value.cep || !GeocodingService.validarCEP(value.cep)) {
      setCepError('CEP inválido');
      return;
    }

    setLoading(true);
    setCepError('');
    console.log('🔍 Iniciando busca de CEP:', value.cep);

    try {
      const dadosCEP = await GeocodingService.buscarPorCEP(value.cep);
      
      if (!dadosCEP || dadosCEP.erro) {
        console.log('❌ CEP não encontrado:', value.cep);
        setCepError('CEP não encontrado');
        return;
      }

      console.log('✅ CEP encontrado:', dadosCEP);

      // Atualizar campos do endereço
      const regional = GeocodingService.buscarRegionalPorBairro(dadosCEP.bairro || '');
      
      const novoEndereco = {
        ...value,
        rua: dadosCEP.logradouro,
        bairro: dadosCEP.bairro,
        localidade: dadosCEP.localidade,
        uf: dadosCEP.uf || 'CE', // Default para CE
        complemento: dadosCEP.complemento || '',
        regional: regional
      };
      
      onChange(novoEndereco);

      // Buscar coordenadas automaticamente
      if (dadosCEP.logradouro && dadosCEP.localidade) {
        console.log('🗺️ Buscando coordenadas para o endereço...');
        
        // Estratégia 1: Tentar com número completo (mais preciso)
        const enderecoParaBuscaCompleto = GeocodingService.formatarEnderecoParaBusca(novoEndereco);
        console.log('🔍 Tentando geocoding completo (com número):', enderecoParaBuscaCompleto);
        
        let coords = await GeocodingService.buscarCoordenadas(enderecoParaBuscaCompleto);
        
        // Se não encontrar, tentar sem número
        if (!coords) {
          console.log('🔄 Geocoding com número falhou, tentando sem número...');
          const enderecoSemNumero = {
            ...novoEndereco,
            numero: '' // Remover número para tentativa alternativa
          };
          const enderecoParaBuscaSemNumero = GeocodingService.formatarEnderecoParaBusca(enderecoSemNumero);
          console.log('🔍 Tentando geocoding sem número:', enderecoParaBuscaSemNumero);
          coords = await GeocodingService.buscarCoordenadas(enderecoParaBuscaSemNumero);
        }
        
        if (coords) {
          console.log('✅ Coordenadas encontradas, atualizando mapa:', coords);
          setCoordenadaAtual(coords);
          onChange({
            ...novoEndereco,
            latitude: coords.lat,
            longitude: coords.lng
          });
        } else {
          console.log('❌ Não foi possível encontrar coordenadas para o endereço');
          // Não mostrar erro de CEP, pois o CEP foi encontrado
          // Apenas não atualiza o mapa
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      setCepError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  // Mudança no CEP
  const handleCEPChange = (cep: string) => {
    const cepMascarado = GeocodingService.mascararCEP(cep);
    onChange({ ...value, cep: cepMascarado });
    setCepError('');
  };

  // Mudança de coordenada no mapa
  const handleCoordenadaChange = async (lat: number, lng: number) => {
    setCoordenadaAtual({ lat, lng });
    onChange({ ...value, latitude: lat, longitude: lng });

    // Reverse geocoding para obter endereço
    try {
      const endereco = await GeocodingService.buscarPorCoordenadas(lat, lng);
      if (endereco) {
        onChange({
          ...value,
          latitude: lat,
          longitude: lng,
          rua: endereco.logradouro,
          bairro: endereco.bairro,
          localidade: endereco.localidade,
          cep: endereco.cep
        });
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
  };

  // Remover localização
  const handleRemoverLocalizacao = () => {
    setCoordenadaAtual(null);
    onChange({ 
      ...value, 
      latitude: undefined, 
      longitude: undefined,
      rua: '',
      bairro: '',
      localidade: '',
      regional: '',
      cep: ''
    });
  };

  // Mudança em campos de texto
  const handleFieldChange = (campo: keyof EnderecoCompleto, valor: string) => {
    onChange({ ...value, [campo]: valor });

    // Se mudou endereço, buscar coordenadas com debounce
    if (['rua', 'numero', 'bairro', 'localidade'].includes(campo)) {
      const enderecoTemp = { ...value, [campo]: valor };
      const enderecoCompleto = GeocodingService.formatarEnderecoParaBusca(enderecoTemp);
      
      if (enderecoCompleto.length > 10) {
        GeocodingService.buscarCoordenadasDebounced(enderecoCompleto, (coords) => {
          if (coords) {
            setCoordenadaAtual(coords);
            onChange({ 
              ...enderecoTemp, // Usar enderecoTemp em vez de value para preservar o campo atualizado
              latitude: coords.lat, 
              longitude: coords.lng 
            });
          }
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={value.cep || ''}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
              maxLength={9}
            />
            <button
              type="button"
              onClick={handleBuscarCEP}
              disabled={disabled || loading || !value.cep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </button>
          </div>
          {cepError && (
            <p className="mt-1 text-sm text-red-600">{cepError}</p>
          )}
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número
          </label>
          <input
            type="text"
            value={value.numero || ''}
            onChange={(e) => handleFieldChange('numero', e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rua */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rua/Avenida
          </label>
          <input
            type="text"
            value={value.rua || ''}
            onChange={(e) => handleFieldChange('rua', e.target.value)}
            placeholder="Rua das Flores"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>

        {/* Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bairro
          </label>
          <input
            type="text"
            value={value.bairro || ''}
            onChange={(e) => handleFieldChange('bairro', e.target.value)}
            placeholder="Centro"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Localidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localidade/Cidade
          </label>
          <input
            type="text"
            value={value.localidade || ''}
            onChange={(e) => handleFieldChange('localidade', e.target.value)}
            placeholder="São Paulo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>

        {/* Regional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regional
          </label>
          <input
            type="text"
            value={value.regional || ''}
            onChange={(e) => handleFieldChange('regional', e.target.value)}
            placeholder="Regional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Complemento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complemento
          </label>
          <input
            type="text"
            value={value.complemento || ''}
            onChange={(e) => handleFieldChange('complemento', e.target.value)}
            placeholder="Apto 101, Bloco A"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>

        {/* UF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UF
          </label>
          <input
            type="text"
            value={value.uf || ''}
            onChange={(e) => handleFieldChange('uf', e.target.value)}
            placeholder="CE"
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Mapa */}
      {showMap && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localização no Mapa
              </div>
              {coordenadaAtual && !disabled && (
                <button
                  type="button"
                  onClick={handleRemoverLocalizacao}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remover
                </button>
              )}
            </div>
          </label>
          <MapaInterativo
            coordenada={coordenadaAtual}
            onCoordenadaChange={handleCoordenadaChange}
            disabled={disabled}
          />
          {!disabled && (
            <p className="mt-2 text-sm text-gray-500">
              💡 Clique no mapa para ajustar a localização ou preencha o endereço acima
            </p>
          )}
        </div>
      )}

      {/* Endereço formatado */}
      {value.rua && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Endereço completo:</strong> {GeocodingService.formatarEnderecoCompleto(value)}
          </p>
          {coordenadaAtual && (
            <p className="text-sm text-gray-500 mt-1">
              <strong>Coordenadas:</strong> {coordenadaAtual.lat.toFixed(6)}, {coordenadaAtual.lng.toFixed(6)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
