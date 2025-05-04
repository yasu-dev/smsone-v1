// import { User, Tenant } from './index';
import { BankInfo } from './invoice';

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tenantContext: { tenantId: string, tenantName: string } | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenant_id: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  companyName?: string;
  postalCode?: string;
  address?: string;
  phoneNumber?: string;
  contactEmail?: string;
  sealImage?: string; // 印鑑画像データのBase64文字列
  bankInfo?: BankInfo; // 振込先情報
  permissions: {
    internationalSms: boolean;
    templateEditing: boolean;
    bulkSending: boolean;
    apiAccess: boolean;
    scheduledSending: boolean;
    analyticsAccess: boolean;
    userManagement: boolean;
    surveysCreation: boolean;
    tenantSettings: boolean;
    billingAccess: boolean;
    'dashboard:read': boolean;
    'operation:create': boolean;
    'operation:read': boolean;
    [key: string]: boolean;
  };
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
} 