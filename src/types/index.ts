export type SMSStatus = 
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'pending'
  | 'processing'
  | 'queued'
  | 'canceled'
  | 'expired'
  | 'rejected'
  | 'unknown';

export interface SMSMessage {
  id: string;
  to: string;
  body: string;
  status: SMSStatus;
  isInternational: boolean;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  shortenedUrl?: string;
  originalUrl?: string;
  shortenedUrl2?: string;
  originalUrl2?: string;
} 

export type SurveyStatus = 'active' | 'completed' | 'draft' | 'inactive';

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  type?: string;
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
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
  sealImage?: string;
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