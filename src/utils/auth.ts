import { TenantUser, UserRole } from '../types/tenant';
import { User } from '../types';
import { ROLE_PERMISSIONS } from './permissions';

export const login = async (email: string, password: string): Promise<{ user: TenantUser; token: string }> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  
  // ユーザーのロールに基づいて権限を設定
  const userRole = data.user.role as UserRole;
  data.user.permissions = ROLE_PERMISSIONS[userRole] || [];
  
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('token', data.token);
  return data;
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 権限チェック関数 - TenantUser型またはUser型のどちらでも使えるように
export const hasPermission = (user: TenantUser | User | null, permission: string): boolean => {
  if (!user) return false;
  
  // ロールベースのチェック
  const userRole = user.role as UserRole;
  
  // ロールに基づく内部判定
  if (userRole === UserRole.SYSTEM_ADMIN) {
    // システム管理者はすべての権限を持つ
    return true;
  }
  
  // TenantUser型（配列形式の権限）の場合
  if (Array.isArray((user as TenantUser).permissions)) {
    return (user as TenantUser).permissions.includes(permission);
  }
  
  // User型（オブジェクト形式の権限）の場合
  const userWithPermissions = user as User;
  if (typeof userWithPermissions.permissions === 'object' && userWithPermissions.permissions !== null) {
    const permissionValue = userWithPermissions.permissions[permission as keyof typeof userWithPermissions.permissions];
    return permissionValue === true;
  }
  
  return false;
};

// 特定のロール以上の権限を持っているかチェック
export const isAuthorized = (user: TenantUser | User | null, requiredRole: string): boolean => {
  if (!user) return false;
  const roleHierarchy: Record<string, number> = {
    'SYSTEM_ADMIN': 100,
    'TENANT_ADMIN': 80,
    'OPERATION_ADMIN': 60,
    'OPERATION_USER': 40
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}; 