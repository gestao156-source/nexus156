import { useState } from 'react';
import { Acesso, AcessoStatus } from '../../types/index';
import { Calendar, User, MapPin, Building, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface AcessoCardProps {
  acesso: Acesso;
  onEdit: (acesso: Acesso) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: AcessoStatus) => string;
}

export default function AcessoCard({ acesso, onEdit, onDelete, getStatusColor }: AcessoCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const statusLabels: Record<AcessoStatus, string> = {
    solicitado: 'Solicitado',
    em_andamento: 'Em Andamento',
    criado: 'Criado',
    ativo: 'Ativo',
    desativado: 'Desativado'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {acesso.servidor_beneficiado}
          </h3>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(acesso.status)}`}>
            {statusLabels[acesso.status]}
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  onEdit(acesso);
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => {
                  onDelete(acesso.id);
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Solicitante:</span>
          <span className="ml-1">{acesso.solicitante_wpp}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Solicitação:</span>
          <span className="ml-1">{formatDate(acesso.data_solicitacao)}</span>
        </div>

        {acesso.data_criacao_acesso && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Criação:</span>
            <span className="ml-1">{formatDate(acesso.data_criacao_acesso)}</span>
          </div>
        )}

        {(acesso.regional || acesso.setor) && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {acesso.regional && (
              <>
                <span className="font-medium">Regional:</span>
                <span className="ml-1">{acesso.regional}</span>
              </>
            )}
            {acesso.regional && acesso.setor && <span className="mx-2">•</span>}
            {acesso.setor && (
              <>
                <span className="font-medium">Setor:</span>
                <span className="ml-1">{acesso.setor}</span>
              </>
            )}
          </div>
        )}

        {acesso.responsavel_nexus && (
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Responsável NEXUS:</span>
            <span className="ml-1">{acesso.responsavel_nexus}</span>
          </div>
        )}
      </div>

      {/* Observações */}
      {acesso.observacoes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            {acesso.observacoes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <span>
          Criado em {new Date(acesso.created_at).toLocaleDateString('pt-BR')}
        </span>
        {acesso.updated_at !== acesso.created_at && (
          <span>
            Atualizado em {new Date(acesso.updated_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}
