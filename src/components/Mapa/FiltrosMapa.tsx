import { useState } from 'react';
import { Filter, Info, X, ChevronUp } from 'lucide-react';
import { MapaFilters, MapaStats } from '../../types';
import { REGIONAIS_FORTALEZA } from '../../data/regionaisFortaleza';

interface FiltrosMapaProps {
  filtros: MapaFilters;
  onFiltrosChange: (filtros: MapaFilters) => void;
  stats: MapaStats;
  isMobile?: boolean;
}

export default function FiltrosMapa({ filtros, onFiltrosChange, stats, isMobile = false }: FiltrosMapaProps) {
  const [expandido, setExpandido] = useState(!isMobile);
  const [tooltipAtivo, setTooltipAtivo] = useState<string | null>(null);

  const tooltips = {
    status: 'Filtrar solicitações e demandas por status atual',
    tipo: 'Mostrar apenas solicitações, demandas ou ambos os tipos',
    periodo: 'Filtrar por período de criação dos registros',
    regional: 'Visualizar dados de regionais específicas de Fortaleza',
    coordenadas: 'Exibir apenas registros com coordenadas geográficas válidas',
    ordenacao: 'Ordenar resultados por data, protocolo ou assunto'
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const novosStatus = checked
      ? [...filtros.status, status]
      : filtros.status.filter(s => s !== status);
    onFiltrosChange({ ...filtros, status: novosStatus });
  };

  const handlePeriodoChange = (campo: 'inicio' | 'fim', valor: string) => {
    onFiltrosChange({
      ...filtros,
      periodo: {
        ...filtros.periodo,
        [campo]: campo === 'inicio' ? new Date(valor) : new Date(valor)
      }
    });
  };

  return (
    <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50' : 'w-80'} 
                   bg-white rounded-lg shadow-lg p-4 space-y-4 
                   ${isMobile ? 'transform transition-transform' : ''} 
                   ${expandido ? 'translate-y-0' : 'translate-y-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>
        {isMobile && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {expandido ? <X className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Status</label>
          <div className="relative">
            <button
              onMouseEnter={() => !isMobile && setTooltipAtivo('status')}
              onMouseLeave={() => !isMobile && setTooltipAtivo(null)}
              onClick={() => isMobile && setTooltipAtivo(tooltipAtivo === 'status' ? null : 'status')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {tooltipAtivo === 'status' && (
              <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-xl">
                <div className="font-semibold mb-1">Status</div>
                <div>{tooltips.status}</div>
                <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {['aguardando', 'em_analise', 'finalizado'].map(status => (
            <label key={status} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={filtros.status.includes(status)}
                onChange={(e) => handleStatusChange(status, e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Tipo</label>
          <div className="relative">
            <button
              onMouseEnter={() => !isMobile && setTooltipAtivo('tipo')}
              onMouseLeave={() => !isMobile && setTooltipAtivo(null)}
              onClick={() => isMobile && setTooltipAtivo(tooltipAtivo === 'tipo' ? null : 'tipo')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {tooltipAtivo === 'tipo' && (
              <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-xl">
                <div className="font-semibold mb-1">Tipo</div>
                <div>{tooltips.tipo}</div>
                <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'solicitacao', label: 'Solicitações' },
            { value: 'demanda', label: 'Demandas' }
          ].map(tipo => (
            <label key={tipo.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="radio"
                name="tipo"
                value={tipo.value}
                checked={filtros.tipo === tipo.value}
                onChange={(e) => onFiltrosChange({ ...filtros, tipo: e.target.value })}
                className="text-blue-600"
              />
              <span className="text-sm">{tipo.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Regional */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Regional</label>
          <div className="relative">
            <button
              onMouseEnter={() => !isMobile && setTooltipAtivo('regional')}
              onMouseLeave={() => !isMobile && setTooltipAtivo(null)}
              onClick={() => isMobile && setTooltipAtivo(tooltipAtivo === 'regional' ? null : 'regional')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {tooltipAtivo === 'regional' && (
              <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-xl">
                <div className="font-semibold mb-1">Regional</div>
                <div>{tooltips.regional}</div>
                <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        </div>
        
        <select
          value={filtros.regional}
          onChange={(e) => onFiltrosChange({ ...filtros, regional: parseInt(e.target.value) })}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value={0}>Todas as Regionais</option>
          {REGIONAIS_FORTALEZA.map(regional => (
            <option key={regional.id} value={regional.id}>
              {regional.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Período */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Período</label>
          <div className="relative">
            <button
              onMouseEnter={() => !isMobile && setTooltipAtivo('periodo')}
              onMouseLeave={() => !isMobile && setTooltipAtivo(null)}
              onClick={() => isMobile && setTooltipAtivo(tooltipAtivo === 'periodo' ? null : 'periodo')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {tooltipAtivo === 'periodo' && (
              <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-xl">
                <div className="font-semibold mb-1">Período</div>
                <div>{tooltips.periodo}</div>
                <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600">Data Início</label>
            <input
              type="date"
              value={filtros.periodo.inicio.toISOString().split('T')[0]}
              onChange={(e) => handlePeriodoChange('inicio', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Fim</label>
            <input
              type="date"
              value={filtros.periodo.fim.toISOString().split('T')[0]}
              onChange={(e) => handlePeriodoChange('fim', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas Compactas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 text-sm">Estatísticas em Tempo Real</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-2 rounded border border-blue-100">
            <div className="text-blue-600 font-bold text-lg">{stats.total}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="bg-white p-2 rounded border border-blue-100">
            <div className="text-green-600 font-bold text-lg">{stats.comCoordenadas}</div>
            <div className="text-gray-600">Mapa</div>
          </div>
          <div className="bg-white p-2 rounded border border-blue-100">
            <div className="text-yellow-600 font-bold text-lg">{stats.semCoordenadas}</div>
            <div className="text-gray-600">Sem Coord.</div>
          </div>
          <div className="bg-white p-2 rounded border border-blue-100 col-span-2">
            <div className="text-indigo-600 font-bold text-sm">Atualizado: {stats.ultimoUpdate.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Botão de Aplicar Mobile */}
      {isMobile && (
        <button
          onClick={() => setExpandido(false)}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Aplicar Filtros
        </button>
      )}
    </div>
  );
}
