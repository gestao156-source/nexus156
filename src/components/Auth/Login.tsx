import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logger from '../../utils/logger';
import ErrorService from '../../services/errorService';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
}

export default function Login({ onToggleMode }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      Logger.debug('Login bem-sucedido, redirecionando para dashboard', {}, 'Login');
      // Redirecionamento manual após login bem-sucedido
      setTimeout(() => {
        Logger.debug('Executando redirecionamento para /dashboard', {}, 'Login');
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      ErrorService.handleError(err, { component: 'Login', action: 'signIn' });
      
      // Tratamento específico de erros do Supabase
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (err?.message?.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada.');
      } else if (err?.message?.includes('Too many requests')) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else if (err?.message?.includes('User not found')) {
        setError('Usuário não encontrado. Verifique o email.');
      } else {
        setError(`Erro ao fazer login: ${err?.message || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Bem-vindo ao Nexus 156
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Entre com suas credenciais
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Não tem uma conta? Cadastre-se
          </button>
          
          <div className="text-center text-sm text-gray-600">
            <p>Entre com suas credenciais para acessar o sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
}