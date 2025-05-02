import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface BillingHistory {
  id: string;
  date: string;
  monthlyFee: number;
  domesticUsage: number;
  internationalUsage: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string;
  domesticPrice?: number;
  internationalPrice?: number;
  invoiceDetails?: {
    title: string;
    invoiceNumber: string;
    billingDate: string;
    dueDate: string;
    notes: string;
    bankInfo: {
      bankName: string;
      branchName: string;
      accountType: string;
      accountNumber: string;
      accountName: string;
    };
  };
}

export interface BillingUser {
  id: string;
  username: string;
  company: string;
  email: string;
  address?: string;
  phoneNumber?: string;
  postalCode?: string;
  companyName?: string;
  contactEmail?: string;
  monthlyFee: number;
  domesticSmsPrice: number;
  internationalSmsPrice: number;
  status: 'active' | 'inactive' | 'overdue' | 'canceled' | 'pending';
  createdAt?: string;
  billingHistory: BillingHistory[];
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: '支払済' | '未払い';
  pdf: string;
  userId: string;
}

interface BillingState {
  users: BillingUser[];
  endUsers: BillingUser[];
  invoices: Invoice[];
  currentUser: BillingUser | null;
  isLoading: boolean;
  error: string | null;
  // アクション
  fetchUsers: () => Promise<void>;
  fetchEndUsers: () => Promise<void>;
  fetchUserById: (userId: string) => Promise<void>;
  fetchInvoices: (userId: string) => Promise<void>;
  processPayment: (invoiceId: string) => Promise<void>;
  generateInvoice: (userId: string) => Promise<void>;
  exportCSV: (type: 'users' | 'invoices' | 'endusers') => Promise<void>;
  downloadPDF: (invoiceId: string) => Promise<void>;
}

// モックデータ
const mockUsers: BillingUser[] = [
  {
    id: 'tenant-1',
    username: 'sample-oem-admin',
    company: 'サンプル株式会社',
    email: 'admin@samplecompany.jp',
    address: '東京都千代田区千代田1-1-1',
    postalCode: '100-0001',
    phoneNumber: '03-1234-5678',
    monthlyFee: 50000,
    domesticSmsPrice: 5,
    internationalSmsPrice: 15,
    status: 'active',
    createdAt: '2024-01-01',
    billingHistory: Array.from({ length: 15 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 1000) + 500;
      const internationalUsage = Math.floor(Math.random() * 200) + 50;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `tenant-1-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 50000,
        domesticUsage,
        internationalUsage,
        totalAmount: 50000 + (domesticUsage * 5) + (internationalUsage * 15),
        status,
        invoiceUrl: `/invoices/tenant-1-${i + 1}.pdf`
      };
    }).reverse()
  },
  {
    id: 'tenant-2',
    username: 'test-marketing-admin',
    company: 'テストマーケティング',
    email: 'info@testmarketing.co.jp',
    address: '東京都新宿区新宿3-1-1',
    postalCode: '160-0022',
    phoneNumber: '03-9876-5432',
    monthlyFee: 30000,
    domesticSmsPrice: 5,
    internationalSmsPrice: 15,
    status: 'active',
    createdAt: '2024-01-01',
    billingHistory: Array.from({ length: 15 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 800) + 300;
      const internationalUsage = Math.floor(Math.random() * 150) + 30;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `tenant-2-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 30000,
        domesticUsage,
        internationalUsage,
        totalAmount: 30000 + (domesticUsage * 5) + (internationalUsage * 15),
        status,
        invoiceUrl: `/invoices/tenant-2-${i + 1}.pdf`
      };
    }).reverse()
  },
  {
    id: 'tenant-3',
    username: 'digital-solutions-admin',
    company: 'デジタルソリューションズ',
    email: 'contact@digitalsolutions.jp',
    address: '神奈川県横浜市西区北幸2-2-2',
    postalCode: '220-0004',
    phoneNumber: '045-123-4567',
    monthlyFee: 40000,
    domesticSmsPrice: 5,
    internationalSmsPrice: 15,
    status: 'inactive',
    createdAt: '2024-01-01',
    billingHistory: Array.from({ length: 15 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 800) + 300;
      const internationalUsage = Math.floor(Math.random() * 150) + 30;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `tenant-3-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 40000,
        domesticUsage,
        internationalUsage,
        totalAmount: 40000 + (domesticUsage * 5) + (internationalUsage * 15),
        status,
        invoiceUrl: `/invoices/tenant-3-${i + 1}.pdf`
      };
    }).reverse()
  },
  {
    id: 'tenant-4',
    username: 'cloud-tech-admin',
    company: 'クラウドテクノロジー',
    email: 'support@cloudtech.co.jp',
    address: '大阪府大阪市中央区本町1-1-1',
    postalCode: '541-0053',
    phoneNumber: '06-6123-7890',
    monthlyFee: 35000,
    domesticSmsPrice: 5,
    internationalSmsPrice: 15,
    status: 'overdue',
    createdAt: '2024-01-01',
    billingHistory: Array.from({ length: 15 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 800) + 300;
      const internationalUsage = Math.floor(Math.random() * 150) + 30;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `tenant-4-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 35000,
        domesticUsage,
        internationalUsage,
        totalAmount: 35000 + (domesticUsage * 5) + (internationalUsage * 15),
        status,
        invoiceUrl: `/invoices/tenant-4-${i + 1}.pdf`
      };
    }).reverse()
  }
];

const mockInvoices: Invoice[] = [
  { id: 'INV-001', date: '2023-11-01', amount: 48500, status: '支払済', pdf: '#', userId: 'tenant-1' },
  { id: 'INV-002', date: '2023-12-01', amount: 52300, status: '支払済', pdf: '#', userId: 'tenant-1' },
  { id: 'INV-003', date: '2024-01-01', amount: 59800, status: '支払済', pdf: '#', userId: 'tenant-1' },
  { id: 'INV-004', date: '2024-02-01', amount: 61200, status: '未払い', pdf: '#', userId: 'tenant-1' }
];

// モックエンドユーザーデータ
const mockEndUsers: BillingUser[] = [
  {
    id: 'operation-1',
    username: 'sample-company-admin',
    company: 'サンプル会社',
    email: 'admin@samplecompany.co.jp',
    address: '東京都千代田区',
    postalCode: '100-0001',
    phoneNumber: '03-1234-5678',
    monthlyFee: 20000,
    domesticSmsPrice: 6,
    internationalSmsPrice: 18,
    status: 'active',
    createdAt: '2024-02-01',
    billingHistory: Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 500) + 200;
      const internationalUsage = Math.floor(Math.random() * 100) + 20;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `operation-1-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 20000,
        domesticUsage,
        internationalUsage,
        totalAmount: 20000 + (domesticUsage * 6) + (internationalUsage * 18),
        status,
        invoiceUrl: `/invoices/operation-1-${i + 1}.pdf`
      };
    }).reverse()
  },
  {
    id: 'operation-2',
    username: 'sample-company-user',
    company: 'サンプル会社',
    email: 'user@samplecompany.co.jp',
    address: '東京都千代田区',
    postalCode: '100-0001',
    phoneNumber: '03-1234-5678',
    monthlyFee: 15000,
    domesticSmsPrice: 6,
    internationalSmsPrice: 18,
    status: 'active',
    createdAt: '2024-02-15',
    billingHistory: Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const domesticUsage = Math.floor(Math.random() * 400) + 150;
      const internationalUsage = Math.floor(Math.random() * 80) + 15;
      const status: BillingHistory['status'] = i === 0 ? 'pending' : 'paid';
      return {
        id: `operation-2-${i + 1}`,
        date: date.toISOString().split('T')[0],
        monthlyFee: 15000,
        domesticUsage,
        internationalUsage,
        totalAmount: 15000 + (domesticUsage * 6) + (internationalUsage * 18),
        status,
        invoiceUrl: `/invoices/operation-2-${i + 1}.pdf`
      };
    }).reverse()
  }
];

export const useBillingStore = create<BillingState>()(
  devtools(
    (set, get) => ({
      users: [],
      endUsers: [],
      invoices: [],
      currentUser: null,
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のAPIコール
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ users: mockUsers, isLoading: false });
        } catch (error) {
          set({ error: '請求・支払い情報の取得に失敗しました', isLoading: false });
        }
      },

      fetchEndUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のAPIコール
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ endUsers: mockEndUsers, isLoading: false });
        } catch (error) {
          set({ error: 'サービス利用者の請求情報の取得に失敗しました', isLoading: false });
        }
      },

      fetchUserById: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のAPIコール
          await new Promise(resolve => setTimeout(resolve, 1000));
          const user = mockUsers.find(u => u.id === userId);
          if (!user) throw new Error('ユーザーが見つかりません');
          set({ currentUser: user, isLoading: false });
        } catch (error) {
          set({ error: 'ユーザー情報の取得に失敗しました', isLoading: false });
        }
      },

      fetchInvoices: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のAPIコール
          await new Promise(resolve => setTimeout(resolve, 1000));
          const userInvoices = mockInvoices.filter(i => i.userId === userId);
          set({ invoices: userInvoices, isLoading: false });
        } catch (error) {
          set({ error: '請求履歴の取得に失敗しました', isLoading: false });
        }
      },

      processPayment: async (invoiceId: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際の支払い処理
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedInvoices = get().invoices.map(invoice =>
            invoice.id === invoiceId ? { ...invoice, status: '支払済' as const } : invoice
          );
          set({ invoices: updatedInvoices, isLoading: false });
        } catch (error) {
          set({ error: '支払い処理に失敗しました', isLoading: false });
        }
      },

      generateInvoice: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際の請求書生成処理
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newInvoice: Invoice = {
            id: `INV-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: 50000,
            status: '未払い',
            pdf: '#',
            userId
          };
          set(state => ({ 
            invoices: [...state.invoices, newInvoice],
            isLoading: false 
          }));
        } catch (error) {
          set({ error: '請求書の生成に失敗しました', isLoading: false });
        }
      },

      exportCSV: async (type: 'users' | 'invoices' | 'endusers') => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のCSV出力処理
          await new Promise(resolve => setTimeout(resolve, 1000));
          const data = type === 'users' 
            ? get().users 
            : type === 'endusers'
            ? get().endUsers
            : get().invoices;
          const csv = JSON.stringify(data, null, 2);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${type}_${new Date().toISOString()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'CSVの出力に失敗しました', isLoading: false });
        }
      },

      downloadPDF: async (invoiceId: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: 実際のPDFダウンロード処理
          await new Promise(resolve => setTimeout(resolve, 1000));
          const invoice = get().invoices.find(i => i.id === invoiceId);
          if (!invoice) throw new Error('請求書が見つかりません');
          // PDFのダウンロード処理をここに実装
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'PDFのダウンロードに失敗しました', isLoading: false });
        }
      }
    })
  )
); 