import { useState, useEffect } from 'react';
import { Plus, Settings, TestTube, RefreshCw, Trash2, CheckCircle, AlertCircle, Building2, Eye, EyeOff, Copy, ExternalLink, Info } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import PluggyPermissionsInfo from './PluggyPermissionsInfo';

interface PluggyConfig {
  clientId: string;
  clientSecret: string;
}

interface PluggyConnection {
  id: number;
  pluggy_item_id: string;
  institution_name: string;
  connection_status: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SyncStatus {
  isLoading: boolean;
  message: string;
  error: string | null;
}

export default function PluggyManager() {
  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [config, setConfig] = useState<PluggyConfig>({ clientId: '', clientSecret: '' });
  const [showConfig, setShowConfig] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newItemId, setNewItemId] = useState('');
  const [loading, setLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    message: '',
    error: null
  });
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState({
    webhookUrl: '',
    events: [] as string[],
    isActive: true
  });
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/pluggy/connections');
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Erro ao buscar conexões:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await apiFetch('/api/pluggy/config');
      if (response.ok) {
        const webhookResponse = await response.json();
        setConfig({
          clientId: webhookResponse.clientId || '',
          clientSecret: webhookResponse.clientSecret || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  useEffect(() => {
    fetchConnections();
    loadConfig();
    loadWebhookConfig();
  }, []);

  const loadWebhookConfig = async () => {
    try {
      const response = await apiFetch('/api/pluggy/webhook-config');
      if (response.ok) {
        const webhookData = await response.json();
        if (webhookData.webhookUrl) {
          setWebhookConfig({
            webhookUrl: webhookData.webhookUrl,
            events: webhookData.events || [],
            isActive: webhookData.isActive
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de webhook:', error);
    }
  };

  const saveWebhookConfig = async () => {
    if (!webhookConfig.webhookUrl.trim()) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'URL do webhook é obrigatória'
      });
      return;
    }

    setSyncStatus({ isLoading: true, message: 'Configurando webhook...', error: null });

    try {
      const response = await apiFetch('/api/pluggy/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookConfig)
      });

      if (response.ok) {
        const webhookResponse = await response.json();
        setSyncStatus({
          isLoading: false,
          message: `Webhook configurado com sucesso! ${webhookResponse.message || 'Agora você receberá notificações automáticas.'}`,
          error: null
        });
        setShowWebhookConfig(false);
      } else {
        const error = await response.json();
        setSyncStatus({
          isLoading: false,
          message: '',
          error: error.error || 'Erro ao configurar webhook'
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao configurar webhook'
      });
    }
  };

  const testWebhook = async () => {
    if (!webhookConfig.webhookUrl.trim()) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Configure o webhook primeiro'
      });
      return;
    }

    setTestingWebhook(true);
    setSyncStatus({ isLoading: true, message: 'Testando webhook...', error: null });

    try {
      const response = await apiFetch('/api/pluggy/test-webhook', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          isLoading: false,
          message: `Webhook testado com sucesso! Status: ${data.status}`,
          error: null
        });
      } else {
        setSyncStatus({
          isLoading: false,
          message: '',
          error: `Teste do webhook falhou: ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || data.details || 'Erro desconhecido'}`
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao testar webhook'
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const response = await apiFetch('/api/pluggy/webhook-logs?limit=20');
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de webhook:', error);
    }
  };

  const saveConfig = async () => {
    if (!config.clientId.trim() || !config.clientSecret.trim()) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Client ID e Client Secret são obrigatórios'
      });
      return;
    }

    setConfigSaving(true);
    setSyncStatus({ isLoading: false, message: '', error: null });

    try {
      const response = await apiFetch('/api/pluggy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setSyncStatus({
          isLoading: false,
          message: 'Configuração salva com sucesso!',
          error: null
        });
      } else {
        const error = await response.text();
        setSyncStatus({
          isLoading: false,
          message: '',
          error: `Erro ao salvar configuração: ${error}`
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao salvar configuração'
      });
    } finally {
      setConfigSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.clientId.trim() || !config.clientSecret.trim()) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Configure Client ID e Client Secret primeiro'
      });
      return;
    }

    setTestingConnection(true);
    setSyncStatus({ isLoading: true, message: 'Testando conexão com Pluggy...', error: null });

    try {
      const response = await apiFetch('/api/pluggy/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          isLoading: false,
          message: 'Conexão com Pluggy testada com sucesso! ✅',
          error: null
        });
      } else {
        setSyncStatus({
          isLoading: false,
          message: '',
          error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Erro ao testar conexão'
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao testar conexão com Pluggy'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const addConnection = async () => {
    if (!newItemId.trim()) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Item ID é obrigatório'
      });
      return;
    }

    setSyncStatus({ isLoading: true, message: 'Adicionando conexão...', error: null });

    try {
      const response = await apiFetch('/api/pluggy/add-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: newItemId.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setNewItemId('');
        setShowAddConnection(false);
        await fetchConnections();
        setSyncStatus({
          isLoading: false,
          message: 'Conexão adicionada com sucesso!',
          error: null
        });
      } else {
        setSyncStatus({
          isLoading: false,
          message: '',
          error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Erro ao adicionar conexão'
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao adicionar conexão'
      });
    }
  };

  const syncConnection = async (itemId?: string) => {
    setSyncStatus({ 
      isLoading: true, 
      message: itemId ? 'Sincronizando conexão...' : 'Sincronizando todas as conexões...', 
      error: null 
    });

    try {
      const endpoint = itemId ? `/api/pluggy/sync/${itemId}` : '/api/pluggy/sync';
      console.log(`[PluggyManager] Starting sync for endpoint: ${endpoint}`);
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log(`[PluggyManager] Sync response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PluggyManager] Sync failed with status ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log(`[PluggyManager] Raw response text:`, responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[PluggyManager] Failed to parse JSON response:`, parseError);
        console.error(`[PluggyManager] Response text that failed to parse:`, responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      console.log(`[PluggyManager] Parsed result:`, data);

      if (data.success) {
        await fetchConnections();
        let message = `Sincronização concluída! ${data.newTransactions || 0} novas transações importadas.`;
        if (data.errors && data.errors.length > 0) {
          message += ` (${data.errors.length} erros ocorreram)`;
        }
        setSyncStatus({
          isLoading: false,
          message: message,
          error: null
        });
      } else {
        setSyncStatus({
          isLoading: false,
          message: '',
          error: data.error || 'Erro durante a sincronização'
        });
      }
    } catch (error) {
      console.error('[PluggyManager] Error syncing transactions:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSyncStatus({
        isLoading: false,
        message: '',
        error: `Erro ao sincronizar: ${errorMessage}`
      });
    }
  };

  const removeConnection = async (connectionId: number) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return;

    try {
      const response = await apiFetch(`/api/pluggy/connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchConnections();
        setSyncStatus({
          isLoading: false,
          message: 'Conexão removida com sucesso!',
          error: null
        });
      }
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        message: '',
        error: 'Erro ao remover conexão'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSyncStatus({
      isLoading: false,
      message: 'Copiado para a área de transferência!',
      error: null
    });
    setTimeout(() => setSyncStatus({ isLoading: false, message: '', error: null }), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONNECTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'LOGIN_ERROR':
      case 'OUTDATED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONNECTED':
        return 'Conectada';
      case 'LOGIN_ERROR':
        return 'Erro de Login';
      case 'OUTDATED':
        return 'Requer Atualização';
      default:
        return status || 'Desconhecido';
    }
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Nunca sincronizada';
    
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Integração Pluggy</h2>
            <p className="text-gray-600">Configuração manual seguindo o padrão do Actual Budget</p>
          </div>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowPermissionsInfo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
          >
            <Info className="w-5 h-5" />
            Permissões
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
            API Config
          </button>
          <button
            onClick={() => {
              setShowWebhookConfig(true);
              loadWebhookLogs();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Webhooks
          </button>
          <button
            onClick={() => syncConnection()}
            disabled={syncStatus.isLoading || connections.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
            Sincronizar Tudo
          </button>
          <button
            onClick={() => setShowAddConnection(true)}
            disabled={!config.clientId || !config.clientSecret}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Adicionar Conexão
          </button>
        </div>
      </div>

      {/* Status Message */}
      {(syncStatus.message || syncStatus.error) && (
        <div className={`p-4 rounded-xl mb-6 ${
          syncStatus.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus.isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : syncStatus.error ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <p>{typeof syncStatus.error === 'string' ? syncStatus.error : syncStatus.error ? JSON.stringify(syncStatus.error) : syncStatus.message}</p>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Configuração do Pluggy</h3>
            
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📚 Como configurar:</h4>
                <ol className="text-blue-800 space-y-1 text-sm">
                  <li>1. Acesse o <a href="https://dashboard.pluggy.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Dashboard do Pluggy</a></li>
                  <li>2. Vá em "Settings" → "API Keys"</li>
                  <li>3. Copie seu Client ID e Client Secret</li>
                  <li>4. Cole as credenciais abaixo</li>
                  <li>5. Teste a conexão antes de salvar</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.clientId}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Seu Client ID do Pluggy"
                    />
                    <button
                      onClick={() => copyToClipboard(config.clientId)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600"
                      disabled={!config.clientId}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={config.clientSecret}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                      className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Seu Client Secret do Pluggy"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(config.clientSecret)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        disabled={!config.clientSecret}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Connection */}
              <div className="flex gap-3">
                <button
                  onClick={testConnection}
                  disabled={testingConnection || !config.clientId || !config.clientSecret}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 disabled:opacity-50"
                >
                  <TestTube className={`w-5 h-5 ${testingConnection ? 'animate-pulse' : ''}`} />
                  {testingConnection ? 'Testando...' : 'Testar Conexão'}
                </button>
                <a
                  href="https://dashboard.pluggy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  <ExternalLink className="w-5 h-5" />
                  Dashboard Pluggy
                </a>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={saveConfig}
                disabled={configSaving || !config.clientId || !config.clientSecret}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {configSaving ? 'Salvando...' : 'Salvar Configuração'}
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Adicionar Conexão Pluggy</h3>
            
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">ℹ️ Como obter um Item ID:</h4>
                <ol className="text-amber-800 space-y-1 text-sm">
                  <li>1. Use o Pluggy Connect para conectar uma conta bancária</li>
                  <li>2. Após a conexão, você receberá um Item ID</li>
                  <li>3. Copie esse Item ID e cole abaixo</li>
                  <li>4. Cada conta bancária tem seu próprio Item ID único</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item ID do Pluggy
                </label>
                <input
                  type="text"
                  value={newItemId}
                  onChange={(e) => setNewItemId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 01234567-89ab-cdef-0123-456789abcdef"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addConnection}
                disabled={!newItemId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setNewItemId('');
                  setShowAddConnection(false);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      {(!config.clientId || !config.clientSecret) && (
        <div className="bg-yellow-50 rounded-xl p-6 mb-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Configuração Necessária</h3>
          <p className="text-yellow-800 mb-4">
            Para usar a integração Pluggy, você precisa configurar suas credenciais de API primeiro.
          </p>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700"
          >
            Configurar Agora
          </button>
        </div>
      )}

      {/* Connections List */}
      <div className="space-y-4">
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma conexão cadastrada</h3>
            <p className="text-gray-600 mb-4">
              Adicione conexões manualmente usando Item IDs do Pluggy para começar a sincronizar dados financeiros.
            </p>
            {config.clientId && config.clientSecret && (
              <button
                onClick={() => setShowAddConnection(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Adicionar Primeira Conexão
              </button>
            )}
          </div>
        ) : (
          connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {connection.institution_name || 'Instituição Desconhecida'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(connection.connection_status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(connection.connection_status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Item ID: {connection.pluggy_item_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    Última sincronização: {formatLastSync(connection.last_sync_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(connection.pluggy_item_id)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                  title="Copiar Item ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => syncConnection(connection.pluggy_item_id)}
                  disabled={syncStatus.isLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </button>
                <button
                  onClick={() => removeConnection(connection.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remover conexão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Documentation Reference */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-2">📖 Baseado no Actual Budget</h4>
          <p className="text-sm text-gray-600 mb-3">
            Esta implementação segue o padrão manual do Actual Budget para máximo controle sobre as conexões Pluggy.
          </p>
          <div className="flex gap-3">
            <a
              href="https://actualbudget.org/docs/experimental/pluggyai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Documentação Oficial
            </a>
            <a
              href="https://github.com/actualbudget/actual"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Código Fonte
            </a>
          </div>
        </div>
      </div>

      {/* Webhook Configuration Modal */}
      {showWebhookConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Configuração de Webhooks</h3>
              <button
                onClick={() => setShowWebhookConfig(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webhook Configuration */}
              <div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">🚀 Webhooks Automáticos</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    Receba notificações automáticas quando novas transações forem criadas, 
                    atualizadas ou excluídas. Elimine a necessidade de sincronização manual!
                  </p>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Sincronização em tempo real</li>
                    <li>• Reduz uso de API (menos polling)</li>
                    <li>• Dados sempre atualizados</li>
                    <li>• Melhor experiência do usuário</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Webhook *
                    </label>
                    <input
                      type="url"
                      value={webhookConfig.webhookUrl}
                      onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://your-app.com/api/pluggy/webhook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL onde o Pluggy enviará as notificações de eventos
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eventos Monitorados
                    </label>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Novas transações</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Transações atualizadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Transações excluídas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>Status de conexões</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          <span>Novas contas e faturas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="webhookActive"
                      checked={webhookConfig.isActive}
                      onChange={(e) => setWebhookConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="webhookActive" className="ml-2 text-sm text-gray-700">
                      Webhook ativo
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveWebhookConfig}
                      disabled={!webhookConfig.webhookUrl.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                    >
                      Salvar Configuração
                    </button>
                    <button
                      onClick={testWebhook}
                      disabled={testingWebhook || !webhookConfig.webhookUrl.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                      <TestTube className={`w-4 h-4 ${testingWebhook ? 'animate-pulse' : ''}`} />
                      {testingWebhook ? 'Testando...' : 'Testar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Logs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Logs Recentes</h4>
                  <button
                    onClick={loadWebhookLogs}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Atualizar
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {webhookLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ExternalLink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm">Nenhum log de webhook ainda</p>
                      <p className="text-xs">Configure e teste o webhook para ver os logs</p>
                    </div>
                  ) : (
                    webhookLogs.map((log: any, index) => (
                      <div
                        key={log.id || index}
                        className={`p-3 rounded-lg border ${
                          log.success 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            log.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {log.success ? '✅ Sucesso' : '❌ Falha'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.attempt_at || log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <p>Webhook ID: {log.webhook_id}</p>
                          {log.error_message && (
                            <p className="text-red-600 mt-1">
                              Erro: {log.error_message}
                            </p>
                          )}
                          {log.webhook_url && (
                            <p className="truncate mt-1">
                              URL: {log.webhook_url}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {webhookLogs.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Estatísticas:</p>
                      <div className="flex justify-between">
                        <span>Sucessos: {webhookLogs.filter((log: any) => log.success).length}</span>
                        <span>Falhas: {webhookLogs.filter((log: any) => !log.success).length}</span>
                        <span>Total: {webhookLogs.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">💡 Dicas de Implementação</h4>
                <ul className="text-amber-800 text-sm space-y-1">
                  <li>• Use HTTPS para a URL do webhook (obrigatório)</li>
                  <li>• Implemente validação de assinatura se disponível</li>
                  <li>• Responda rapidamente (&lt; 5 segundos) para evitar timeout</li>
                  <li>• Retorne status 200 para confirmar recebimento</li>
                  <li>• Implemente retry logic para falhas temporárias</li>
                  <li>• Use filas para processamento assíncrono</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Info Modal */}
      <PluggyPermissionsInfo 
        show={showPermissionsInfo} 
        onClose={() => setShowPermissionsInfo(false)} 
      />
    </div>
  );
}
