import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from './chart-types';

interface LineChartProps {
  data: TimeSeriesData[];
  title?: string;
  height?: number;
}

export default function LineChart({ data, title = "Evolução Temporal", height = 300 }: LineChartProps) {
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

  // Agrupar dados por categoria se existir
  const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <Line
                key={category}
                type="monotone"
                dataKey="value"
                data={data.filter(d => d.category === category)}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={category}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Quantidade"
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
