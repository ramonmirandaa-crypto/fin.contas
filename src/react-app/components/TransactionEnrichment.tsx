import { useState } from 'react';
import { Sparkles, Tag, FileText, AlertTriangle, TrendingUp, Zap, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';

interface TransactionEnrichmentProps {
  transactionId: number;
  currentCategory: string;
  onEnrichmentComplete: (enrichment: any) => void;
}

interface EnrichmentResult {
  suggestedCategory: string;
  tags: string[];
  notes: string;
  isRecurring: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  merchantInfo?: {
    name: string;
    category: string;
    mcc: string;
  };
  paymentInfo?: {
    method: string;
    pixKey: string;
    endToEndId: string;
  };
}

export default function TransactionEnrichment({ 
  transactionId, 
  currentCategory, 
  onEnrichmentComplete 
}: TransactionEnrichmentProps) {
  const [enriching, setEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrichTransaction = async () => {
    try {
      setEnriching(true);
      setError(null);
      
      const response = await apiFetch(`/api/transactions/${transactionId}/enrich`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEnrichment(data.enrichment);
        onEnrichmentComplete(data.enrichment);
      } else {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Erro no enriquecimento');
      }
    } catch (error) {
      setError('Erro ao enriquecer transação');
      console.error('Enrichment error:', error);
    } finally {
      setEnriching(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enriquecimento de Transação</h3>
            <p className="text-sm text-gray-600">Análise inteligente com IA</p>
          </div>
        </div>
        
        <button
          onClick={enrichTransaction}
          disabled={enriching}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {enriching ? 'Analisando...' : 'Enriquecer'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {enriching && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Analisando transação...</p>
              <p className="text-xs text-purple-600">Usando inteligência artificial para extrair insights</p>
            </div>
          </div>
        </div>
      )}

      {enrichment && (
        <div className="space-y-4">
          {/* Category Suggestion */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Categoria Sugerida</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-800">{enrichment.suggestedCategory}</span>
              {enrichment.suggestedCategory !== currentCategory && (
                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  Diferente da atual
                </span>
              )}
            </div>
          </div>

          {/* Risk Level */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Nível de Risco</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(enrichment.riskLevel)}`}>
                {getRiskLevelIcon(enrichment.riskLevel)}
                {enrichment.riskLevel.toUpperCase()}
              </span>
              {enrichment.isRecurring && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <TrendingUp className="w-3 h-3" />
                  RECORRENTE
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {enrichment.tags && enrichment.tags.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Tags Sugeridas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {enrichment.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {enrichment.notes && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Observações</span>
              </div>
              <p className="text-sm text-yellow-800">{enrichment.notes}</p>
            </div>
          )}

          {/* Merchant Info */}
          {enrichment.merchantInfo && (
            <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-900">Informações do Comerciante</span>
              </div>
              <div className="space-y-1 text-sm text-violet-800">
                {enrichment.merchantInfo.name && (
                  <p><span className="font-medium">Nome:</span> {enrichment.merchantInfo.name}</p>
                )}
                {enrichment.merchantInfo.category && (
                  <p><span className="font-medium">Categoria:</span> {enrichment.merchantInfo.category}</p>
                )}
                {enrichment.merchantInfo.mcc && (
                  <p><span className="font-medium">MCC:</span> {enrichment.merchantInfo.mcc}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {enrichment.paymentInfo && (
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-900">Informações do Pagamento</span>
              </div>
              <div className="space-y-1 text-sm text-cyan-800">
                {enrichment.paymentInfo.method && (
                  <p><span className="font-medium">Método:</span> {enrichment.paymentInfo.method}</p>
                )}
                {enrichment.paymentInfo.pixKey && (
                  <p><span className="font-medium">Chave PIX:</span> {enrichment.paymentInfo.pixKey}</p>
                )}
                {enrichment.paymentInfo.endToEndId && (
                  <p><span className="font-medium">End-to-End ID:</span> {enrichment.paymentInfo.endToEndId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
