import { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';

interface CreateAssuntoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAssuntoModal({ isOpen, onClose, onSuccess }: CreateAssuntoModalProps) {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!nome.trim()) {
      setError('Por favor, informe o nome do assunto');
      return;
    }

    if (nome.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (nome.trim().length > 100) {
      setError('O nome deve ter no máximo 100 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data } = await supabase
        .from('assuntos_padrao')
        .insert([{ nome: nome.trim() }])
        .select()
        .single();

      if (data) {
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes('duplicate key')) {
        setError('Este assunto já existe');
      } else if (error.message?.includes('violates row level security')) {
        setError('Sem permissão para criar assuntos');
      } else {
        setError('Erro ao criar assunto. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setError('');
    setFocusedField('');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Assunto</h2>
              <p className="text-sm text-gray-600">Crie um novo assunto padrão</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nome do Assunto
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onFocus={() => setFocusedField('nome')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                focusedField === 'nome' 
                  ? 'border-green-500 ring-2 ring-green-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Ex: Uma lâmpada apagada"
              required
              maxLength={100}
            />
            <div className="mt-1 text-xs text-gray-500">
              {nome.length}/100 caracteres
            </div>
          </div>

          {/* Exemplos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Exemplos de assuntos:</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setNome('Uma lâmpada apagada')}
                className="block w-full text-left text-xs text-gray-600 hover:text-green-600 transition-colors py-1"
              >
                • Uma lâmpada apagada
              </button>
              <button
                type="button"
                onClick={() => setNome('Tapa buraco asfaltico')}
                className="block w-full text-left text-xs text-gray-600 hover:text-green-600 transition-colors py-1"
              >
                • Tapa buraco asfaltico
              </button>
              <button
                type="button"
                onClick={() => setNome('Asfalto Novo')}
                className="block w-full text-left text-xs text-gray-600 hover:text-green-600 transition-colors py-1"
              >
                • Asfalto Novo
              </button>
              <button
                type="button"
                onClick={() => setNome('Reforma de calha de drenagem')}
                className="block w-full text-left text-xs text-gray-600 hover:text-green-600 transition-colors py-1"
              >
                • Calha de drenagem
              </button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nome.trim() || nome.trim().length < 3}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </div>
              ) : (
                'Criar Assunto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

