import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ScatterData } from './chart-types';

interface ScatterChartProps {
  data: ScatterData[];
  title?: string;
  height?: number;
}

export default function ScatterChart({ data, title = "Tempo de Resposta", height = 300 }: ScatterChartProps) {
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

  // Cores por status
  const colors = {
    'Finalizado': '#10B981',
    'Em análise': '#3B82F6',
    'Aguardando': '#F59E0B',
    'Atrasado': '#EF4444'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Tempo: {data.y} dias</p>
          <p className="text-sm text-gray-600">Data: {new Date(data.x).toLocaleDateString('pt-BR')}</p>
        </div>
      );
    }
    return null;
  };

  // Preparar dados com timestamps
  const processedData = data.map(item => ({
    ...item,
    timestamp: new Date(item.x).getTime()
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            type="number" 
            dataKey="x"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            type="number" 
            dataKey="y"
            tick={{ fontSize: 12 }}
            label={{ value: 'Dias para Responder', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={processedData} fill="#3B82F6">
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[entry.name as keyof typeof colors] || '#6B7280'} 
              />
            ))}
          </Scatter>
        </RechartsScatterChart>
      </ResponsiveContainer>
      
      {/* Legendas */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {Object.entries(colors).map(([status, color]) => (
          <div key={status} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-600">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
