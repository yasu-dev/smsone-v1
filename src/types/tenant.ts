export interface Tenant {
  id: string;
  name: string;
  domain: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
  };
  settings: {
    smsSenderId: string;
    maxSmsPerDay: number;
    allowedCountries: string[];
  };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',      // システム管理者
  TENANT_ADMIN = 'TENANT_ADMIN',      // テナント管理者
  OPERATION_ADMIN = 'OPERATION_ADMIN', // 運用管理者
  OPERATION_USER = 'OPERATION_USER'    // 運用担当者
}

export interface TenantContextType {
  tenant: Tenant | null;
  user: TenantUser | null;
  isLoading: boolean;
  error: Error | null;
  setTenant: (tenant: Tenant) => void;
  setUser: (user: TenantUser) => void;
  logout: () => void;
}

export interface TenantData {
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
  monthlyFee?: number; // 月額基本料金
  domesticSmsPrice?: number; // 国内SMS送信単価
  internationalSmsPrice?: number; // 海外SMS送信単価
} 