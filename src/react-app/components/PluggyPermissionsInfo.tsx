import { AlertTriangle, Info, ExternalLink, Shield, CheckCircle, XCircle } from 'lucide-react';

interface PluggyPermissionsInfoProps {
  show: boolean;
  onClose: () => void;
}

export default function PluggyPermissionsInfo({ show, onClose }: PluggyPermissionsInfoProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Permissões da API Pluggy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Status Atual das Permissões</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Contas bancárias - <strong>Disponível</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Transações básicas - <strong>Disponível</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-gray-700">Faturas de cartão - <strong>Restrito</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-gray-700">Detalhes de cartão - <strong>Restrito</strong></span>
              </div>
            </div>
          </div>

          {/* Why This Happens */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Por que isso acontece?</h3>
            </div>
            <div className="text-blue-800 space-y-3 text-sm">
              <p>
                <strong>Permissões Graduais:</strong> O Pluggy usa um sistema de permissões graduais por motivos de segurança e conformidade com regulamentações bancárias.
              </p>
              <p>
                <strong>Dados Sensíveis:</strong> Faturas de cartão de crédito contêm informações muito sensíveis e requerem aprovação adicional dos bancos.
              </p>
              <p>
                <strong>Planos Diferentes:</strong> Algumas funcionalidades podem estar disponíveis apenas em planos comerciais ou enterprise.
              </p>
            </div>
          </div>

          {/* What You Can Do */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">O que você pode fazer</h3>
            </div>
            <div className="space-y-4">
              <div className="text-green-800 space-y-3 text-sm">
                <div>
                  <strong>1. Continue usando normalmente:</strong>
                  <p className="ml-4 text-green-700">• Cadastre cartões manualmente na aba "Cartões"</p>
                  <p className="ml-4 text-green-700">• Use a sincronização de transações bancárias disponível</p>
                  <p className="ml-4 text-green-700">• Aproveite todos os recursos de análise e insights</p>
                </div>
                
                <div>
                  <strong>2. Solicite permissões adicionais:</strong>
                  <p className="ml-4 text-green-700">• Entre em contato com o suporte do Pluggy</p>
                  <p className="ml-4 text-green-700">• Solicite acesso às APIs de cartão de crédito</p>
                  <p className="ml-4 text-green-700">• Informe que precisa para integração com aplicativo financeiro</p>
                </div>

                <div>
                  <strong>3. Considere upgrade:</strong>
                  <p className="ml-4 text-green-700">• Verifique se há planos com mais permissões</p>
                  <p className="ml-4 text-green-700">• Avalie o custo-benefício para seu uso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Examples */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Erros Comuns (Normal)</h3>
            </div>
            <div className="text-gray-700 space-y-2 text-sm font-mono bg-gray-100 p-3 rounded-lg">
              <p>• 403 Forbidden - Credit card bills access denied</p>
              <p>• 403 Forbidden - Additional permissions required</p>
              <p>• Account access restricted for credit cards</p>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              <strong>Importante:</strong> Esses erros são esperados e não indicam problema na configuração.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-4 pt-4 border-t">
            <a
              href="https://docs.pluggy.ai/docs/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Documentação Pluggy
            </a>
            <a
              href="https://dashboard.pluggy.ai/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Suporte Pluggy
            </a>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
