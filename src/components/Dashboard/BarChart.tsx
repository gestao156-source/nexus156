interface BarChartData {
  name: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
}

export default function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">{item.name}</span>
              <span className="text-sm font-semibold text-text-primary">{item.value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                  minWidth: item.value > 0 ? '40px' : '0',
                }}
              >
                {item.value > 0 && (
                  <span className="text-white text-xs font-semibold">
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

