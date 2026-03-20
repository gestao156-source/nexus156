import { useState, useEffect } from 'react';
import { Clock, User, Plus, AlertCircle } from 'lucide-react';
import { useHistoricoAcessos, ProcedimentoAcesso } from '../../hooks/useHistoricoAcessos';

interface HistoricoAcessosProps {
  acessoId: string;
  disabled?: boolean;
  className?: string;
}

export default function HistoricoAcessos({ 
  acessoId, 
  disabled = false,
  className = ''
}: HistoricoAcessosProps) {
  const [novoProcedimento, setNovoProcedimento] = useState('');
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [podeAdicionar, setPodeAdicionar] = useState(false);

  const {
    historico,
    loading,
    error,
    adicionando,
    adicionarProcedimento,
    podeAdicionarProcedimento,
    formatarData
  } = useHistoricoAcessos({ acessoId });

  // Verificar permissões ao carregar
  useEffect(() => {
    const verificarPermissao = async () => {
      const temPermissao = await podeAdicionarProcedimento();
      setPodeAdicionar(temPermissao);
    };
    verificarPermissao();
  }, [acessoId]);

  const handleAdicionarProcedimento = async () => {
    if (!novoProcedimento.trim()) return;

    const sucesso = await adicionarProcedimento(novoProcedimento);
    
    if (sucesso) {
      setNovoProcedimento('');
      setMostrarAdicionar(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Histórico de Procedimentos</h3>
          <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
            {historico.length} registro{historico.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {!disabled && podeAdicionar && (
          <button
            onClick={() => setMostrarAdicionar(!mostrarAdicionar)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        )}
      </div>

      {/* Formulário para adicionar procedimento */}
      {mostrarAdicionar && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <textarea
            value={novoProcedimento}
            onChange={(e) => setNovoProcedimento(e.target.value)}
            placeholder="Descreva o procedimento realizado..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={adicionando}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setMostrarAdicionar(false);
                setNovoProcedimento('');
              }}
              className="px-3 py-1 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              disabled={adicionando}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdicionarProcedimento}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              disabled={adicionando || !novoProcedimento.trim()}
            >
              {adicionando ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de procedimentos */}
      <div className="max-h-80 overflow-y-auto">
        {historico.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhum procedimento registrado</p>
            <p className="text-sm">
              {!disabled && podeAdicionar ? 
                "Clique em 'Adicionar' para registrar o primeiro procedimento." : 
                "Nenhum procedimento foi registrado para este acesso."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {historico.map((procedimento: ProcedimentoAcesso) => (
              <div key={procedimento.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Avatar/Círculo do usuário */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  {/* Conteúdo do procedimento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {procedimento.usuario_nome}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatarData(procedimento.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {procedimento.procedimento}
                    </p>
                    
                    {/* Email do usuário */}
                    <p className="text-xs text-gray-500 mt-1">
                      {procedimento.usuario_email}
                    </p>
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
