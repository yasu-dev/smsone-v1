import { UserRole } from '../../types/tenant';

// ロール表示名マッピング
export const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: 'システム管理者 (Topaz合同会社のSMSOne)',
  [UserRole.TENANT_ADMIN]: 'テナント管理者 (サンプル株式会社のSMSService)',
  [UserRole.OPERATION_ADMIN]: '利用者',
  [UserRole.OPERATION_USER]: '利用者'
};

// 日付フォーマット
export const formatDate = (dateString: string | null) => {
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
export const formatDateOnly = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 通貨フォーマット
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}; 