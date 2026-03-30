import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Eye, EyeOff, Check, X, Shield, Key, User, Mail } from 'lucide-react';

interface RegisterProps {
  onToggleMode: () => void;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

export default function Register({ onToggleMode }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { signUp } = useAuth();

  // Requisitos de senha
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { regex: /.{8,}/, text: 'Pelo menos 8 caracteres', met: false },
    { regex: /[A-Z]/, text: 'Uma letra maiúscula', met: false },
    { regex: /[a-z]/, text: 'Uma letra minúscula', met: false },
    { regex: /[0-9]/, text: 'Um número', met: false },
    { regex: /[^A-Za-z0-9]/, text: 'Um caractere especial', met: false }
  ]);

  // Verificar força da senha
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const updatedRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
    setPasswordRequirements(updatedRequirements);

    // Calcular força da senha (0-100)
    const metCount = updatedRequirements.filter(req => req.met).length;
    setPasswordStrength((metCount / updatedRequirements.length) * 100);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 20) return 'bg-red-500';
    if (passwordStrength <= 40) return 'bg-orange-500';
    if (passwordStrength <= 60) return 'bg-yellow-500';
    if (passwordStrength <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 20) return 'Muito fraca';
    if (passwordStrength <= 40) return 'Fraca';
    if (passwordStrength <= 60) return 'Média';
    if (passwordStrength <= 80) return 'Forte';
    return 'Muito forte';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    if (fullName.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um email válido');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const allRequirementsMet = passwordRequirements.every(req => req.met);
    if (!allRequirementsMet) {
      setError('A senha não atende a todos os requisitos');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.message?.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else if (err.message?.includes('Password should be')) {
        setError('A senha não atende aos requisitos de segurança');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-bg-primary/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Criar Conta
          </h1>
          <p className="text-text-secondary">
            Junte-se ao Nexus156 e gerencie suas solicitações
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <X className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50/80 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>Conta criada com sucesso! Você já pode fazer login.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Nome */}
          <div className="relative">
            <label className="block text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                focusedField === 'fullName' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="João Silva"
              required
            />
          </div>

          {/* Campo Email */}
          <div className="relative">
            <label className="block text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="joao@exemplo.com"
              required
            />
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <label className="block text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 ${
                  focusedField === 'password' 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Indicador de força da senha */}
            {password && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">Força da senha</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength <= 40 ? 'text-red-600' : 
                    passwordStrength <= 60 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}

            {/* Requisitos da senha */}
            {password && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Requisitos da senha:
                </p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <X className="w-3 h-3 text-text-muted" />
                      )}
                      <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campo Confirmar Senha */}
          <div className="relative">
            <label className="block text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 ${
                  focusedField === 'confirmPassword' 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-300 bg-red-50' 
                    : confirmPassword && password === confirmPassword 
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-1 text-xs">
                {password === confirmPassword ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> As senhas coincidem
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <X className="w-3 h-3" /> As senhas não coincidem
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading || !passwordRequirements.every(req => req.met) || password !== confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando conta...
              </div>
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        {/* Link para Login */}
        <div className="mt-8 text-center">
          <p className="text-text-secondary">
            Já tem uma conta?{' '}
            <button
              onClick={onToggleMode}
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline"
            >
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

