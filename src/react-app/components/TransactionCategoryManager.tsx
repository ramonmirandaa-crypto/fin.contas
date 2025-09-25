import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Hash, Save, X } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';

interface TransactionCategory {
  id: number;
  user_id: string;
  name: string;
  color?: string;
  parent_id?: number;
  description?: string;
  keywords?: string;
  rules?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateCategory {
  name: string;
  color?: string;
  description?: string;
  keywords?: string[];
  parent_id?: number;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#A29BFE', '#FD79A8', '#B2B2B2',
  '#FF7675', '#00B894', '#0984E3', '#6C5CE7', '#FDCB6E',
  '#E84393', '#00CEC9', '#A29BFE', '#FD79A8', '#636E72'
];

export default function TransactionCategoryManager() {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [formData, setFormData] = useState<CreateCategory>({
    name: '',
    color: DEFAULT_COLORS[0],
    description: '',
    keywords: []
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/transaction-categories', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create category
  const createCategory = async () => {
    try {
      const response = await apiFetch('/api/transaction-categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowCreateForm(false);
      setFormData({ name: '', color: DEFAULT_COLORS[0], description: '', keywords: [] });
      fetchCategories();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await apiFetch(`/api/transaction-categories/${editingCategory.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEditingCategory(null);
      setFormData({ name: '', color: DEFAULT_COLORS[0], description: '', keywords: [] });
      fetchCategories();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    }
  };

  // Delete category
  const deleteCategory = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const response = await apiFetch(`/api/transaction-categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
    }
  };

  // Start editing
  const startEdit = (category: TransactionCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || DEFAULT_COLORS[0],
      description: category.description || '',
      keywords: category.keywords ? JSON.parse(category.keywords) : []
    });
  };

  // Cancel edit/create
  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: DEFAULT_COLORS[0], description: '', keywords: [] });
  };

  const formatCategoryKeywords = (keywords: string | undefined) => {
    if (!keywords) return [];
    try {
      return JSON.parse(keywords);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h2>
          <p className="text-gray-600">Organize suas transações com categorias personalizadas</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nome da categoria"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_COLORS.slice(0, 10).map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              placeholder="Descrição da categoria (opcional)"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
            <input
              type="text"
              placeholder="Digite palavras-chave separadas por vírgula"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value && !formData.keywords?.includes(value)) {
                    setFormData({
                      ...formData,
                      keywords: [...(formData.keywords || []), value]
                    });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            {formData.keywords && formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {keyword}
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        keywords: formData.keywords?.filter((_, i) => i !== index)
                      })}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={cancelForm}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={editingCategory ? updateCategory : createCategory}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {editingCategory ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma categoria encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: category.color || '#B2B2B2' }}
                    />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        {category.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Padrão
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      {category.keywords && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formatCategoryKeywords(category.keywords).map((keyword: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                            >
                              <Hash className="w-3 h-3 mr-1" />
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    {!category.is_default && (
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
