import { User, Tenant } from './index';

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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