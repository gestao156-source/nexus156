import { useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronLeft } from 'lucide-react';
import { RegionalData } from './chart-types';
import { getRegionalPorId, encontrarRegionalPorBairro } from '../../../utils/regionalUtils';
import { supabase } from '../../../lib/supabase';

interface BairroData {
  bairro: string;
  value: number;
}

interface RegionalDrillDownChartProps {
  data: RegionalData[];
  title?: string;
  height?: number;
}

export default function RegionalDrillDownChart({ 
  data, 
  title = "Distribuição Regional", 
  height = 300 
}: RegionalDrillDownChartProps) {
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [bairrosData, setBairrosData] = useState<BairroData[]>([]);
  const [loading, setLoading] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  // Ordenar por quantidade (maior primeiro)
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Obter cor da regional
  const getRegionalColor = (regionalName: string) => {
    const regional = getRegionalPorId(parseInt(regionalName.split(' ')[1]) || 0);
    return regional?.cor || '#6B7280';
  };

  // Buscar bairros reais da regional
  const handleRegionalClick = async (data: any) => {
    const regional = data as RegionalData;
    if (selectedRegional === regional.region) {
      // Se já estiver selecionado, volta para visão de regionais
      setSelectedRegional(null);
      setBairrosData([]);
    } else {
      setLoading(true);
      setSelectedRegional(regional.region);
      
      // Buscar dados reais dos bairros
      try {
        console.log(`🔍 Buscando bairros da regional: ${regional.region}`);
        
        const { data: solicitacoes } = await supabase
          .from('solicitacoes')
          .select('endereco_bairro, endereco_regional');

        const { data: demandas } = await supabase
          .from('demandas')
          .select('endereco_bairro, endereco_regional');

        const allItems = [...(solicitacoes || []), ...(demandas || [])];
        
        // Filtrar itens da regional específica
        const itensRegional = allItems.filter(item => {
          let regionalId = item.endereco_regional;
          
          // Se não tiver regional, tenta calcular pelo bairro
          if (!regionalId && item.endereco_bairro) {
            regionalId = encontrarRegionalPorBairro(item.endereco_bairro).toString();
          }
          
          const regionalDoItem = getRegionalPorId(parseInt(regionalId))?.nome || 'Não definido';
          return regionalDoItem === regional.region;
        });

        console.log(`📊 Itens encontrados para ${regional.region}:`, itensRegional.length);

        // Agrupar por bairro
        const grouped = itensRegional.reduce((acc, item) => {
          const bairro = item.endereco_bairro || 'Não definido';
          if (!acc[bairro]) acc[bairro] = 0;
          acc[bairro]++;
          return acc;
        }, {} as Record<string, number>);

        const result = Object.entries(grouped).map(([bairro, value]) => ({
          bairro,
          value
        })).sort((a, b) => b.value - a.value); // Ordenar por quantidade

        console.log(`📍 Bairros agrupados:`, result);
        setBairrosData(result);
      } catch (error) {
        console.error('Erro ao buscar bairros:', error);
        setBairrosData([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.region}</p>
          <p className="text-sm text-gray-600">Quantidade: {data.value}</p>
          <p className="text-xs text-gray-500 mt-1">Clique para ver detalhes</p>
        </div>
      );
    }
    return null;
  };

  const BairroTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.bairro}</p>
          <p className="text-sm text-gray-600">Quantidade: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedRegional ? `Bairros - ${selectedRegional}` : title}
        </h3>
        {selectedRegional && (
          <button
            onClick={() => setSelectedRegional(null)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedRegional && bairrosData.length > 0 ? (
        // Visão de Bairros
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart 
              data={bairrosData} 
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="bairro" 
                tick={{ fontSize: 11 }}
                width={110}
              />
              <Tooltip content={<BairroTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#3B82F6">
                {bairrosData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index % 2 === 0 ? '#3B82F6' : '#10B981'} 
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // Visão de Regionais
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart 
              data={sortedData} 
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="region" 
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={handleRegionalClick}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getRegionalColor(entry.region)} 
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
          
          {/* Top 3 Regionais */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            {sortedData.slice(0, 3).map((item, index) => (
              <div key={item.region} className="bg-gray-50 p-2 rounded text-center">
                <p className="font-medium text-gray-900 text-xs">#{index + 1}</p>
                <p className="text-gray-600 truncate">{item.region}</p>
                <p className="text-gray-800 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
