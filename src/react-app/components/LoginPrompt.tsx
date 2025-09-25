import { SignInButton } from '@clerk/clerk-react';
import { Wallet, Shield, Brain } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPrompt() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 paper-texture flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 text-center">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg mx-auto w-fit mb-6">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Financeito
          </h1>
          <p className="text-gray-600 mb-8">
            Seu gerenciador completo de finanças pessoais com IA
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <Shield className="w-6 h-6 text-emerald-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Seguro e Privado</h3>
                <p className="text-sm text-gray-600">Seus dados financeiros estão protegidos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <Brain className="w-6 h-6 text-emerald-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Insights com IA</h3>
                <p className="text-sm text-gray-600">Receba dicas personalizadas de gastos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Rastreamento Inteligente</h3>
                <p className="text-sm text-gray-600">Categorização automática de gastos</p>
              </div>
            </div>
          </div>

          <SignInButton mode="modal" forceRedirectUrl="/" signUpForceRedirectUrl="/">
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <GoogleIcon />
              Entrar ou criar conta
            </button>
          </SignInButton>

          <p className="text-xs text-gray-500 mt-4">
            Entre para começar a rastrear seus gastos e obter insights da IA
          </p>
        </div>
      </div>
    </div>
  );
}
