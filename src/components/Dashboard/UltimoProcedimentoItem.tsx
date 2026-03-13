import { Clock } from 'lucide-react';
import { useHistoricoProcedimentos } from '../../hooks/useHistoricoProcedimentos';

interface UltimoProcedimentoItemProps {
  itemId: string;
  itemTipo: 'solicitacao' | 'demanda';
}

export default function UltimoProcedimentoItem({ itemId, itemTipo }: UltimoProcedimentoItemProps) {
  const { getUltimoProcedimento, formatarData, loading } = useHistoricoProcedimentos({
    itemId,
    itemTipo
  });

  const ultimoProcedimento = getUltimoProcedimento();

  if (loading || !ultimoProcedimento) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-start space-x-2">
        <Clock className="w-3 h-3 text-gray-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-gray-600 line-clamp-2">
            {ultimoProcedimento.procedimento}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {ultimoProcedimento.usuario_nome} • {formatarData(ultimoProcedimento.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
