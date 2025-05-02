import { create } from 'zustand';
import { AuthState, User, Tenant } from '../types/auth';

// モックユーザーデータ
const mockUsers: Record<string, User> = {
  'system-1': {
    id: 'system-1',
    username: 'admin',
    email: 'admin@system.com',
    role: 'SYSTEM_ADMIN',
    tenant_id: 'smsone',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    companyName: 'Topaz合同会社',
    postalCode: '285-0858',
    address: '千葉県佐倉市ユーカリが丘4-1-1 3F',
    phoneNumber: '043-330-7050',
    contactEmail: 'contact@topaz.jp',
    permissions: {
      // システム管理者はすべての権限を持つ
      internationalSms: true,
      templateEditing: true,
      bulkSending: true,
      apiAccess: true,
      scheduledSending: true,
      analyticsAccess: true,
      userManagement: true,
      surveysCreation: true,
      tenantSettings: true,
      billingAccess: true,
      'dashboard:read': true,
      'operation:create': true,
      'operation:read': true
    }
  },
  'smsone-admin': {
    id: 'smsone-admin',
    username: 'smsone-admin',
    email: 'admin@smsone.jp',
    role: 'TENANT_ADMIN',
    tenant_id: 'smsone',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    permissions: {
      // SMSOneテナント管理者はテナント設定権限を持つ
      internationalSms: true,
      templateEditing: true,
      bulkSending: true,
      apiAccess: true,
      scheduledSending: true,
      analyticsAccess: true,
      userManagement: true,
      surveysCreation: true,
      tenantSettings: true,
      billingAccess: true,
      'dashboard:read': true,
      'operation:create': true,
      'operation:read': true
    }
  },
  'tenant-1': {
    id: 'tenant-1',
    username: 'sample-oem-admin',
    email: 'admin@sampleoem.co.jp',
    role: 'TENANT_ADMIN',
    tenant_id: 'sample-oem-push',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    permissions: {
      // テナント管理者はテナント設定以外のすべての権限を持つ
      internationalSms: true,
      templateEditing: true,
      bulkSending: true,
      apiAccess: true,
      scheduledSending: true,
      analyticsAccess: true,
      userManagement: true,
      surveysCreation: true,
      tenantSettings: true,
      billingAccess: true,
      'dashboard:read': true,
      'operation:create': true,
      'operation:read': true
    }
  },
  'operation-1': {
    id: 'operation-1',
    username: 'sample-company-admin',
    email: 'admin@samplecompany.co.jp',
    role: 'OPERATION_ADMIN',
    tenant_id: 'sample-company',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    permissions: {
      // 運用管理者はテナント設定、ユーザー管理以外のすべての権限を持つ
      internationalSms: true,
      templateEditing: true,
      bulkSending: true,
      apiAccess: true,
      scheduledSending: true,
      analyticsAccess: true,
      userManagement: false,
      surveysCreation: true,
      tenantSettings: false,
      billingAccess: true,
      'dashboard:read': true,
      'operation:create': true,
      'operation:read': true
    }
  },
  'operation-2': {
    id: 'operation-2',
    username: 'sample-company-user',
    email: 'user@samplecompany.co.jp',
    role: 'OPERATION_USER',
    tenant_id: 'sample-company',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    permissions: {
      // 運用担当者はテナント設定、ユーザー管理、請求・支払い以外の権限を持つ
      internationalSms: true,
      templateEditing: true,
      bulkSending: true,
      apiAccess: true,
      scheduledSending: true,
      analyticsAccess: true,
      userManagement: false,
      surveysCreation: false,
      tenantSettings: false,
      billingAccess: false,
      'dashboard:read': true,
      'operation:create': true,
      'operation:read': true
    }
  }
};

// モックテナントデータ
const mockTenants: Record<string, Tenant> = {
  'smsone': {
    id: 'smsone',
    name: 'SMSOne',
    domain: 'smsone.jp',
    subdomain: 'app',
    logoUrl: '/logo.svg',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  'sample-oem-push': {
    id: 'sample-oem-push',
    name: 'Push!SMS',
    domain: 'push-sms.jp',
    subdomain: 'app',
    logoUrl: '/logo-jintech.png',
    primaryColor: '#0ea5e9',
    secondaryColor: '#06b6d4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  'sample-company': {
    id: 'sample-company',
    name: 'サンプル株式会社',
    domain: 'samplecompany.co.jp',
    subdomain: 'sms',
    logoUrl: '/logo-imperial.png',
    primaryColor: '#7e22ce',
    secondaryColor: '#9333ea',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  }
};

// デモ用の認証機能を強制的に有効にするフラグ
const FORCE_DEMO_AUTH = false; // 自動ログインを無効化して手動でユーザー選択できるようにする

// ドメインからテナントを特定する関数
const getTenantFromDomain = (): Tenant => {
  const hostname = window.location.hostname;
  
  // localhost環境の場合はデフォルトのテナントを返す
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return mockTenants['smsone'];
  }
  
  // サブドメインがある場合（例: app.topaz-sms.com）
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    const domain = parts.slice(1).join('.');
    
    // テナントの検索
    for (const tenantId in mockTenants) {
      const tenant = mockTenants[tenantId];
      if (domain === tenant.domain && subdomain === tenant.subdomain) {
        return tenant;
      }
    }
  }
  
  // 完全一致の検索
  for (const tenantId in mockTenants) {
    const tenant = mockTenants[tenantId];
    if (hostname === tenant.domain) {
      return tenant;
    }
  }
  
  // 該当がなければデフォルトのテナントを返す
  return mockTenants['smsone'];
};

interface AuthStore extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  forceLogin: () => void;
  updateUser: (updatedUser: User) => void;
  getTenantInfo: () => Tenant;
  updateTenant: (updatedTenant: Tenant) => void;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const user = Object.values(mockUsers).find(u => 
        u.username === username || u.email === username
      );
      
      if (!user) {
        throw new Error('ユーザー名またはメールアドレスが正しくありません');
      }
      
      if (password !== 'password') {
        throw new Error('パスワードが正しくありません');
      }
      
      localStorage.setItem('auth_token', 'demo_token');
      localStorage.setItem('auth_user_id', user.id);
      localStorage.setItem('auth_tenant_id', user.tenant_id);
      
      set({
        user,
        tenant: mockTenants[user.tenant_id],
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'ログインに失敗しました', 
        isLoading: false,
        isAuthenticated: false,
        user: null,
        tenant: null
      });
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_tenant_id');
    
    set({ 
      user: null,
      tenant: null,
      isAuthenticated: false, 
      error: null 
    });
  },

  forceLogin: () => {
    const userId = localStorage.getItem('auth_user_id') || 'system-1';
    const tenantId = localStorage.getItem('auth_tenant_id') || 'smsone';
    
    set({
      user: mockUsers[userId],
      tenant: mockTenants[tenantId],
      isAuthenticated: true,
      error: null
    });
  },

  updateUser: (updatedUser: User) => {
    set({ user: updatedUser });
    
    if (updatedUser.id === 'system-1') {
      Object.assign(mockUsers['system-1'], updatedUser);
    } else if (updatedUser.id === 'tenant-1') {
      Object.assign(mockUsers['tenant-1'], updatedUser);
    } else if (updatedUser.id === 'operation-1') {
      Object.assign(mockUsers['operation-1'], updatedUser);
    } else if (updatedUser.id === 'operation-2') {
      Object.assign(mockUsers['operation-2'], updatedUser);
    }
  },

  getTenantInfo: () => {
    const state = get();
    if (state.tenant) {
      return state.tenant;
    }
    return getTenantFromDomain();
  },

  updateTenant: (updatedTenant: Tenant) => {
    set({ tenant: updatedTenant });
    
    if (updatedTenant.id && mockTenants[updatedTenant.id]) {
      Object.assign(mockTenants[updatedTenant.id], updatedTenant);
      localStorage.setItem('auth_tenant_id', updatedTenant.id);
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        const userId = localStorage.getItem('auth_user_id') || '';
        const tenantId = localStorage.getItem('auth_tenant_id') || '';
        
        if (userId && tenantId && mockUsers[userId] && mockTenants[tenantId]) {
          set({
            user: mockUsers[userId],
            tenant: mockTenants[tenantId],
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user_id');
          localStorage.removeItem('auth_tenant_id');
          
          set({
            user: null,
            tenant: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } else {
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : '認証チェックに失敗しました'
      });
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    
    if (!user) return false;
    
    const userRole = user.role;
    
    if (userRole === 'SYSTEM_ADMIN') return true;
    
    if (permission === 'tenantSettings') {
      return userRole === 'TENANT_ADMIN';
    }
    
    if (permission === 'userManagement') {
      return userRole === 'TENANT_ADMIN';
    }
    
    if (permission === 'billingAccess') {
      return userRole === 'TENANT_ADMIN' || userRole === 'OPERATION_ADMIN';
    }
    
    if (permission === 'surveysCreation') {
      return userRole === 'TENANT_ADMIN' || userRole === 'OPERATION_ADMIN';
    }
    
    return user.permissions ? !!user.permissions[permission] : false;
  }
}));

export default useAuthStore;