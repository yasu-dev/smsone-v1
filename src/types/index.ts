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

// 送信者名（発信元番号）の定義
export interface SenderNumber {
  id: string;
  number: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  isInternational?: boolean;
  isPhoneNumber?: boolean;
  userId?: string;
}

export type CarrierType = 'docomo' | 'au' | 'softbank' | 'rakuten';

export interface Carrier {
  id: string;
  name: string;
  hasDynamicSender: boolean;
  fixedNumber?: string;
}

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

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export type FAQCategory = 
  | '送信' 
  | 'テンプレート' 
  | '履歴' 
  | 'アカウント' 
  | 'セキュリティ'
  | 'アンケート'
  | 'その他';

export * from './invoice'; 