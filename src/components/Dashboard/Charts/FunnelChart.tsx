import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { FunnelData } from './chart-types';

interface FunnelChartProps {
  data: FunnelData[];
  title?: string;
  height?: number;
  onBarClick?: (stage: string) => void;
}

export default function FunnelChart({ data, title = "Funil de Processo", height = 300, onBarClick }: FunnelChartProps) {
  // Verificar se data é um array válido
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  // Calcular taxas de conversão
  const processedData = data.map((item) => {
    return {
      ...item,
      conversionRate: item.conversion || 0,
      displayValue: item.value.toLocaleString('pt-BR')
    };
  });

  const colors = ['#F59E0B', '#3B82F6', '#EF4444', '#10B981'];

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {onBarClick && (
        <div className="text-xs text-gray-500 mb-2">
          Clique nas barras para ver detalhes
          💡 Clique nas barras para ver detalhes
        </div>
      )}
      <div style={{ width: '100%', height: height, minHeight: 250 }}>
        <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
          <RechartsBarChart 
            data={processedData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={(data) => {
              if (onBarClick && data && data.payload && data.payload.stage) {
                onBarClick(data.payload.stage);
              }
            }} cursor="pointer">
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legendas com taxas de conversão */}
      <div className="mt-4 space-y-2">
        {processedData.map((item, index) => (
          <div key={item.stage} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-gray-700">{item.stage}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{item.displayValue}</span>
              <span className="text-gray-500">
                ({item.conversionRate}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
