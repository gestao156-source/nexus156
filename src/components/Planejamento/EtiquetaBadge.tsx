import React from 'react';
import { TarefaEtiqueta } from '../../types';

interface EtiquetaBadgeProps {
  etiqueta?: TarefaEtiqueta;
  size?: 'sm' | 'md';
}

const etiquetasConfig = {
  diagnostico: {
    nome: 'Diagnóstico',
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    icone: '🔵'
  },
  padronizacao: {
    nome: 'Padronização',
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icone: '🟡'
  },
  capacitacao: {
    nome: 'Capacitação',
    cor: 'bg-green-100 text-green-800 border-green-200',
    icone: '🟢'
  },
  monitoramento: {
    nome: 'Monitoramento',
    cor: 'bg-red-100 text-red-800 border-red-200',
    icone: '🔴'
  }
};

export default function EtiquetaBadge({ etiqueta, size = 'md' }: EtiquetaBadgeProps) {
  if (!etiqueta) return null;

  const config = etiquetasConfig[etiqueta];
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${config.cor}`}>
      <span>{config.icone}</span>
      <span>{config.nome}</span>
    </span>
  );
}
