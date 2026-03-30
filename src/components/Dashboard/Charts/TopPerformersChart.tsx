import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PerformerData } from './chart-types';

interface TopPerformersChartProps {
  data: PerformerData[];
  title?: string;
  height?: number;
}

export default function TopPerformersChart({ data, title = "Top Responsáveis", height = 300 }: TopPerformersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  // Ordenar por eficiência (finalizados / total)
  const sortedData = [...data]
    .map(item => ({
      ...item,
      efficiency: item.completed > 0 ? Math.round((item.completed / (item.completed + item.pending)) * 100) : 0,
      total: item.completed + item.pending
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10); // Top 10

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Finalizados: {data.completed}</p>
          <p className="text-sm text-gray-600">Pendentes: {data.pending}</p>
          <p className="text-sm text-gray-600">Total: {data.total}</p>
          <p className="text-sm text-gray-600">Eficiência: {data.efficiency}%</p>
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
          data={sortedData} 
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="completed" 
            fill="#10B981"
            radius={[0, 4, 4, 0]}
            name="Finalizados"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
      
      {/* Resumo dos top performers */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-800 font-medium">Mais Produtivo</p>
          <p className="text-green-600">{sortedData[0]?.name}</p>
          <p className="text-green-600">{sortedData[0]?.completed} itens</p>
        </div>
        <div className="bg-primary-50 p-3 rounded-lg">
          <p className="text-primary-800 font-medium">Maior Eficiência</p>
          <p className="text-primary-600">
            {sortedData.reduce((max, current) => 
              current.efficiency > max.efficiency ? current : max
            ).name}
          </p>
          <p className="text-primary-600">
            {Math.max(...sortedData.map(d => d.efficiency))}% eficiência
          </p>
        </div>
      </div>
    </div>
  );
}

