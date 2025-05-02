import { UserRole } from '../types/tenant';

// 各ロールが持つ権限を定義
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_ADMIN]: [
    // システム管理者はすべての権限を持つ
    'dashboard:read',
    'dashboard:write',
    'tenant:read',
    'tenant:write',
    'user:read',
    'user:write',
    'billing:read',
    'billing:write',
    'operation:read',
    'operation:write',
    'operation:create',
    'operation:update',
    'operation:delete',
    'settings:read',
    'settings:write',
    'analytics:read',
    'analytics:write',
    'apiAccess',
    'internationalSms',
    'templateEditing',
    'bulkSending',
    'scheduledSending',
    'analyticsAccess',
    'userManagement',
    'surveysCreation',
    'tenantSettings'
  ],
  
  [UserRole.TENANT_ADMIN]: [
    // テナント管理者はテナント設定以外のすべての権限を持つ
    'dashboard:read',
    'dashboard:write',
    'user:read',
    'user:write',
    'billing:read',
    'billing:write',
    'operation:read',
    'operation:write',
    'operation:create',
    'operation:update',
    'operation:delete',
    'analytics:read',
    'analytics:write',
    'apiAccess',
    'internationalSms',
    'templateEditing',
    'bulkSending',
    'scheduledSending',
    'analyticsAccess',
    'userManagement',
    'surveysCreation',
    'tenantSettings'
  ],
  
  [UserRole.OPERATION_ADMIN]: [
    // 運用管理者はテナント設定、ユーザー管理以外の権限を持つ
    'dashboard:read',
    'dashboard:write',
    'operation:read',
    'operation:write',
    'operation:create',
    'operation:update',
    'operation:delete',
    'billing:read',
    'billing:write',
    'analytics:read',
    'apiAccess',
    'internationalSms',
    'templateEditing',
    'bulkSending',
    'scheduledSending',
    'analyticsAccess',
    'surveysCreation'
  ],
  
  [UserRole.OPERATION_USER]: [
    // 運用担当者はテナント設定、ユーザー管理、請求・支払い以外の権限を持つ
    'dashboard:read',
    'operation:read',
    'operation:create',
    'operation:update',
    'analytics:read',
    'apiAccess',
    'internationalSms',
    'templateEditing',
    'bulkSending',
    'scheduledSending',
    'analyticsAccess'
  ]
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: 'Topaz合同会社のSMSOneシステム管理者。全テナントの管理とすべての機能にアクセス可能',
  [UserRole.TENANT_ADMIN]: '株式会社ジンテックのPush!SMSテナント管理者。テナント設定以外のすべての画面と機能にアクセス可能',
  [UserRole.OPERATION_ADMIN]: '運用管理者。テナント設定、ユーザー管理以外のすべての画面と機能にアクセス可能',
  [UserRole.OPERATION_USER]: '運用担当者。テナント設定、ユーザー管理、請求・支払い以外の画面と機能にアクセス可能'
}; 