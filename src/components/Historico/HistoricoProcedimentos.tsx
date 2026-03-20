import { useState, useEffect } from 'react';
import { Clock, User, Plus, AlertCircle } from 'lucide-react';
import { useHistoricoProcedimentos, Procedimento } from '../../hooks/useHistoricoProcedimentos';

interface HistoricoProcedimentosProps {
  itemId: string;
  itemTipo: 'solicitacao' | 'demanda' | 'acesso';
  disabled?: boolean;
  className?: string;
}

export default function HistoricoProcedimentos({ 
  itemId, 
  itemTipo, 
  disabled = false,
  className = ''
}: HistoricoProcedimentosProps) {
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
  } = useHistoricoProcedimentos({ itemId, itemTipo });

  // Verificar permissões ao carregar
  useEffect(() => {
    const verificarPermissao = async () => {
      const temPermissao = await podeAdicionarProcedimento();
      setPodeAdicionar(temPermissao);
    };
    verificarPermissao();
  }, [itemId, itemTipo]);

  const handleAdicionarProcedimento = async () => {
    if (!novoProcedimento.trim()) return;

    const sucesso = await adicionarProcedimento(novoProcedimento);
    
    if (sucesso) {
      setNovoProcedimento('');
      setMostrarAdicionar(false);
    }
  };

  const handleCancelarAdicao = () => {
    setNovoProcedimento('');
    setMostrarAdicionar(false);
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Histórico de Procedimentos</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              {historico.length} registro{historico.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {podeAdicionar && !disabled && !mostrarAdicionar && (
            <button
              onClick={() => setMostrarAdicionar(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Formulário para adicionar procedimento */}
      {mostrarAdicionar && podeAdicionar && !disabled && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descreva o procedimento realizado:
              </label>
              <textarea
                value={novoProcedimento}
                onChange={(e) => setNovoProcedimento(e.target.value)}
                placeholder="Ex: Documento enviado ao setor X, Contato realizado com cliente, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={adicionando}
                autoFocus
              />
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelarAdicao}
                disabled={adicionando}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarProcedimento}
                disabled={adicionando || !novoProcedimento.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adicionando ? 'Adicionando...' : 'Adicionar Procedimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de procedimentos */}
      <div className="max-h-80 overflow-y-auto">
        {historico.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhum procedimento registrado</p>
            <p className="text-sm text-gray-400">
              {podeAdicionar && !disabled 
                ? 'Adicione o primeiro procedimento usando o botão acima.'
                : 'Nenhum procedimento foi registrado para este item.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {historico.map((procedimento: Procedimento, index: number) => (
              <div key={procedimento.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Avatar/Círculo do usuário */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Conteúdo do procedimento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {procedimento.usuario_nome}
                        </span>
                        <span className="text-xs text-gray-500">
                          {procedimento.usuario_email}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatarData(procedimento.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {procedimento.procedimento}
                    </p>
                    
                    {/* Indicador visual para o primeiro registro (migrado) */}
                    {index === historico.length - 1 && procedimento.procedimento.startsWith('Observação original:') && (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        📋 Registro migrado do campo observações original
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          ℹ️ Os procedimentos são imutáveis e registram data, hora e usuário automaticamente
        </p>
      </div>
    </div>
  );
}
