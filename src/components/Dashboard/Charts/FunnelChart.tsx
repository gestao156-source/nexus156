import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FunnelData } from './chart-types';

interface FunnelChartProps {
  data: FunnelData[];
  title?: string;
  height?: number;
}

export default function FunnelChart({ data, title = "Funil de Conversão", height = 300 }: FunnelChartProps) {
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

  // Calcular taxas de conversão
  const processedData = data.map((item, index) => {
    const previousValue = index > 0 ? data[index - 1].value : item.value;
    const conversionRate = index > 0 ? Math.round((item.value / previousValue) * 100) : 100;
    
    return {
      ...item,
      conversionRate,
      displayValue: item.value.toLocaleString('pt-BR')
    };
  });

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.stage}</p>
          <p className="text-sm text-gray-600">Quantidade: {data.displayValue}</p>
          <p className="text-sm text-gray-600">Taxa de conversão: {data.conversionRate}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={processedData} 
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="stage" 
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {processedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
      
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
              {index > 0 && (
                <span className="text-gray-500">
                  ({item.conversionRate}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
