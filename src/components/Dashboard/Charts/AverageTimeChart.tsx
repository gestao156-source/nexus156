import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AverageTimeData } from './chart-types';

interface AverageTimeChartProps {
  data: AverageTimeData[];
  title?: string;
  height?: number;
}

export default function AverageTimeChart({ data, title = "Tempo Médio por Status", height = 300 }: AverageTimeChartProps) {
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

  // Formatar dados para exibição
  const formattedData = data.map(item => ({
    ...item,
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
    days: Math.round(item.days * 10) / 10 // Arredondar para 1 casa decimal
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="status" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Dias Médios', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any, name: any) => {
              if (name === 'days') {
                return [`${value} dias`, 'Tempo Médio'];
              }
              if (name === 'count') {
                return [value, 'Quantidade'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `Status: ${label}`}
          />
          <Bar 
            dataKey="days" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
