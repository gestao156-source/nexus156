// Interfaces compartilhadas para todos os gráficos

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface ScatterData {
  x: number;
  y: number;
  name: string;
  color?: string;
}

export interface FunnelData {
  stage: string;
  value: number;
  conversion?: number;
}

export interface RegionalData {
  region: string;
  value: number;
  latitude?: number;
  longitude?: number;
}

export interface PerformerData {
  name: string;
  completed: number;
  pending: number;
  efficiency?: number;
}

export interface AverageTimeData {
  status: string;
  days: number;
  count: number;
}
