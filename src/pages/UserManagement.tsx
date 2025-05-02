import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Edit, Trash2, RefreshCw, Shield, Clock, Calendar, Info, Activity, Check, X, Download, FileText, MessageSquare, MoreVertical, Users, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import MessagingSettings from '../components/settings/MessagingSettings';
import { UserRole } from '../types/tenant'; // インポート元を修正

interface UserData {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt: string;
  createdAt: string;
  company: string; // 会社名を追加
  postalCode: string; // 郵便番号を追加
  phoneNumber: string; // 電話番号を追加
  address: string; // 住所を追加
  permissions: {
    internationalSms: boolean;
    templateEditing: boolean;
    bulkSending: boolean;
    apiAccess: boolean;
    scheduledSending: boolean;
    analyticsAccess: boolean;
    userManagement: boolean;
    surveysCreation: boolean; // アンケート作成権限を追加
  };
}

interface UserActivityData {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

interface UserContractData {
  id: string;
  userId: string;
  planName: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
  updatedAt: string;
}

// ロール表示名マッピング
const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: 'システム管理者 (Topaz合同会社のSMSOne)',
  [UserRole.TENANT_ADMIN]: 'テナント管理者 (サンプル株式会社のSMSService)',
  [UserRole.OPERATION_ADMIN]: 'サービス利用者',
  [UserRole.OPERATION_USER]: 'サービス利用者'
};

// MessagingSettingsコンポーネントのProps型を定義
interface MessagingSettingsProps {
  userId?: string;
}

// MessagingSettingsコンポーネントを修正してuserIdをオプショナルに対応
const UserMessagingSettings: React.FC<MessagingSettingsProps> = ({ userId }) => {
  // 仮の実装 - 実際のコンポーネントに置き換える
  return (
    <div>
      <p>ユーザーID: {userId || '未指定'}</p>
      {/* 実際の送信者名設定コンポーネントの内容を表示 */}
    </div>
  );
};

const UserManagement: React.FC = () => {
  // ユーザーリスト状態
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityData[]>([]);
  const [contracts, setContracts] = useState<UserContractData[]>([]);
  
  // UI状態
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [sortField, setSortField] = useState<string>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTab, setSelectedTab] = useState<'info' | 'activity' | 'contract'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // ユーザー編集用フォーム状態
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    company: '', // 会社名
    postalCode: '', // 郵便番号
    phoneNumber: '', // 電話番号
    address: '', // 住所
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
  const [selectedUserForSettings, setSelectedUserForSettings] = useState<UserData | null>(null);
  
  // 初回データ取得
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // 検索条件変更時のフィルタリング
  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, sortField, sortDirection, roleFilter, statusFilter]);
  
  // ユーザーデータ取得
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
      toast.error('ユーザーデータの取得に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // モックユーザーデータ生成
  const generateMockUsers = (): UserData[] => {
    return [
      // システム管理者
      {
        id: 'system-1',
        username: 'admin',
        email: 'admin@system.com',
        role: UserRole.SYSTEM_ADMIN,
        status: 'active',
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'Topaz合同会社',
        postalCode: '100-0001',
        phoneNumber: '03-1234-5678',
        address: '東京都千代田区',
        permissions: {
          internationalSms: true,
          templateEditing: true,
          bulkSending: true,
          apiAccess: true,
          scheduledSending: true,
          analyticsAccess: true,
          userManagement: true,
          surveysCreation: true
        }
      },
      // テナント管理者
      {
        id: 'tenant-1',
        username: 'sample-oem-admin',
        email: 'admin@sampleoem.co.jp',
        role: UserRole.TENANT_ADMIN,
        status: 'active',
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'サンプル株式会社',
        postalCode: '100-0001',
        phoneNumber: '03-1234-5678',
        address: '東京都千代田区',
        permissions: {
          internationalSms: true,
          templateEditing: true,
          bulkSending: true,
          apiAccess: true,
          scheduledSending: true,
          analyticsAccess: true,
          userManagement: true,
          surveysCreation: true
        }
      },
      // 運用管理者
      {
        id: 'operation-1',
        username: 'sample-company-admin',
        email: 'admin@samplecompany.co.jp',
        role: UserRole.OPERATION_ADMIN,
        status: 'active',
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'サンプル会社',
        postalCode: '100-0001',
        phoneNumber: '03-1234-5678',
        address: '東京都千代田区',
        permissions: {
          internationalSms: true,
          templateEditing: true,
          bulkSending: true,
          apiAccess: true,
          scheduledSending: true,
          analyticsAccess: true,
          userManagement: false,
          surveysCreation: true
        }
      },
      // 運用担当者
      {
        id: 'operation-2',
        username: 'sample-company-user',
        email: 'user@samplecompany.co.jp',
        role: UserRole.OPERATION_USER,
        status: 'active',
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'サンプル会社',
        postalCode: '100-0001',
        phoneNumber: '03-1234-5678',
        address: '東京都千代田区',
        permissions: {
          internationalSms: true,
          templateEditing: true,
          bulkSending: true,
          apiAccess: true,
          scheduledSending: true,
          analyticsAccess: true,
          userManagement: false,
          surveysCreation: false
        }
      }
    ];
  };
  
  // モックアクティビティログ生成
  const generateMockActivityLogs = (users: UserData[]): UserActivityData[] => {
    const actions = [
      'ログイン',
      'プロフィール更新',
      'パスワード変更',
      'SMS送信',
      'テンプレート作成',
      '一括送信実行',
      '設定変更',
      'API利用',
      'ログイン失敗'
    ];
    
    const logs: UserActivityData[] = [];
    
    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();
      
      logs.push({
        id: `log-${i + 1}`,
        userId: user.id,
        action,
        timestamp,
        details: `${user.username}が${action}を実行しました（${Math.random() > 0.5 ? 'Webアプリ' : 'モバイルアプリ'}から）`,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      });
    }
    
    // タイムスタンプでソート（新しい順）
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return logs;
  };
  
  // モック契約データ生成
  const generateMockContracts = (users: UserData[]): UserContractData[] => {
    const plans = ['スタンダードプラン', 'プレミアムプラン', 'エンタープライズプラン', 'スモールビジネスプラン', 'フリープラン'];
    const fees = [0, 5000, 10000, 30000, 50000, 100000];
    const statuses: Array<'active' | 'expired' | 'pending'> = ['active', 'expired', 'pending'];
    
    return users.map(user => {
      const startDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      return {
        id: `contract-${user.id}`,
        userId: user.id,
        planName: plans[Math.floor(Math.random() * plans.length)],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        monthlyFee: fees[Math.floor(Math.random() * fees.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: startDate.toISOString(),
        updatedAt: new Date(startDate.getTime() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
      };
    });
  };

  // ユーザーフィルタリング
  const filterUsers = () => {
    let result = [...users];
    
    // まずはユーザーのロールでフィルタリング（サービス利用者のみ表示）
    result = result.filter(user => 
      user.role === UserRole.OPERATION_ADMIN || 
      user.role === UserRole.OPERATION_USER
    );
    
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

    // ロールでフィルタリング
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // ステータスでフィルタリング
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    // ソート
    result = result.sort((a, b) => {
      const fieldA = a[sortField as keyof UserData];
      const fieldB = b[sortField as keyof UserData];
      
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
  
  // 特定ユーザーのアクティビティログを取得
  const getUserActivityLogs = (userId: string): UserActivityData[] => {
    return activityLogs.filter(log => log.userId === userId).slice(0, 20);
  };
  
  // ユーザー契約情報取得
  const getUserContract = (userId: string): UserContractData | undefined => {
    return contracts.find(contract => contract.userId === userId);
  };

  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // ユーザー詳細表示
  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setSelectedTab('info');
  };
  
  // ユーザー編集モーダル表示
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      status: user.status,
      company: user.company,
      postalCode: user.postalCode,
      phoneNumber: user.phoneNumber,
      address: user.address,
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
  
  // 新規ユーザー作成モーダル表示
  const handleShowCreateModal = () => {
    setFormData({
      username: '',
      email: '',
      status: 'active',
      company: '',
      postalCode: '',
      phoneNumber: '',
      address: '',
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
  
  // ユーザー削除
  const handleDeleteUser = async (user: UserData) => {
    if (confirm(`「${user.username}」を削除してもよろしいですか？`)) {
      try {
        // 削除API呼び出しシミュレーション
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 成功したらリストから削除
        setUsers(users.filter(u => u.id !== user.id));
        toast.success(`「${user.username}」を削除しました`);
        
        // 詳細表示中のユーザーが削除された場合は詳細表示を閉じる
        if (selectedUser?.id === user.id) {
          setSelectedUser(null);
        }
      } catch (error) {
        toast.error('ユーザーの削除に失敗しました');
      }
    }
  };
  
  // ユーザーステータス切り替え
  const handleToggleStatus = async (user: UserData) => {
    try {
      // APIリクエストシミュレーション
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ステータス切替
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const updatedUser = { ...user, status: newStatus as 'active' | 'inactive' | 'pending' };
      
      // ユーザーリスト更新
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      
      // 詳細表示中のユーザーも更新
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
  
  // ユーザー作成フォーム用のresetForm関数を追加
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      status: 'active',
      company: '',
      postalCode: '',
      phoneNumber: '',
      address: '',
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
    });
    setValidationErrors({});
  };
  
  // validateForm関数を修正して常にエラーオブジェクトを返すようにする
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'ユーザー名は必須です';
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
  
  // 新規ユーザー作成
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
      
      const newUser: UserData = {
        id: `user-${Date.now()}`,
        username: formData.username,
        email: formData.email,
        role: UserRole.OPERATION_USER,
        status: formData.status,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        company: formData.company,
        postalCode: formData.postalCode,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        permissions: {
          ...formData.permissions,
          userManagement: false
        }
      };
      
      // ユーザーリストに追加
      setUsers([...users, newUser]);
      
      // モーダルを閉じる
      setShowCreateModal(false);
      
      // フォームをリセット
      resetForm();
      
      // 成功メッセージ
      toast.success('ユーザーが作成されました');
      
      // 送信者名設定は同一画面で行うため、別画面への遷移は削除
      // navigateToMessageSettings(newUser.id);
    } catch (error) {
      toast.error('ユーザーの作成に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ユーザー更新
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
      
      // ユーザー情報更新
      const updatedUser: UserData = {
        ...editingUser,
        username: formData.username,
        email: formData.email,
        status: formData.status,
        company: formData.company,
        postalCode: formData.postalCode,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        permissions: { 
          ...formData.permissions,
          userManagement: editingUser.permissions.userManagement
        }
      };
      
      // ユーザー一覧を更新
      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      
      // 詳細表示中のユーザーが更新された場合は詳細表示も更新
      if (selectedUser?.id === editingUser.id) {
        setSelectedUser(updatedUser);
      }
      
      // モーダルを閉じる
      setShowEditModal(false);
      toast.success('ユーザー情報を更新しました');
      
      // 送信者名設定画面への遷移は不要になったので削除
      // navigateToMessageSettings(updatedUser.id);
    } catch (error) {
      toast.error('ユーザー更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 日付のみフォーマット
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };
  
  // ユーザー作成成功時にメッセージ設定画面に遷移する関数
  const navigateToMessageSettings = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      // テスト確認用にコンソールログを追加
      console.log(`ユーザー「${user.username}」の送信者名設定画面へ遷移します。UserID: ${userId}`);
      // ユーザー情報をセット
      setSelectedUserForSettings(user);
      // メッセージ設定モーダルを表示
      setShowMessageSettings(true);
      
      // テスト用：ユーザー作成から送信者名設定画面への遷移を記録
      window.sessionStorage.setItem('navigation_test', JSON.stringify({
        from: 'user_creation',
        to: 'message_settings',
        userId: userId,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.error(`ユーザーID ${userId} が見つかりません。送信者名設定画面への遷移に失敗しました。`);
    }
  };
  
  // レンダリング部分にメッセージ設定モーダルを追加
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">ユーザー管理</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-grey-200">
          <h2 className="text-lg font-medium text-grey-900 mb-4">ユーザー一覧</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-grey-400" />
                </div>
                <input
                  type="search"
                  placeholder="ユーザー名、メールアドレスなどで検索..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-select min-w-[160px]"
              >
                <option value="all">すべてのロール</option>
                <option value={UserRole.SYSTEM_ADMIN}>システム管理者</option>
                <option value={UserRole.TENANT_ADMIN}>テナント管理者</option>
                <option value={UserRole.OPERATION_ADMIN}>運用管理者</option>
                <option value={UserRole.OPERATION_USER}>運用担当者</option>
              </select>
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
              <h3 className="mt-2 text-sm font-medium">ユーザーが見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? '検索条件に一致するユーザーが見つかりませんでした。'
                  : 'ユーザーが存在しません。'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg border hover:border-primary-500 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{user.username}</h3>
                        <p className="text-sm text-grey-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-grey-100 text-grey-800'
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
                        <span>最終ログイン: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP') : '未ログイン'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="btn-secondary text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`text-sm ${
                        user.status === 'active' ? 'btn-error' : 'btn-success'
                      }`}
                    >
                      {user.status === 'active' ? '無効化' : '有効化'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-grey-900 truncate">{user.username}</h3>
                    <p className="mt-1 text-sm text-grey-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-grey-500">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {roleDisplayNames[user.role]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        最終ログイン: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP') : '未ログイン'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`p-1 rounded hover:bg-grey-100 ${
                        user.status === 'active' 
                          ? 'text-error-600 hover:text-error-900' 
                          : 'text-primary-600 hover:text-primary-900'
                      }`}
                    >
                      {user.status === 'active' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
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

      {/* ユーザー作成/編集モーダル */}
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
                  {showCreateModal ? '新規ユーザー作成' : 'ユーザー編集'}
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
                      ユーザー名
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
                      メールアドレス
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
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      住所
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      rows={3}
                    />
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
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">権限設定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="surveysCreation"
                          name="surveysCreation"
                          type="checkbox"
                          checked={formData.permissions.surveysCreation}
                          onChange={handlePermissionChange}
                          className="form-checkbox h-4 w-4"
                        />
                        <label htmlFor="surveysCreation" className="ml-2 block text-sm text-grey-700">
                          アンケート作成
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="templateEditing"
                          name="templateEditing"
                          type="checkbox"
                          checked={formData.permissions.templateEditing}
                          onChange={handlePermissionChange}
                          className="form-checkbox h-4 w-4"
                        />
                        <label htmlFor="templateEditing" className="ml-2 block text-sm text-grey-700">
                          テンプレート編集
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="internationalSms"
                          name="internationalSms"
                          type="checkbox"
                          checked={formData.permissions.internationalSms}
                          onChange={handlePermissionChange}
                          className="form-checkbox h-4 w-4"
                        />
                        <label htmlFor="internationalSms" className="ml-2 block text-sm text-grey-700">
                          国際SMS送信
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="analyticsAccess"
                          name="analyticsAccess"
                          type="checkbox"
                          checked={formData.permissions.analyticsAccess}
                          onChange={handlePermissionChange}
                          className="form-checkbox h-4 w-4"
                        />
                        <label htmlFor="analyticsAccess" className="ml-2 block text-sm text-grey-700">
                          分析機能アクセス
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setFormData(initialFormData);
                    }}
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

      {/* メッセージ設定モーダル */}
      {showMessageSettings && selectedUserForSettings && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">
                  送信者名設定：{selectedUserForSettings.username}
                </h3>
                <button
                  type="button"
                  className="text-grey-400 hover:text-grey-500"
                  onClick={() => setShowMessageSettings(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <MessagingSettings userId={selectedUserForSettings.id} />
              
              <div className="flex justify-end mt-4 pt-4 border-t">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowMessageSettings(false)}
                >
                  完了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー詳細モーダル */}
      {selectedUser && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">
                  ユーザー詳細：{selectedUser.username}
                </h3>
                <button
                  type="button"
                  className="text-grey-400 hover:text-grey-500"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <div className="mb-4 border-b">
                  <nav className="flex space-x-4">
                    <button
                      className={`pb-4 font-medium text-sm ${
                        selectedTab === 'info' 
                          ? 'text-primary-600 border-b-2 border-primary-600' 
                          : 'text-grey-600 hover:text-grey-900'
                      }`}
                      onClick={() => setSelectedTab('info')}
                    >
                      基本情報
                    </button>
                    <button
                      className={`pb-4 font-medium text-sm ${
                        selectedTab === 'activity' 
                          ? 'text-primary-600 border-b-2 border-primary-600' 
                          : 'text-grey-600 hover:text-grey-900'
                      }`}
                      onClick={() => setSelectedTab('activity')}
                    >
                      アクティビティ
                    </button>
                    <button
                      className={`pb-4 font-medium text-sm ${
                        selectedTab === 'contract' 
                          ? 'text-primary-600 border-b-2 border-primary-600' 
                          : 'text-grey-600 hover:text-grey-900'
                      }`}
                      onClick={() => setSelectedTab('contract')}
                    >
                      契約情報
                    </button>
                  </nav>
                </div>
                
                {/* 基本情報 */}
                {selectedTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">ユーザー名</h4>
                        <p className="text-grey-900">{selectedUser.username}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">メールアドレス</h4>
                        <p className="text-grey-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">会社名</h4>
                        <p className="text-grey-900">{selectedUser.company}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">ステータス</h4>
                        <p className="text-grey-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedUser.status === 'active' 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-grey-100 text-grey-800'
                          }`}>
                            {selectedUser.status === 'active' ? '有効' : '無効'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">最終ログイン</h4>
                        <p className="text-grey-900">{formatDate(selectedUser.lastLoginAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">作成日</h4>
                        <p className="text-grey-900">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">ロール</h4>
                        <p className="text-grey-900">{roleDisplayNames[selectedUser.role]}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">郵便番号</h4>
                        <p className="text-grey-900">{selectedUser.postalCode}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-grey-500 mb-1">電話番号</h4>
                        <p className="text-grey-900">{selectedUser.phoneNumber}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-grey-500 mb-1">住所</h4>
                        <p className="text-grey-900">{selectedUser.address}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-grey-700 mb-3">権限一覧</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(selectedUser.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${value ? 'bg-success-500' : 'bg-grey-200'}`}>
                              {value && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm text-grey-700">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
                      <button
                        className="btn-secondary text-sm"
                        onClick={() => handleEditUser(selectedUser)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        編集
                      </button>
                      <button
                        className={`text-sm ${
                          selectedUser.status === 'active' 
                            ? 'btn-error' 
                            : 'btn-success'
                        }`}
                        onClick={() => handleToggleStatus(selectedUser)}
                      >
                        {selectedUser.status === 'active' ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            無効化
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            有効化
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* アクティビティ履歴 */}
                {selectedTab === 'activity' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-grey-700">最近のアクティビティ</h4>
                    <div className="max-h-96 overflow-y-auto">
                      {getUserActivityLogs(selectedUser.id).map((log) => (
                        <div key={log.id} className="py-3 border-b border-grey-100 last:border-0">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                              <Activity className="h-5 w-5 text-grey-400" />
                            </div>
                            <div>
                              <p className="text-sm text-grey-900">{log.details}</p>
                              <div className="flex mt-1 text-xs text-grey-500">
                                <p>{formatDate(log.timestamp)}</p>
                                <span className="mx-1">•</span>
                                <p>{log.ipAddress}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 契約情報 */}
                {selectedTab === 'contract' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-grey-700">契約情報</h4>
                    {getUserContract(selectedUser.id) ? (
                      <div className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-grey-500 mb-1">契約プラン</h4>
                            <p className="text-grey-900">{getUserContract(selectedUser.id)?.planName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-grey-500 mb-1">月額料金</h4>
                            <p className="text-grey-900">{formatCurrency(getUserContract(selectedUser.id)?.monthlyFee || 0)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-grey-500 mb-1">契約期間</h4>
                            <p className="text-grey-900">
                              {formatDateOnly(getUserContract(selectedUser.id)?.startDate || '')} 〜 
                              {formatDateOnly(getUserContract(selectedUser.id)?.endDate || '')}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-grey-500 mb-1">ステータス</h4>
                            <p className="text-grey-900">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getUserContract(selectedUser.id)?.status === 'active' 
                                  ? 'bg-success-100 text-success-800' 
                                  : getUserContract(selectedUser.id)?.status === 'pending'
                                  ? 'bg-warning-100 text-warning-800'
                                  : 'bg-grey-100 text-grey-800'
                              }`}>
                                {getUserContract(selectedUser.id)?.status === 'active' 
                                  ? '有効' 
                                  : getUserContract(selectedUser.id)?.status === 'pending'
                                  ? '審査中'
                                  : '期限切れ'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-grey-50 rounded-lg">
                        <p className="text-grey-500">契約情報がありません</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UserManagement;