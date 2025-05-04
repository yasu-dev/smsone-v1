import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, Users, 
  Building, Globe, ChevronDown, ChevronUp, Check, X,
  Calendar, Clock, MoreVertical, Palette, Grid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  contactEmail: string;
  postalCode: string;
  phoneNumber: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  userCount: number;
  createdAt: string;
  contractEndDate: string;
  monthlyFee: number;
  domesticSmsPrice: number;
  internationalSmsPrice: number;
}

const TenantManagement: React.FC = () => {
  // ステート管理
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    primaryColor: '#3B82F6', // デフォルトカラー
    secondaryColor: '#10B981',
    contactEmail: '',
    postalCode: '', // 追加：郵便番号
    phoneNumber: '', // 追加：電話番号
    address: '', // 追加：住所
    monthlyFee: 0, // 追加：月額基本料金
    domesticSmsPrice: 3.3, // 追加：国内SMS送信単価（デフォルト値）
    internationalSmsPrice: 10, // 追加：海外SMS送信単価（デフォルト値）
    status: 'active' as 'active' | 'inactive' | 'pending'
  });
  
  // 検証エラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ユーザー情報とナビゲーション
  const { user, setTenantContext } = useAuthStore();
  const navigate = useNavigate();
  
  // 初期データ読み込み
  useEffect(() => {
    fetchTenants();
  }, []);
  
  // 検索・フィルター変更時
  useEffect(() => {
    filterTenants();
  }, [searchTerm, statusFilter, tenants, sortField, sortDirection]);
  
  // テナントデータ取得
  const fetchTenants = async () => {
    setIsLoading(true);
    
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // モックデータ
      const mockData: TenantData[] = [
        {
          id: 'tenant-1',
          name: 'サンプル株式会社',
          domain: 'sample.co.jp',
          subdomain: 'sample',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          logoUrl: 'https://placehold.co/200x80?text=サンプル株式会社',
          contactEmail: 'contact@sample.co.jp',
          postalCode: '100-0001',
          phoneNumber: '03-1234-5678',
          address: '東京都千代田区千代田1-1-1',
          status: 'active',
          userCount: 25,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          contractEndDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyFee: 5000,
          domesticSmsPrice: 3.3,
          internationalSmsPrice: 10
        },
        {
          id: 'tenant-2',
          name: 'テスト企業',
          domain: 'test-corp.jp',
          subdomain: 'testcorp',
          primaryColor: '#8B5CF6',
          secondaryColor: '#EC4899',
          logoUrl: 'https://placehold.co/200x80?text=テスト企業',
          contactEmail: 'info@test-corp.jp',
          postalCode: '160-0022',
          phoneNumber: '03-9876-5432',
          address: '東京都新宿区新宿3-3-3',
          status: 'active',
          userCount: 12,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          contractEndDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyFee: 3000,
          domesticSmsPrice: 3.0,
          internationalSmsPrice: 9.5
        },
        {
          id: 'tenant-3',
          name: '株式会社エグザンプル',
          domain: 'example.com',
          subdomain: 'example',
          primaryColor: '#F59E0B',
          secondaryColor: '#06B6D4',
          logoUrl: 'https://placehold.co/200x80?text=株式会社エグザンプル',
          contactEmail: 'mail@example.com',
          postalCode: '150-0043',
          phoneNumber: '03-5555-5555',
          address: '東京都渋谷区道玄坂1-1-1',
          status: 'inactive',
          userCount: 5,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          contractEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyFee: 10000,
          domesticSmsPrice: 3.5,
          internationalSmsPrice: 12
        },
        {
          id: 'tenant-4',
          name: 'スタートアップ',
          domain: 'startup.io',
          subdomain: 'startup',
          primaryColor: '#10B981',
          secondaryColor: '#3B82F6',
          logoUrl: 'https://placehold.co/200x80?text=スタートアップ',
          contactEmail: 'hello@startup.io',
          postalCode: '220-0012',
          phoneNumber: '045-123-4567',
          address: '神奈川県横浜市西区みなとみらい2-2-2',
          status: 'pending',
          userCount: 0,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          contractEndDate: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyFee: 2000,
          domesticSmsPrice: 2.8,
          internationalSmsPrice: 8
        }
      ];
      
      setTenants(mockData);
      setFilteredTenants(mockData);
    } catch (error) {
      console.error('テナントデータの取得に失敗しました', error);
      toast.error('テナントデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // テナントフィルタリング
  const filterTenants = () => {
    let result = [...tenants];
    
    // 検索条件でフィルタリング
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(tenant => 
        tenant.name.toLowerCase().includes(lowerSearchTerm) ||
        tenant.domain.toLowerCase().includes(lowerSearchTerm) ||
        tenant.contactEmail.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // ステータスでフィルタリング
    if (statusFilter !== 'all') {
      result = result.filter(tenant => tenant.status === statusFilter);
    }
    
    // ソート
    result = result.sort((a, b) => {
      const fieldA = a[sortField as keyof TenantData];
      const fieldB = b[sortField as keyof TenantData];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc'
          ? fieldA - fieldB
          : fieldB - fieldA;
      }
      
      return 0;
    });
    
    setFilteredTenants(result);
  };
  
  // ソートフィールド変更
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // 新規テナント作成モーダル表示
  const handleShowCreateModal = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      domain: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      contactEmail: '',
      postalCode: '',
      phoneNumber: '',
      address: '',
      monthlyFee: 0,
      domesticSmsPrice: 3.3,
      internationalSmsPrice: 10,
      status: 'active'
    });
    setValidationErrors({});
    setShowModal(true);
  };
  
  // テナント編集モーダル表示
  const handleEditTenant = (tenant: TenantData) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      contactEmail: tenant.contactEmail,
      postalCode: tenant.postalCode,
      phoneNumber: tenant.phoneNumber,
      address: tenant.address,
      monthlyFee: tenant.monthlyFee || 0,
      domesticSmsPrice: tenant.domesticSmsPrice || 3.3,
      internationalSmsPrice: tenant.internationalSmsPrice || 10,
      status: tenant.status
    });
    setValidationErrors({});
    setShowModal(true);
  };
  
  // テナント削除
  const handleDeleteTenant = async (tenant: TenantData) => {
    if (window.confirm(`「${tenant.name}」を削除してもよろしいですか？この操作は元に戻せません。`)) {
      try {
        // APIリクエストシミュレーション
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // 成功したらリストから削除
        setTenants(tenants.filter(t => t.id !== tenant.id));
        setFilteredTenants(filteredTenants.filter(t => t.id !== tenant.id));
        
        toast.success(`「${tenant.name}」を削除しました`);
        
        // 詳細表示中のテナントが削除された場合は詳細表示を閉じる
        if (selectedTenant?.id === tenant.id) {
          setSelectedTenant(null);
        }
      } catch (error) {
        toast.error('テナントの削除に失敗しました');
        console.error(error);
      }
    }
  };
  
  // ステータス切り替え
  const handleToggleStatus = async (tenant: TenantData) => {
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
      const updatedTenant = { ...tenant, status: newStatus as 'active' | 'inactive' | 'pending' };
      
      // テナントリスト更新
      setTenants(tenants.map(t => t.id === tenant.id ? updatedTenant : t));
      setFilteredTenants(filteredTenants.map(t => t.id === tenant.id ? updatedTenant : t));
      
      // 詳細表示中のテナントも更新
      if (selectedTenant?.id === tenant.id) {
        setSelectedTenant(updatedTenant);
      }
      
      toast.success(`「${tenant.name}」を${newStatus === 'active' ? '有効' : '無効'}にしました`);
    } catch (error) {
      toast.error('ステータスの変更に失敗しました');
      console.error(error);
    }
  };
  
  // フォーム入力ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // フォーム検証
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'テナント名は必須です';
    }
    
    if (!formData.domain.trim()) {
      errors.domain = 'ドメインは必須です';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(formData.domain)) {
      errors.domain = '有効なドメイン形式で入力してください';
    }
    
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = '連絡先メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = '有効なメールアドレス形式で入力してください';
    }
    
    return errors;
  };
  
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // フォーム検証
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingTenant) {
        // 更新処理
        const updatedTenant: TenantData = {
          ...editingTenant,
          name: formData.name,
          domain: formData.domain,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          contactEmail: formData.contactEmail,
          postalCode: formData.postalCode,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          monthlyFee: formData.monthlyFee,
          domesticSmsPrice: formData.domesticSmsPrice,
          internationalSmsPrice: formData.internationalSmsPrice,
          status: formData.status
        };
        
        // テナントリスト更新
        setTenants(tenants.map(t => t.id === editingTenant.id ? updatedTenant : t));
        
        toast.success(`「${formData.name}」を更新しました`);
      } else {
        // 新規作成処理
        const newTenant: TenantData = {
          id: `tenant-${Date.now()}`,
          name: formData.name,
          domain: formData.domain,
          subdomain: formData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: `https://placehold.co/200x80?text=${encodeURIComponent(formData.name)}`,
          contactEmail: formData.contactEmail,
          postalCode: formData.postalCode,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          monthlyFee: formData.monthlyFee,
          domesticSmsPrice: formData.domesticSmsPrice,
          internationalSmsPrice: formData.internationalSmsPrice,
          status: formData.status,
          userCount: 0,
          createdAt: new Date().toISOString(),
          contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        // テナントリストに追加
        setTenants([...tenants, newTenant]);
        
        toast.success(`「${formData.name}」を作成しました`);
      }
      
      // モーダルを閉じる
      setShowModal(false);
      setEditingTenant(null);
    } catch (error) {
      toast.error(editingTenant ? 'テナントの更新に失敗しました' : 'テナントの作成に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTenants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // ステータスラベル
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '有効';
      case 'inactive': return '無効';
      case 'pending': return '保留中';
      default: return status;
    }
  };
  
  // ステータスバッジのスタイル
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800';
      case 'inactive': return 'bg-error-100 text-error-800';
      case 'pending': return 'bg-warning-100 text-warning-800';
      default: return 'bg-grey-100 text-grey-800';
    }
  };
  
  // テナント詳細表示
  const handleViewTenant = (tenant: TenantData) => {
    setSelectedTenant(tenant);
  };

  // テナントのユーザー管理画面に遷移
  const handleManageUsers = (tenant: TenantData) => {
    // テナントコンテキストを設定
    setTenantContext(tenant.id);
    // ユーザー管理画面に遷移
    navigate('/dashboard/tenant-users');
    // モーダルを閉じる
    setSelectedTenant(null);
  };

  // テナント詳細表示コンポーネント
  const TenantDetailModal: React.FC<{ tenant: TenantData, onClose: () => void }> = ({ tenant, onClose }) => (
    <div className="fixed inset-0 bg-grey-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-medium">テナント詳細</h2>
            <button
              onClick={onClose}
              className="text-grey-400 hover:text-grey-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">テナント名</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">ステータス</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(tenant.status)}`}>
                  {getStatusLabel(tenant.status)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">連絡先メールアドレス</p>
                <p>{tenant.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">ドメイン</p>
                <p>{tenant.domain}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">郵便番号</p>
                <p>{tenant.postalCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">電話番号</p>
                <p>{tenant.phoneNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-grey-500 mb-1">住所</p>
                <p>{tenant.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">月額基本料金</p>
                <p>{Math.floor(tenant.monthlyFee || 0).toLocaleString()}円</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">国内SMS送信単価</p>
                <p>{Math.floor(tenant.domesticSmsPrice || 0).toLocaleString()}円</p>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-500 mb-1">海外SMS送信単価</p>
                <p>{Math.floor(tenant.internationalSmsPrice || 0).toLocaleString()}円</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-4">ブランドカラー</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-grey-500 mb-1">プライマリ</p>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded mr-2" 
                      style={{ backgroundColor: tenant.primaryColor }}
                    ></div>
                    <span className="font-mono">{tenant.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-grey-500 mb-1">セカンダリ</p>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded mr-2" 
                      style={{ backgroundColor: tenant.secondaryColor }}
                    ></div>
                    <span className="font-mono">{tenant.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                className="btn-secondary"
                onClick={onClose}
              >
                閉じる
              </button>
              
              {/* ユーザー管理ボタンを追加 */}
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => handleManageUsers(tenant)}
              >
                <Users className="h-4 w-4" />
                利用者管理
              </button>
              
              <button
                className="btn-primary"
                onClick={() => {
                  onClose();
                  handleEditTenant(tenant);
                }}
              >
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
      <h1 className="text-2xl font-bold text-grey-900 mb-6">テナント管理</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-grey-900">テナント一覧</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-grey-400" />
                </div>
                <input
                  type="search"
                  placeholder="テナント名、ドメインで検索..."
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
              onClick={handleShowCreateModal}
              className="btn-secondary flex items-center gap-2 ml-4"
            >
              <Plus className="h-4 w-4" />
              新規作成
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select min-w-[160px]"
              >
                <option value="all">すべてのステータス</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
                <option value="pending">保留中</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-16">
              <Building className="h-12 w-12 text-grey-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium">テナントが見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                {searchTerm || statusFilter !== 'all'
                  ? '検索条件に一致するテナントが見つかりませんでした。'
                  : 'テナントが存在しません。'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((tenant) => (
                <div
                  key={tenant.id}
                  className="bg-white rounded-lg border hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => handleViewTenant(tenant)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{tenant.name}</h3>
                        <p className="text-sm text-grey-500">{tenant.domain}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getStatusBadgeClass(tenant.status)
                      }`}>
                        {getStatusLabel(tenant.status)}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-grey-500">
                        <Globe className="h-4 w-4" />
                        <span>{tenant.subdomain}.smsone.jp</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-grey-500">
                        <Users className="h-4 w-4" />
                        <span>ユーザー数: {tenant.userCount}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-grey-500">
                        <Calendar className="h-4 w-4" />
                        <span>契約終了: {formatDate(tenant.contractEndDate)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: tenant.primaryColor }}
                        title="プライマリカラー"
                      ></div>
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: tenant.secondaryColor }}
                        title="セカンダリカラー"
                      ></div>
                    </div>
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
                      テナント名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ドメイン / サブドメイン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ユーザー数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      契約終了日
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
                  {currentItems.map((tenant) => (
                    <tr 
                      key={tenant.id} 
                      className="hover:bg-grey-50 cursor-pointer"
                      onClick={() => handleViewTenant(tenant)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: tenant.primaryColor }}
                          ></div>
                          <span className="font-medium">{tenant.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-grey-900">{tenant.domain}</p>
                          <p className="text-xs text-grey-500">{tenant.subdomain}.smsone.jp</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {tenant.userCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {formatDate(tenant.contractEndDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusBadgeClass(tenant.status)
                        }`}>
                          {getStatusLabel(tenant.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTenant(tenant);
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTenant(tenant);
                          }}
                          className="text-error-600 hover:text-error-900"
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
        
        {filteredTenants.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-grey-500">
              全 {filteredTenants.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTenants.length)} 件を表示
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
      
      {/* テナント作成・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">
                  {editingTenant ? 'テナント編集' : '新規テナント作成'}
                </h3>
                <button
                  type="button"
                  className="text-grey-400 hover:text-grey-500"
                  onClick={() => setShowModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      テナント名 <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      連絡先メールアドレス <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                    />
                    {validationErrors.contactEmail && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.contactEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      郵便番号
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="例: 285-0858"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="例: 043-330-7050"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      住所
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      rows={3}
                      placeholder="例: 千葉県佐倉市ユーカリが丘4-1-1 3F"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      ドメイン <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="domain"
                      value={formData.domain}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                      placeholder="example.co.jp"
                    />
                    {validationErrors.domain && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.domain}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      ステータス
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-select w-full"
                    >
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                      <option value="pending">保留中</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      月額基本料金（円）
                    </label>
                    <input
                      type="number"
                      name="monthlyFee"
                      value={formData.monthlyFee}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      国内SMS送信単価（円）
                    </label>
                    <input
                      type="number"
                      name="domesticSmsPrice"
                      value={formData.domesticSmsPrice}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      海外SMS送信単価（円）
                    </label>
                    <input
                      type="number"
                      name="internationalSmsPrice"
                      value={formData.internationalSmsPrice}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">ブランドカラー設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-grey-700 mb-2">
                        プライマリカラー
                      </label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleInputChange}
                          className="rounded border border-grey-300 h-10 w-10 mr-2"
                        />
                        <input
                          type="text"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleInputChange}
                          className="form-input w-full"
                          pattern="^#([A-Fa-f0-9]{6})$"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-grey-700 mb-2">
                        セカンダリカラー
                      </label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleInputChange}
                          className="rounded border border-grey-300 h-10 w-10 mr-2"
                        />
                        <input
                          type="text"
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleInputChange}
                          className="form-input w-full"
                          pattern="^#([A-Fa-f0-9]{6})$"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* テナント詳細モーダル */}
      {selectedTenant && (
        <TenantDetailModal 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
        />
      )}
    </motion.div>
  );
};

export default TenantManagement; 