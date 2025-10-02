import { useMemo } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/react-app/hooks/useNetworkStatus';

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return null;
  }

  try {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export default function OfflineShell() {
  const { refresh, lastChangedAt } = useNetworkStatus();

  const lastCheckedLabel = useMemo(() => formatTimestamp(lastChangedAt), [lastChangedAt]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 shadow-lg shadow-sky-900/40">
          <WifiOff className="h-10 w-10 text-sky-400" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Sem conexão com a internet</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Não foi possível acessar os serviços da Financeito. Verifique sua rede ou aguarde alguns instantes antes de tentar novamente.
          </p>
        </div>
        {lastCheckedLabel && (
          <p className="text-xs text-slate-500">
            Última verificação: <span className="text-slate-300">{lastCheckedLabel}</span>
          </p>
        )}
        <div className="space-y-3 text-left bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-200">Sugestões rápidas:</p>
          <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
            <li>Confirme se o Wi-Fi ou dados móveis estão ativos.</li>
            <li>Tente abrir outra página para validar a conexão.</li>
            <li>Se estiver em rede corporativa, confirme se há bloqueios para o domínio da aplicação.</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600"
          >
            <RefreshCw className="h-4 w-4" />
            Testar novamente
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/60"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  );
}
