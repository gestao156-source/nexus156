import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RegionalData } from './chart-types';

interface HeatmapChartProps {
  data: RegionalData[];
  title?: string;
  height?: number;
}

export default function HeatmapChart({ data, title = "Distribuição Regional", height = 300 }: HeatmapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-primary rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-text-muted">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  // Ordenar por quantidade (maior primeiro)
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 15); // Top 15

  // Calcular cores baseado na intensidade
  const maxValue = Math.max(...sortedData.map(d => d.value));
  
  const getHeatmapColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return '#DC2626'; // Vermelho escuro
    if (intensity > 0.6) return '#EF4444'; // Vermelho
    if (intensity > 0.4) return '#F59E0B'; // Amarelo
    if (intensity > 0.2) return '#3B82F6'; // Azul
    return '#6B7280'; // Cinza
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      const total = sortedData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-bg-primary p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-text-primary">{data.region}</p>
          <p className="text-sm text-text-secondary">Quantidade: {data.value}</p>
          <p className="text-sm text-text-secondary">Percentual: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bg-primary rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
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
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getHeatmapColor(entry.value)} 
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
      
      {/* Legenda de intensidade */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-text-secondary">Intensidade:</span>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#DC2626' }} />
            <span className="text-text-secondary">Alta</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-text-secondary">Média</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-text-secondary">Baixa</span>
          </div>
        </div>
      </div>
      
      {/* Top 3 regiões */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        {sortedData.slice(0, 3).map((item, index) => (
          <div key={item.region} className="bg-gray-50 p-2 rounded text-center">
            <p className="font-medium text-text-primary text-xs">#{index + 1}</p>
            <p className="text-text-secondary truncate">{item.region}</p>
            <p className="text-gray-800 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

