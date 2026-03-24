import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Requisitos de senha
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { regex: /.{8,}/, text: 'Pelo menos 8 caracteres', met: false },
    { regex: /[A-Z]/, text: 'Uma letra maiúscula', met: false },
    { regex: /[a-z]/, text: 'Uma letra minúscula', met: false },
    { regex: /[0-9]/, text: 'Um número', met: false },
    { regex: /[^A-Za-z0-9]/, text: 'Um caractere especial', met: false }
  ]);

  const [passwordStrength, setPasswordStrength] = useState(0);

  // Gerar senha automática segura
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Preencher o resto
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    if (autoGeneratePassword && isOpen) {
      const newPassword = generateSecurePassword();
      setPassword(newPassword);
    }
  }, [autoGeneratePassword, isOpen]);

  useEffect(() => {
    const updatedRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
    setPasswordRequirements(updatedRequirements);

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

    // Validações
    if (!fullName.trim()) {
      setError('Por favor, informe o nome completo');
      return;
    }

    if (fullName.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe o email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um email válido');
      return;
    }

    const allRequirementsMet = passwordRequirements.every(req => req.met);
    if (!allRequirementsMet) {
      setError('A senha não atende a todos os requisitos');
      return;
    }

    setLoading(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role
          }
        }
      });

      if (data.user) {
        // Criar perfil
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName.trim(),
              role: role
            }
          ]);
        
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (err: any) {
      if (err.message?.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else if (err.message?.includes('Password should be')) {
        setError('A senha não atende aos requisitos de segurança');
      } else {
        setError('Erro ao criar usuário. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRole('user');
    setPassword('');
    setAutoGeneratePassword(true);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Usuário</h2>
              <p className="text-sm text-gray-600">Crie uma nova conta de acesso</p>
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
              <User className="w-4 h-4" />
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                focusedField === 'fullName' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="João Silva"
              required
            />
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="joao@exemplo.com"
              required
            />
          </div>

          {/* Campo Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Nível de Acesso
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  role === 'user'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Usuário</div>
                <div className="text-xs text-gray-600">Acesso básico</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  role === 'admin'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Administrador</div>
                <div className="text-xs text-gray-600">Acesso total</div>
              </button>
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Senha
              </label>
              <button
                type="button"
                onClick={() => setAutoGeneratePassword(!autoGeneratePassword)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {autoGeneratePassword ? 'Definir manualmente' : 'Gerar automaticamente'}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                disabled={autoGeneratePassword}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg transition-all duration-200 ${
                  autoGeneratePassword
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                    : focusedField === 'password'
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder={autoGeneratePassword ? 'Senha gerada automaticamente' : '••••••••'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Indicador de força da senha */}
            {password && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Força da senha</span>
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
            {password && !autoGeneratePassword && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Requisitos da senha:
                </p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
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
              disabled={loading || !passwordRequirements.every(req => req.met)}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </div>
              ) : (
                'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
