import { useState } from 'react';
import { Key, Shield } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import LoadingButton from './UI/LoadingButton';

export default function PasswordChangeSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Segurança da Conta</h3>
              <p className="text-sm text-gray-600">Gerencie sua senha de acesso</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Senha de Acesso</p>
                <p className="text-sm text-gray-600">Altere sua senha regularmente para manter a segurança</p>
              </div>
            </div>
            <LoadingButton
              onClick={handleOpenModal}
              variant="primary"
            >
              Alterar Senha
            </LoadingButton>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Dica de Segurança:</p>
            <ul className="space-y-1">
              <li>• Use senhas com pelo menos 4 caracteres</li>
              <li>• Altere sua senha periodicamente</li>
              <li>• Não compartilhe sua senha com ninguém</li>
              <li>• Caso esqueça, contate um administrador</li>
            </ul>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Alterar Senha de Acesso"
        showCurrentPassword={false}
      />
    </>
  );
}
