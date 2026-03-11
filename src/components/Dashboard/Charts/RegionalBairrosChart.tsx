import { useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronLeft, FileText, Calendar, User } from 'lucide-react';
import { RegionalData } from './chart-types';
import { getRegionalPorId, encontrarRegionalPorBairro } from '../../../utils/regionalUtils';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface BairroData {
  bairro: string;
  quantidade: number;
}

interface RegionalBairrosChartProps {
  data: RegionalData[];
  title?: string;
  height?: number;
}

export default function RegionalBairrosChart({ 
  data, 
  title = "Regionais com Mais Demandas", 
  height = 300 
}: RegionalBairrosChartProps) {
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [bairrosData, setBairrosData] = useState<BairroData[]>([]);
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null);
  const [itensData, setItensData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar se data é um array válido
  if (!Array.isArray(data) || data.length === 0) {
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
    const regionalId = parseInt(regionalName.split(' ')[1]) || 0;
    const regional = getRegionalPorId(regionalId);
    return regional?.cor || '#6B7280';
  };

  // Buscar bairros da regional
  const handleRegionalClick = async (data: any) => {
    const regional = data as RegionalData;
    if (selectedRegional === regional.region) {
      // Se já estiver selecionado, volta para visão de regionais
      setSelectedRegional(null);
      setBairrosData([]);
      setSelectedBairro(null);
      setItensData([]);
    } else {
      setLoading(true);
      setSelectedRegional(regional.region);
      setSelectedBairro(null);
      setItensData([]);
      
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
          
          // Se não tiver regional, calcula pelo bairro
          if (!regionalId && item.endereco_bairro) {
            regionalId = encontrarRegionalPorBairro(item.endereco_bairro).toString();
          }
          
          const regionalDoItem = getRegionalPorId(parseInt(regionalId));
          const regionalDoItemNome = regionalDoItem?.nome || 'Não definido';
          return regionalDoItemNome === regional.region;
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
          quantidade: value
        })).sort((a, b) => b.quantidade - a.quantidade); // Ordenar por quantidade

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

  // Buscar itens do bairro
  const handleBairroClick = async (bairro: string) => {
    if (selectedBairro === bairro) {
      // Se já estiver selecionado, volta para visão de bairros
      setSelectedBairro(null);
      setItensData([]);
    } else {
      setLoading(true);
      setSelectedBairro(bairro);
      
      try {
        console.log(`🔍 Buscando itens do bairro: ${bairro}`);
        
        const { data: solicitacoes } = await supabase
          .from('solicitacoes')
          .select(`
            *,
            profiles!inner(full_name, email)
          `)
          .eq('endereco_bairro', bairro);

        const { data: demandas } = await supabase
          .from('demandas')
          .select(`
            *,
            profiles!inner(full_name, email)
          `)
          .eq('endereco_bairro', bairro);

        const allItems = [...(solicitacoes || []), ...(demandas || [])];
        
        // Ordenar por data de criação (mais recentes primeiro)
        const itens = allItems.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        console.log(`📋 Itens encontrados:`, itens.length);
        setItensData(itens);
      } catch (error) {
        console.error('Erro ao buscar itens do bairro:', error);
        setItensData([]);
      } finally {
        setLoading(false);
      }
    }
  };

  // Abrir página de detalhes
  const handleItemClick = (item: any) => {
    // Redirecionar para página de detalhes
    navigate(`/todos/${item.id}#item-${item.id}`);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.region || data.bairro}</p>
          <p className="text-sm text-gray-600">Quantidade: {data.value || data.quantidade}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {!selectedRegional ? (
        // Visão principal: Regionais
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="category" 
              dataKey="region" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              type="number" 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              onClick={handleRegionalClick}
              cursor="pointer"
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
      ) : !selectedBairro ? (
        // Visão de drill-down: Bairros da regional
        <div>
          <div className="flex items-center mb-4">
            <button
              onClick={() => {
                setSelectedRegional(null);
                setBairrosData([]);
                setSelectedBairro(null);
                setItensData([]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Voltar para Regionais</span>
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              Bairros da {selectedRegional}
            </h4>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Carregando bairros...
            </div>
          ) : bairrosData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Nenhum bairro encontrado para esta regional
            </div>
          ) : (
            // Opção 1A: Lista simples
            <div className="space-y-2">
              {bairrosData.map((bairro, index) => (
                <div 
                  key={index}
                  onClick={() => handleBairroClick(bairro.bairro)}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-900">{bairro.bairro}</p>
                    <p className="text-sm text-gray-600">{bairro.quantidade} demandas</p>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Visão de drill-down: Itens do bairro
        <div>
          <div className="flex items-center mb-4">
            <button
              onClick={() => {
                setSelectedBairro(null);
                setItensData([]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Voltar para Bairros</span>
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              Demandas de {selectedBairro}
            </h4>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Carregando demandas...
            </div>
          ) : itensData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Nenhuma demanda encontrada para este bairro
            </div>
          ) : (
            // Lista de itens
            <div className="space-y-2">
              {itensData.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-gray-900">{item.protocolo || 'N/A'}</p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                        item.status === 'em_analise' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'finalizado' ? 'Finalizado' :
                         item.status === 'em_analise' ? 'Em Análise' :
                         item.status === 'aguardando' ? 'Aguardando' :
                         'Pendente'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{item.assunto || 'Sem assunto'}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      {(item.profiles?.full_name || item.responsavel) && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.profiles?.full_name || 
                           (typeof item.responsavel === 'string' && item.responsavel.includes('auth|') 
                            ? 'Não atribuído' 
                            : item.responsavel)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Clique para ver detalhes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
