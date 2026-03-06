import { useState, useEffect } from 'react';
import { Users, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface FiltroResponsavelProps {
  responsaveisSelecionados: string[];
  onResponsaveisChange: (responsaveis: string[]) => void;
  className?: string;
}

export default function FiltroResponsavel({ 
  responsaveisSelecionados, 
  onResponsaveisChange,
  className = ''
}: FiltroResponsavelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  const carregarResponsaveis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponsaveisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onResponsaveisChange(selectedOptions);
  };

  const limparFiltro = () => {
    onResponsaveisChange([]);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse flex items-center space-x-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  const todosResponsaveis = profiles.filter(p => p.full_name);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-600" />
            <label className="font-medium text-gray-700">
              Responsável:
            </label>
          </div>
          
          <select
            multiple
            value={responsaveisSelecionados}
            onChange={handleResponsaveisChange}
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            size={1}
          >
            <option value="" disabled>
              {responsaveisSelecionados.length === 0 
                ? 'Selecione responsáveis...' 
                : `${responsaveisSelecionados.length} selecionado(s)`
              }
            </option>
            {todosResponsaveis.map((responsavel) => (
              <option key={responsavel.id} value={responsavel.id}>
                {responsavel.full_name}
              </option>
            ))}
          </select>

          <div className="text-xs text-gray-500">
            Ctrl+Click para múltiplos
          </div>
        </div>

        {responsaveisSelecionados.length > 0 && (
          <button
            onClick={limparFiltro}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {responsaveisSelecionados.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {responsaveisSelecionados.map(responsavelId => {
              const responsavel = todosResponsaveis.find(r => r.id === responsavelId);
              return (
                <span
                  key={responsavelId}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {responsavel?.full_name || responsavelId}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
