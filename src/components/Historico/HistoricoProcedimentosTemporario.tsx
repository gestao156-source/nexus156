import { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import { useHistoricoTemporario, ProcedimentoTemporario } from '../../hooks/useHistoricoTemporario';
import { useAuth } from '../../contexts/AuthContext';

interface HistoricoProcedimentosTemporarioProps {
  onProcedimentosChange: (procedimentos: string[]) => void;
  className?: string;
}

export default function HistoricoProcedimentosTemporario({ 
  onProcedimentosChange,
  className = ''
}: HistoricoProcedimentosTemporarioProps) {
  const [novoProcedimento, setNovoProcedimento] = useState('');
  const { user } = useAuth();

  const {
    procedimentosTemporarios,
    adicionando,
    adicionarProcedimentoTemporario,
    getProcedimentosParaSalvar
  } = useHistoricoTemporario();

  const handleAdicionarProcedimento = async () => {
    if (!novoProcedimento.trim()) return;

    let usuarioInfo;
    if (user) {
      usuarioInfo = {
        id: user.id,
        nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || ''
      };
    }

    const sucesso = await adicionarProcedimentoTemporario(novoProcedimento, usuarioInfo);
    
    if (sucesso) {
      setNovoProcedimento('');
      // Notificar o componente pai sobre a mudança
      onProcedimentosChange(getProcedimentosParaSalvar());
    }
  };

  // Atualizar o componente pai quando os procedimentos mudarem
  useEffect(() => {
    onProcedimentosChange(getProcedimentosParaSalvar());
  }, [procedimentosTemporarios]);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Histórico de Procedimentos</h3>
          <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
            {procedimentosTemporarios.length} registro{procedimentosTemporarios.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Formulário para adicionar procedimento */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <textarea
          value={novoProcedimento}
          onChange={(e) => setNovoProcedimento(e.target.value)}
          placeholder="Descreva o procedimento realizado ou observações iniciais..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
          disabled={adicionando}
        />
        <div className="flex justify-end space-x-2 mt-2">
          <button
            onClick={() => setNovoProcedimento('')}
            className="px-3 py-1 text-text-secondary bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            disabled={adicionando}
          >
            Limpar
          </button>
          <button
            onClick={handleAdicionarProcedimento}
            className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
            disabled={adicionando || !novoProcedimento.trim()}
          >
            {adicionando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Lista de procedimentos */}
      <div className="max-h-80 overflow-y-auto">
        {procedimentosTemporarios.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhum procedimento registrado</p>
            <p className="text-sm">
              Adicione procedimentos para registrar o histórico deste acesso.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {procedimentosTemporarios.map((procedimento: ProcedimentoTemporario, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Avatar/Círculo do usuário */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  
                  {/* Conteúdo do procedimento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">
                        {procedimento.usuario_nome || 'Usuário'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Agora
                      </span>
                    </div>
                    
                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                      {procedimento.procedimento}
                    </p>
                    
                    {/* Email do usuário */}
                    {procedimento.usuario_email && (
                      <p className="text-xs text-gray-500 mt-1">
                        {procedimento.usuario_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

