import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from './chart-types';

interface AreaChartProps {
  data: TimeSeriesData[];
  title?: string;
  height?: number;
}

export default function AreaChart({ data, title = "Backlog Acumulado", height = 300 }: AreaChartProps) {
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

  // Preparar dados empilhados
  const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Transformar dados para formato empilhado
  const stackedData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing[item.category || 'total'] = item.value;
    } else {
      acc.push({
        date: item.date,
        [item.category || 'total']: item.value
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={stackedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any) => [value, 'Quantidade']}
            labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString('pt-BR')}`}
          />
          <Legend />
          {categories.map((category, index) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category || 'total'}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
              name={category}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
