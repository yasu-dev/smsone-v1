import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, 
  FileText, Download, Copy, Calendar, Clock, 
  Check, X, Grid, List, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// 請求書テンプレートの型定義
interface InvoiceTemplateData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  previewUrl: string;
  isDefault: boolean;
  type: 'tenant' | 'enduser'; // テナント向けかエンドユーザー向けか
  data: {
    companyName: string;
    companyAddress: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

const InvoiceTemplateList: React.FC = () => {
  // ステート管理
  const [templates, setTemplates] = useState<InvoiceTemplateData[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<InvoiceTemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateData | null>(null);
  
  // ナビゲーション
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // 初期データ読み込み
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // 検索・フィルター変更時
  useEffect(() => {
    filterTemplates();
  }, [searchTerm, typeFilter, templates]);
  
  // テンプレートデータ取得
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockTemplates = generateMockTemplates();
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
    } catch (error) {
      toast.error('テンプレートデータの取得に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // モックテンプレートデータ生成
  const generateMockTemplates = (): InvoiceTemplateData[] => {
    return [
      {
        id: 'template-1',
        name: '標準請求書テンプレート（テナント向け）',
        description: 'テナント向けの標準的な請求書フォーマットです。',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin',
        previewUrl: 'https://placehold.co/400x500?text=Template+1',
        isDefault: true,
        type: 'tenant',
        data: {
          companyName: 'Topaz合同会社',
          companyAddress: '東京都渋谷区渋谷1-1-1 渋谷ビル10F',
          items: [
            {
              description: 'SMSOne OEMライセンス利用料',
              quantity: 1,
              unitPrice: 50000
            },
            {
              description: 'サポート料金',
              quantity: 1,
              unitPrice: 10000
            }
          ]
        }
      },
      {
        id: 'template-2',
        name: '標準請求書テンプレート（エンドユーザー向け）',
        description: 'エンドユーザー向けの標準的な請求書フォーマットです。',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin',
        previewUrl: 'https://placehold.co/400x500?text=Template+2',
        isDefault: true,
        type: 'enduser',
        data: {
          companyName: 'Topaz合同会社',
          companyAddress: '東京都渋谷区渋谷1-1-1 渋谷ビル10F',
          items: [
            {
              description: 'SMSOne利用料金（月額）',
              quantity: 1,
              unitPrice: 10000
            },
            {
              description: 'SMS送信料（1,000通）',
              quantity: 3,
              unitPrice: 5000
            }
          ]
        }
      },
      {
        id: 'template-3',
        name: 'プレミアムテンプレート（テナント向け）',
        description: 'テナント向けのプレミアムプラン用請求書テンプレートです。',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin',
        previewUrl: 'https://placehold.co/400x500?text=Template+3',
        isDefault: false,
        type: 'tenant',
        data: {
          companyName: 'Topaz合同会社',
          companyAddress: '東京都渋谷区渋谷1-1-1 渋谷ビル10F',
          items: [
            {
              description: 'SMSOne OEMプレミアムプラン利用料',
              quantity: 1,
              unitPrice: 100000
            },
            {
              description: 'プレミアムサポート料金',
              quantity: 1,
              unitPrice: 30000
            },
            {
              description: 'カスタマイズ費用',
              quantity: 1,
              unitPrice: 20000
            }
          ]
        }
      },
      {
        id: 'template-4',
        name: 'エンタープライズテンプレート（エンドユーザー向け）',
        description: 'エンドユーザー向けのエンタープライズ用請求書テンプレートです。',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin',
        previewUrl: 'https://placehold.co/400x500?text=Template+4',
        isDefault: false,
        type: 'enduser',
        data: {
          companyName: 'Topaz合同会社',
          companyAddress: '東京都渋谷区渋谷1-1-1 渋谷ビル10F',
          items: [
            {
              description: 'SMSOneエンタープライズプラン（月額）',
              quantity: 1,
              unitPrice: 50000
            },
            {
              description: 'SMS送信料（10,000通）',
              quantity: 2,
              unitPrice: 40000
            },
            {
              description: '専用API利用料',
              quantity: 1,
              unitPrice: 30000
            }
          ]
        }
      }
    ];
  };
  
  // テンプレートフィルタリング
  const filterTemplates = () => {
    let result = [...templates];
    
    // 検索条件でフィルタリング
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(template => 
        template.name.toLowerCase().includes(lowerSearchTerm) ||
        template.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // 種類でフィルタリング
    if (typeFilter !== 'all') {
      result = result.filter(template => template.type === typeFilter);
    }
    
    setFilteredTemplates(result);
    
    // 現在のページが範囲外になった場合は1ページ目に戻す
    const totalPages = Math.ceil(result.length / itemsPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  };
  
  // テンプレート編集画面へ移動
  const handleEditTemplate = (template: InvoiceTemplateData) => {
    navigate(`/dashboard/billing/invoice/edit?id=${template.id}`);
  };
  
  // 新規テンプレート作成画面へ移動
  const handleCreateTemplate = () => {
    navigate('/dashboard/billing/invoice/edit');
  };
  
  // テンプレートプレビュー
  const handleViewTemplate = (template: InvoiceTemplateData) => {
    setSelectedTemplate(template);
  };
  
  // テンプレートコピー
  const handleCopyTemplate = async (template: InvoiceTemplateData) => {
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: InvoiceTemplateData = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (コピー)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      };
      
      setTemplates([...templates, newTemplate]);
      toast.success('テンプレートをコピーしました');
    } catch (error) {
      toast.error('テンプレートのコピーに失敗しました');
      console.error(error);
    }
  };
  
  // テンプレート削除
  const handleDeleteTemplate = async (template: InvoiceTemplateData) => {
    if (template.isDefault) {
      toast.error('デフォルトテンプレートは削除できません');
      return;
    }
    
    if (window.confirm(`「${template.name}」を削除してもよろしいですか？この操作は元に戻せません。`)) {
      try {
        // APIリクエストシミュレーション
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // 成功したらリストから削除
        setTemplates(templates.filter(t => t.id !== template.id));
        setFilteredTemplates(filteredTemplates.filter(t => t.id !== template.id));
        
        toast.success(`「${template.name}」を削除しました`);
        
        // 詳細表示中のテンプレートが削除された場合は詳細表示を閉じる
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      } catch (error) {
        toast.error('テンプレートの削除に失敗しました');
        console.error(error);
      }
    }
  };
  
  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // テンプレートタイプのラベル取得
  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'tenant': return 'テナント向け';
      case 'enduser': return 'エンドユーザー向け';
      default: return type;
    }
  };
  
  // テンプレートタイプのスタイル取得
  const getTemplateTypeClass = (type: string) => {
    switch (type) {
      case 'tenant': return 'bg-primary-100 text-primary-800';
      case 'enduser': return 'bg-success-100 text-success-800';
      default: return 'bg-grey-100 text-grey-800';
    }
  };
  
  // テンプレートプレビューモーダル
  const TemplatePreviewModal: React.FC<{ template: InvoiceTemplateData, onClose: () => void }> = ({ template, onClose }) => (
    <div className="fixed inset-0 bg-grey-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-medium">請求書テンプレートプレビュー</h2>
            <button
              onClick={onClose}
              className="text-grey-400 hover:text-grey-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-grey-500">テンプレート名</p>
                <p className="font-medium">{template.name}</p>
              </div>
              <div>
                <p className="text-sm text-grey-500">種類</p>
                <p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTemplateTypeClass(template.type)}`}>
                    {getTemplateTypeLabel(template.type)}
                  </span>
                  {template.isDefault && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-800">
                      デフォルト
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-grey-500">作成日</p>
                <p className="font-medium">{formatDate(template.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-500">最終更新日</p>
                <p className="font-medium">{formatDate(template.updatedAt)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-grey-500">説明</p>
              <p>{template.description}</p>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-grey-700 mb-2">テンプレートプレビュー</p>
              <div className="bg-grey-50 p-4 rounded-lg flex justify-center">
                <img 
                  src={template.previewUrl} 
                  alt={template.name} 
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-grey-700 mb-2">請求元情報</p>
              <div className="bg-grey-50 p-4 rounded-lg">
                <p><span className="font-medium">会社名: </span>{template.data.companyName}</p>
                <p><span className="font-medium">住所: </span>{template.data.companyAddress}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-grey-700 mb-2">デフォルト明細項目</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-grey-200">
                  <thead className="bg-grey-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-grey-500">説明</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-grey-500">数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-grey-500">単価</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-grey-500">小計</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-grey-200">
                    {template.data.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                閉じる
              </button>
              <button
                onClick={() => {
                  onClose();
                  handleEditTemplate(template);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                編集
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">請求書テンプレート</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-grey-900">テンプレート一覧</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-grey-400" />
                </div>
                <input
                  type="search"
                  placeholder="テンプレート名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-5 w-5 text-grey-700" />
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-5 w-5 text-grey-700" />
                </button>
              </div>
              
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                フィルター
              </button>
            </div>
            
            <button
              onClick={handleCreateTemplate}
              className="btn-secondary flex items-center gap-2 ml-4"
            >
              <Plus className="h-4 w-4" />
              新規作成
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select min-w-[200px]"
              >
                <option value="all">すべての種類</option>
                <option value="tenant">テナント向け</option>
                <option value="enduser">エンドユーザー向け</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-grey-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium">テンプレートが見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                {searchTerm || typeFilter !== 'all'
                  ? '検索条件に一致するテンプレートが見つかりませんでした。'
                  : 'テンプレートが存在しません。'}
              </p>
              <button
                onClick={handleCreateTemplate}
                className="mt-4 btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規テンプレート作成
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg border hover:border-primary-500 transition-colors cursor-pointer overflow-hidden"
                >
                  <div className="h-40 overflow-hidden bg-grey-50 flex items-center justify-center">
                    <img 
                      src={template.previewUrl} 
                      alt={template.name}
                      className="max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{template.name}</h3>
                        <p className="text-sm text-grey-500 mt-1 line-clamp-2">{template.description}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTemplateTypeClass(template.type)}`}>
                          {getTemplateTypeLabel(template.type)}
                        </span>
                        {template.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-800">
                            デフォルト
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-grey-500">
                        <Calendar className="h-4 w-4" />
                        <span>更新日: {formatDate(template.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 border-t flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                      className="text-primary-600 hover:text-primary-900 p-1 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template);
                      }}
                      className="text-error-600 hover:text-error-900 p-1 rounded"
                      disabled={template.isDefault}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-grey-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      テンプレート名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      種類
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      最終更新日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-200">
                  {currentItems.map((template) => (
                    <tr 
                      key={template.id} 
                      className="hover:bg-grey-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-grey-400 mr-3" />
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-grey-500 truncate max-w-xs">{template.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTemplateTypeClass(template.type)}`}>
                          {getTemplateTypeLabel(template.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {template.isDefault ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                            デフォルト
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-grey-100 text-grey-800">
                            通常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template);
                          }}
                          className="text-error-600 hover:text-error-900"
                          disabled={template.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {filteredTemplates.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-grey-500">
              全 {filteredTemplates.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTemplates.length)} 件を表示
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm px-2 py-1 disabled:opacity-50"
              >
                &lt;
              </button>
              <span className="text-sm text-grey-700">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm px-2 py-1 disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* テンプレートプレビューモーダル */}
      {selectedTemplate && (
        <TemplatePreviewModal 
          template={selectedTemplate} 
          onClose={() => setSelectedTemplate(null)} 
        />
      )}
    </motion.div>
  );
};

export default InvoiceTemplateList; 