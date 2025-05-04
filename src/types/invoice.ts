export enum InvoiceStatus {
  UNPAID = 'unpaid', // 未請求
  PAID = 'paid', // 支払済
  OVERDUE = 'overdue', // 期限超過
  CANCELED = 'canceled', // キャンセル済
  ISSUED = 'issued', // 請求済
}

export interface InvoiceItem {
  id: string;
  name: string; // 項目名
  description?: string; // 説明
  quantity: number; // 数量
  unitPrice: number; // 単価
  amount: number; // 金額（数量×単価）
  taxRate: number; // 税率（%）
  taxAmount: number; // 税額
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // 請求書番号 (YYYYMM-CUSTOMERID-SEQUENCE)
  tenantId: string; // テナントID（請求元）
  customerId: string; // 顧客ID（請求先）
  customerName: string; // 顧客名
  issueDate: string; // 発行日
  dueDate: string; // 支払期限
  periodStart: string; // 対象期間開始日
  periodEnd: string; // 対象期間終了日
  status: InvoiceStatus; // ステータス
  items: InvoiceItem[]; // 請求項目
  subtotal: number; // 小計（税抜）
  taxTotal: number; // 消費税合計
  total: number; // 合計（税込）
  notes?: string; // 備考
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
  canceledAt?: string; // キャンセル日時
  paidAt?: string; // 支払日時
  bankInfo: BankInfo; // 振込先情報
}

export interface BankInfo {
  bankName: string; // 銀行名
  branchName: string; // 支店名
  accountType: 'ordinary' | 'checking'; // 口座種別（普通・当座）
  accountNumber: string; // 口座番号
  accountHolder: string; // 口座名義
}

export interface InvoiceNotification {
  id: string;
  userId: string;
  invoiceId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface InvoiceFilterOptions {
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  customerName?: string;
} 