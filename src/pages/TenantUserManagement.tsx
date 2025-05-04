import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  Plus, Edit, Trash2, Clock, Calendar, Check, X, Users, 
  Grid, List, ArrowLeft 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import MessagingSettings from '../components/settings/MessagingSettings';
import { UserRole } from '../types/tenant';
import useAuthStore from '../store/authStore';
import { 
  MockUserData, 
  MockActivityData, 
  MockContractData,
  generateMockUsers,
  generateMockActivityLogs,
  generateMockContracts
} from '../data/mockData/tenantUsersMock';
import {
  roleDisplayNames,
  formatDate,
  formatDateOnly,
  formatCurrency
} from '../data/mockData/constants';

// MessagingSettingsコンポーネントのProps型を定義
interface MessagingSettingsProps {
  userId?: string;
}

// MessagingSettingsコンポーネントを修正してuserIdをオプショナルに対応
const UserMessagingSettings: React.FC<MessagingSettingsProps> = ({ userId }) => {
  // 仮の実装 - 実際のコンポーネントに置き換える
  return (
    <div>
      <p>利用者ID: {userId || '未指定'}</p>
      {/* 実際の送信者名設定コンポーネントの内容を表示 */}
    </div>
  );
};

const TenantUserManagement: React.FC = () => {
  // 利用者リスト状態
  const [users, setUsers] = useState<MockUserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MockUserData[]>([]);
  const [activityLogs, setActivityLogs] = useState<MockActivityData[]>([]);
  const [contracts, setContracts] = useState<MockContractData[]>([]);
  
  // UI状態
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<MockUserData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUserData | null>(null);
  const [sortField, setSortField] = useState<string>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTab, setSelectedTab] = useState<'info' | 'activity' | 'contract'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // デフォルト表示をグリッドに変更
  
  // 認証情報を取得
  const { user, tenantContext, clearTenantContext } = useAuthStore();
  
  // 利用者編集用フォーム状態
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    company: '', // 会社名
    postalCode: '', // 郵便番号
    phoneNumber: '', // 電話番号
    address: '', // 住所
    monthlyFee: 0, // 月額基本料金
    domesticSmsPrice: 3.3, // 国内SMS送信単価（デフォルト値）
    internationalSmsPrice: 10, // 海外SMS送信単価（デフォルト値）
    permissions: {
      internationalSms: false,
      templateEditing: false,
      bulkSending: false,
      apiAccess: false,
      scheduledSending: false,
      analyticsAccess: false,
      surveysCreation: false // アンケート作成権限を追加
    },
    password: '',
    confirmPassword: ''
  });
  
  // 初期フォームデータ
  const initialFormData = {
    username: '',
    email: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    company: '',
    postalCode: '',
    phoneNumber: '',
    address: '',
    monthlyFee: 0,
    domesticSmsPrice: 3.3,
    internationalSmsPrice: 10,
    permissions: {
      internationalSms: false,
      templateEditing: false,
      bulkSending: false,
      apiAccess: false,
      scheduledSending: false,
      analyticsAccess: false,
      surveysCreation: false
    },
    password: '',
    confirmPassword: ''
  };
  
  // 検証エラー状態
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // ナビゲーション用hook
  const navigate = useNavigate();
  
  // メッセージ設定モーダル用の状態
  const [showMessageSettings, setShowMessageSettings] = useState(false);
  const [selectedUserForSettings, setSelectedUserForSettings] = useState<MockUserData | null>(null);
  
  // 初回データ取得
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // コンテキスト終了処理
  const handleExitTenantContext = () => {
    clearTenantContext();
    navigate('/dashboard/system/tenants');
  };
  
  // 検索条件変更時のフィルタリング
  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, sortField, sortDirection, statusFilter]);
  
  // 利用者データ取得
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // モックデータ取得（APIリクエストのシミュレーション）
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockUsers = generateMockUsers();
      const mockActivityLogs = generateMockActivityLogs(mockUsers);
      const mockContracts = generateMockContracts(mockUsers);
      
      setUsers(mockUsers);
      setActivityLogs(mockActivityLogs);
      setContracts(mockContracts);
      setFilteredUsers(mockUsers);
    } catch (error) {
      toast.error('利用者データの取得に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 利用者フィルタリング
  const filterUsers = () => {
    let result = [...users];
    
    // テナントコンテキストがある場合は、そのテナントに属するサービス利用者のみ表示
    if (tenantContext) {
      // テナント管理者として操作している場合、そのテナントに属するサービス利用者のみ表示
      result = result.filter(user => 
        (user.role === UserRole.OPERATION_ADMIN || user.role === UserRole.OPERATION_USER) && 
        user.tenant_id === tenantContext.tenantId
      );
    } else if (user && user.role === 'SYSTEM_ADMIN') {
      // システム管理者の場合、全ての利用者を表示可能
      // 何もフィルタリングしない
    } else {
      // それ以外のロールで、かつテナントコンテキストがない場合は利用者データを空にする
      result = [];
    }
    
    // 検索条件でフィルタリング
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(lowerSearchTerm) ||
        user.email.toLowerCase().includes(lowerSearchTerm) ||
        user.id.toLowerCase().includes(lowerSearchTerm) ||
        roleDisplayNames[user.role].toLowerCase().includes(lowerSearchTerm)
      );
    }

    // ステータスでフィルタリング
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    // ソート
    result = result.sort((a, b) => {
      const fieldA = a[sortField as keyof MockUserData];
      const fieldB = b[sortField as keyof MockUserData];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      return 0;
    });
    
    setFilteredUsers(result);
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
  
  // 特定利用者のアクティビティログを取得
  const getUserActivityLogs = (userId: string): MockActivityData[] => {
    return activityLogs.filter(log => log.userId === userId).slice(0, 20);
  };
  
  // 利用者契約情報取得
  const getUserContract = (userId: string): MockContractData | undefined => {
    return contracts.find(contract => contract.userId === userId);
  };

  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // 利用者詳細表示
  const handleViewUser = (user: MockUserData) => {
    setSelectedUser(user);
    setSelectedTab('info');
  };
  
  // 利用者編集モーダル表示
  const handleEditUser = (user: MockUserData) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      status: user.status,
      company: user.company,
      postalCode: user.postalCode,
      phoneNumber: user.phoneNumber,
      address: user.address,
      monthlyFee: user.monthlyFee || 0,
      domesticSmsPrice: user.domesticSmsPrice || 3.3,
      internationalSmsPrice: user.internationalSmsPrice || 10,
      permissions: { 
        internationalSms: user.permissions.internationalSms,
        templateEditing: user.permissions.templateEditing,
        bulkSending: user.permissions.bulkSending,
        apiAccess: user.permissions.apiAccess,
        scheduledSending: user.permissions.scheduledSending,
        analyticsAccess: user.permissions.analyticsAccess,
        surveysCreation: user.permissions.surveysCreation
      },
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };
  
  // 新規利用者作成モーダル表示
  const handleShowCreateModal = () => {
    setFormData({
      username: '',
      email: '',
      status: 'active',
      company: '',
      postalCode: '',
      phoneNumber: '',
      address: '',
      monthlyFee: 0,
      domesticSmsPrice: 3.3,
      internationalSmsPrice: 10,
      permissions: {
        internationalSms: false,
        templateEditing: true,
        bulkSending: false,
        apiAccess: false,
        scheduledSending: true,
        analyticsAccess: true,
        surveysCreation: false // アンケート作成権限を追加
      },
      password: '',
      confirmPassword: ''
    });
    setValidationErrors({});
    setShowCreateModal(true);
  };
  
  // 利用者削除
  const handleDeleteUser = async (user: MockUserData) => {
    if (window.confirm(`「${user.username}」を削除してもよろしいですか？この操作は元に戻せません。`)) { // 確認メッセージをテナント管理と統一
      try {
        // 削除API呼び出しシミュレーション
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 成功したらリストから削除
        setUsers(users.filter(u => u.id !== user.id));
        toast.success(`「${user.username}」を削除しました`);
        
        // 詳細表示中の利用者が削除された場合は詳細表示を閉じる
        if (selectedUser?.id === user.id) {
          setSelectedUser(null);
        }
      } catch (error) {
        toast.error('利用者の削除に失敗しました');
      }
    }
  };
  
  // 利用者ステータス切り替え
  const handleToggleStatus = async (user: MockUserData) => {
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ステータス切替
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const updatedUser = { ...user, status: newStatus as 'active' | 'inactive' | 'pending' };
      
      // 利用者リスト更新
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      
      // 詳細表示中の利用者も更新
      if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUser);
      }
      
      toast.success(`「${user.username}」を${newStatus === 'active' ? '有効' : '無効'}にしました`);
    } catch (error) {
      toast.error('ステータス変更に失敗しました');
    }
  };
  
  // フォーム入力ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // 権限チェックボックスハンドラ
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [name]: checked
      }
    });
  };
  
  // ステータス変更ハンドラ（専用のトグルボタン用）
  const handleStatusChange = (status: 'active' | 'inactive' | 'pending') => {
    setFormData({
      ...formData,
      status
    });
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showCreateModal) {
      handleCreateUser(e);
    } else if (showEditModal) {
      handleUpdateUser(e);
    }
  };
  
  // 利用者作成フォーム用のresetForm関数を追加
  const resetForm = () => {
    setFormData(initialFormData);
    setValidationErrors({});
  };
  
  // validateForm関数を修正して常にエラーオブジェクトを返すようにする
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = '利用者名は必須です';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    // 新規作成時のみパスワード検証
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'パスワードは必須です';
      } else if (formData.password.length < 8) {
        errors.password = 'パスワードは8文字以上である必要があります';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'パスワードが一致しません';
      }
    }
    
    return errors;
  };
  
  // 新規利用者作成
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // フォーム検証
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // モックAPIリクエスト（実際の実装では適切なAPIコールに置き換え）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // テナントIDの設定
      const newTenantId = tenantContext ? tenantContext.tenantId : 'sample-company';
      
      const newUser: MockUserData = {
        id: `user-${Date.now()}`,
        username: formData.username,
        email: formData.email,
        role: UserRole.OPERATION_USER,
        status: formData.status,
        tenant_id: newTenantId, // テナントコンテキストによって決定されるテナントID
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        company: formData.company,
        postalCode: formData.postalCode,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        monthlyFee: formData.monthlyFee,
        domesticSmsPrice: formData.domesticSmsPrice,
        internationalSmsPrice: formData.internationalSmsPrice,
        permissions: {
          ...formData.permissions,
          userManagement: false
        }
      };
      
      // 利用者リストに追加
      setUsers([...users, newUser]);
      
      // モーダルを閉じる
      setShowCreateModal(false);
      
      // フォームをリセット
      resetForm();
      
      // 成功メッセージ
      toast.success('利用者が作成されました');
    } catch (error) {
      toast.error('利用者の作成に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 利用者更新
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    if (!editingUser) return;
    
    setIsSubmitting(true);
    
    try {
      // 更新API呼び出しシミュレーション
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 利用者情報更新
      const updatedUser: MockUserData = {
        ...editingUser,
        username: formData.username,
        email: formData.email,
        status: formData.status,
        company: formData.company,
        postalCode: formData.postalCode,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        monthlyFee: formData.monthlyFee,
        domesticSmsPrice: formData.domesticSmsPrice,
        internationalSmsPrice: formData.internationalSmsPrice,
        permissions: { 
          ...formData.permissions,
          userManagement: editingUser.permissions.userManagement
        }
      };
      
      // 利用者一覧を更新
      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      
      // 詳細表示中の利用者が更新された場合は詳細表示も更新
      if (selectedUser?.id === editingUser.id) {
        setSelectedUser(updatedUser);
      }
      
      // モーダルを閉じる
      setShowEditModal(false);
      toast.success('利用者情報を更新しました');
    } catch (error) {
      toast.error('利用者更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-grey-900">テナント利用者管理</h1>
        
        {/* テナントコンテキスト表示 */}
        {tenantContext && (
          <div className="flex items-center">
            <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg flex items-center mr-2">
              <span className="text-sm font-medium">テナント：{tenantContext.tenantName}</span>
            </div>
            <button
              onClick={handleExitTenantContext}
              className="btn-secondary flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              テナント一覧に戻る
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-grey-200">
          <h2 className="text-lg font-medium text-grey-900 mb-4">利用者一覧</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-grey-400" />
                </div>
                <input
                  type="search"
                  placeholder="利用者名、メールアドレスなどで検索..."
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
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select min-w-[160px]"
              >
                <option value="all">すべてのステータス</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
                <option value="pending">保留</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-grey-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium">利用者が見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                {searchTerm || statusFilter !== 'all'
                  ? '検索条件に一致する利用者が見つかりませんでした。'
                  : '利用者が存在しません。'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg border hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => handleViewUser(user)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{user.username}</h3>
                        <p className="text-sm text-grey-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-grey-100 text-grey-800'
                      }`}>
                        {user.status === 'active' ? '有効' : '無効'}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-grey-500">
                        <User className="h-4 w-4" />
                        <span>{roleDisplayNames[user.role]}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-grey-500">
                        <Calendar className="h-4 w-4" />
                        <span>最終ログイン: {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : '未ログイン'}</span>
                      </div>
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
                      利用者名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ロール
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      最終ログイン
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
                  {currentItems.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-grey-50 cursor-pointer"
                      onClick={() => handleViewUser(user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-grey-900">{user.username}</p>
                          <p className="text-xs text-grey-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {roleDisplayNames[user.role]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : '未ログイン'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-grey-100 text-grey-800'
                        }`}>
                          {user.status === 'active' ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user);
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

        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-grey-500">
              全 {filteredUsers.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} 件を表示
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-grey-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 利用者作成/編集モーダル */}
      {(showCreateModal || showEditModal) && (
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
                  {showCreateModal ? '新規利用者作成' : '利用者編集'}
                </h3>
                <button
                  type="button"
                  className="text-grey-400 hover:text-grey-500"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData(initialFormData);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      利用者名 <span className="text-error-600 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                    />
                    {validationErrors.username && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      メールアドレス <span className="text-error-600 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      パスワード{!editingUser && <span className="text-error-600 ml-1">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required={!editingUser}
                    />
                    {validationErrors.password && (
                      <p className="mt-1 text-xs text-error-600">{validationErrors.password}</p>
                    )}
                    {editingUser && (
                      <p className="mt-1 text-xs text-grey-500">
                        空欄の場合はパスワードを変更しません
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      会社名
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="form-input w-full"
                    />
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input w-full"
                    />
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      住所
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">アクセス権限</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="internationalSms"
                        name="internationalSms"
                        checked={formData.permissions.internationalSms}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="internationalSms" className="ml-2 text-sm text-grey-700">
                        海外SMS送信
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="templateEditing"
                        name="templateEditing"
                        checked={formData.permissions.templateEditing}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="templateEditing" className="ml-2 text-sm text-grey-700">
                        テンプレート編集
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="bulkSending"
                        name="bulkSending"
                        checked={formData.permissions.bulkSending}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="bulkSending" className="ml-2 text-sm text-grey-700">
                        一括送信
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="scheduledSending"
                        name="scheduledSending"
                        checked={formData.permissions.scheduledSending}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="scheduledSending" className="ml-2 text-sm text-grey-700">
                        予約送信
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="analyticsAccess"
                        name="analyticsAccess"
                        checked={formData.permissions.analyticsAccess}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="analyticsAccess" className="ml-2 text-sm text-grey-700">
                        分析レポート閲覧
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="surveysCreation"
                        name="surveysCreation"
                        checked={formData.permissions.surveysCreation}
                        onChange={handlePermissionChange}
                        className="form-checkbox rounded h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="surveysCreation" className="ml-2 text-sm text-grey-700">
                        アンケート作成
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-start border-t pt-6">
                  <span className="text-sm font-medium text-grey-700 mr-4">ステータス</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('active')}
                      className={`btn-sm ${
                        formData.status === 'active' ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      有効
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('inactive')}
                      className={`btn-sm ${
                        formData.status === 'inactive' ? 'btn-error' : 'btn-secondary'
                      }`}
                    >
                      無効
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('pending')}
                      className={`btn-sm ${
                        formData.status === 'pending' ? 'btn-warning' : 'btn-secondary'
                      }`}
                    >
                      保留中
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => showCreateModal ? setShowCreateModal(false) : setShowEditModal(false)}
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

      {/* 利用者詳細モーダル */}
      {selectedUser && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-medium">利用者詳細</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-grey-400 hover:text-grey-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">利用者名</p>
                    <p className="font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">ステータス</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedUser.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-grey-100 text-grey-800'
                    }`}>
                      {selectedUser.status === 'active' ? '有効' : '無効'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">メールアドレス</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">ロール</p>
                    <p>{roleDisplayNames[selectedUser.role]}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">郵便番号</p>
                    <p>{selectedUser.postalCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">電話番号</p>
                    <p>{selectedUser.phoneNumber}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-grey-500 mb-1">住所</p>
                    <p>{selectedUser.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">月額基本料金</p>
                    <p>{selectedUser.monthlyFee ? formatCurrency(selectedUser.monthlyFee) : '0円'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">国内SMS送信単価</p>
                    <p>{selectedUser.domesticSmsPrice ? formatCurrency(selectedUser.domesticSmsPrice) : '0円'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-grey-500 mb-1">海外SMS送信単価</p>
                    <p>{selectedUser.internationalSmsPrice ? formatCurrency(selectedUser.internationalSmsPrice) : '0円'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">権限設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(selectedUser.permissions).map(([key, value]) => {
                      // userManagementとapiAccessは表示しない
                      if (key === 'userManagement' || key === 'apiAccess') return null;
                      
                      // 権限名を日本語表示に変換
                      const permissionLabels: Record<string, string> = {
                        internationalSms: '海外SMS送信',
                        templateEditing: 'テンプレート編集',
                        bulkSending: '一括送信',
                        scheduledSending: '予約送信',
                        analyticsAccess: '分析レポート閲覧',
                        surveysCreation: 'アンケート作成'
                      };
                      
                      return (
                        <div key={key} className="flex items-center">
                          <div className={`w-4 h-4 rounded ${value ? 'bg-blue-600' : 'bg-grey-200'}`}>
                            {value && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <span className="ml-2 text-sm">{permissionLabels[key] || key}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedUser(null)}
                  >
                    閉じる
                  </button>
                  
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSelectedUser(null);
                      handleEditUser(selectedUser);
                    }}
                  >
                    編集
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TenantUserManagement; 