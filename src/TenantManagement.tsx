// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  contactEmail: string;
  postalCode: string; // 追加：郵便番号
  phoneNumber: string; // 追加：電話番号
  address: string; // 追加：住所
  status: 'active' | 'inactive' | 'pending';
  userCount: number;
  createdAt: string;
  contractEndDate: string;
} 