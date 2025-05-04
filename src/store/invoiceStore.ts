import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Invoice, InvoiceStatus, InvoiceNotification, InvoiceFilterOptions } from '../types/invoice';

interface InvoiceState {
  invoices: Invoice[];
  notifications: InvoiceNotification[];
  isLoading: boolean;
  error: string | null;
  filterOptions: InvoiceFilterOptions;
  
  // アクション
  fetchInvoices: () => Promise<void>;
  fetchInvoiceById: (id: string) => Promise<Invoice | null>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  generateInvoiceNumber: (customerId: string) => string;
  
  // 通知関連
  fetchNotifications: (userId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  
  // フィルタリング
  setFilterOptions: (options: InvoiceFilterOptions) => void;
  resetFilterOptions: () => void;
}

// モックデータ生成
const generateMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const customers = ['tenant-1', 'tenant-2', 'operation-1', 'operation-2'];
  const customerNames = ['株式会社サンプル', '株式会社エグザンプル', 'サンプル会社', 'サンプル会社'];
  
  // 現在の日付から3ヶ月分の請求書を生成
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    // 各顧客ごとに請求書を生成
    customers.forEach((customerId, index) => {
      const periodStart = `${year}-${month.toString().padStart(2, '0')}-01`;
      const periodEnd = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      // 支払期限は翌月10日
      const dueDate = new Date(year, month, 10);
      
      // 請求書番号
      const invoiceNumber = `${year}${month.toString().padStart(2, '0')}-${customerId}-${(i+1).toString().padStart(3, '0')}`;
      
      // ステータスの決定（最新月は未請求、2か月前は支払済み、間は請求済み）
      let status: InvoiceStatus;
      if (i === 0) {
        status = InvoiceStatus.UNPAID;
      } else if (i === 1) {
        status = InvoiceStatus.ISSUED;
      } else {
        status = InvoiceStatus.PAID;
      }
      
      // 請求項目
      const items = [
        {
          id: `item-${i}-${index}-1`,
          name: '月額基本料金',
          quantity: 1,
          unitPrice: 30000,
          amount: 30000,
          taxRate: 10,
          taxAmount: 3000
        },
        {
          id: `item-${i}-${index}-2`,
          name: '国内SMS送信',
          description: '3円 × 500通',
          quantity: 500,
          unitPrice: 3,
          amount: 1500,
          taxRate: 10,
          taxAmount: 150
        }
      ];
      
      // 合計金額
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const total = subtotal + taxTotal;
      
      invoices.push({
        id: `invoice-${i}-${index}`,
        invoiceNumber,
        tenantId: 'system-admin', // 請求元はシステム管理者
        customerId,
        customerName: customerNames[index],
        issueDate: `${year}-${month.toString().padStart(2, '0')}-10`, // 10日発行
        dueDate: dueDate.toISOString().split('T')[0],
        periodStart,
        periodEnd,
        status,
        items,
        subtotal,
        taxTotal,
        total,
        createdAt: new Date(year, month - 1, 10).toISOString(),
        updatedAt: new Date(year, month - 1, 10).toISOString(),
        paidAt: status === InvoiceStatus.PAID ? new Date(year, month, 5).toISOString() : undefined,
        bankInfo: {
          bankName: '三菱UFJ銀行',
          branchName: '渋谷支店',
          accountType: 'ordinary',
          accountNumber: '1234567',
          accountHolder: 'トパーズ（ゴウドウガイシャ'
        }
      });
    });
  }
  
  return invoices;
};

// モック通知データ生成
const generateMockNotifications = (invoices: Invoice[]): InvoiceNotification[] => {
  return invoices.map((invoice, index) => ({
    id: `notification-${index}`,
    userId: invoice.customerId,
    invoiceId: invoice.id,
    title: `新しい請求書が発行されました: ${invoice.invoiceNumber}`,
    message: `${invoice.periodStart}～${invoice.periodEnd}の期間の請求書が発行されました。合計金額: ${invoice.total.toLocaleString()}円`,
    isRead: index > 5, // 最初の5件は未読
    createdAt: invoice.createdAt
  }));
};

export const useInvoiceStore = create<InvoiceState>()(
  devtools(
    (set, get) => {
      // モックデータ初期化
      const mockInvoices = generateMockInvoices();
      const mockNotifications = generateMockNotifications(mockInvoices);
      
      return {
        invoices: [],
        notifications: [],
        isLoading: false,
        error: null,
        filterOptions: {},
        
        fetchInvoices: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // フィルター適用
            const { filterOptions } = get();
            let filteredInvoices = [...mockInvoices];
            
            if (filterOptions.status) {
              filteredInvoices = filteredInvoices.filter(invoice => invoice.status === filterOptions.status);
            }
            
            if (filterOptions.startDate) {
              filteredInvoices = filteredInvoices.filter(invoice => invoice.issueDate >= filterOptions.startDate!);
            }
            
            if (filterOptions.endDate) {
              filteredInvoices = filteredInvoices.filter(invoice => invoice.issueDate <= filterOptions.endDate!);
            }
            
            if (filterOptions.customerId) {
              filteredInvoices = filteredInvoices.filter(invoice => invoice.customerId === filterOptions.customerId);
            }
            
            if (filterOptions.customerName) {
              filteredInvoices = filteredInvoices.filter(invoice => 
                invoice.customerName.toLowerCase().includes(filterOptions.customerName!.toLowerCase())
              );
            }
            
            set({ invoices: filteredInvoices, isLoading: false });
          } catch (error) {
            console.error('Failed to fetch invoices:', error);
            set({ error: '請求書の取得に失敗しました', isLoading: false });
          }
        },
        
        fetchInvoiceById: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 500));
            const invoice = mockInvoices.find(inv => inv.id === id) || null;
            set({ isLoading: false });
            return invoice;
          } catch (error) {
            console.error('Failed to fetch invoice:', error);
            set({ error: '請求書の取得に失敗しました', isLoading: false });
            return null;
          }
        },
        
        createInvoice: async (invoiceData) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const invoiceNumber = get().generateInvoiceNumber(invoiceData.customerId);
            const newInvoice: Invoice = {
              ...invoiceData,
              id: `invoice-${Date.now()}`,
              invoiceNumber,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            set(state => ({ 
              invoices: [...state.invoices, newInvoice], 
              isLoading: false 
            }));
            
            // 通知の作成
            const newNotification: InvoiceNotification = {
              id: `notification-${Date.now()}`,
              userId: invoiceData.customerId,
              invoiceId: newInvoice.id,
              title: `新しい請求書が発行されました: ${newInvoice.invoiceNumber}`,
              message: `${newInvoice.periodStart}～${newInvoice.periodEnd}の期間の請求書が発行されました。合計金額: ${newInvoice.total.toLocaleString()}円`,
              isRead: false,
              createdAt: new Date().toISOString()
            };
            
            set(state => ({
              notifications: [...state.notifications, newNotification]
            }));
            
          } catch (error) {
            console.error('Failed to create invoice:', error);
            set({ error: '請求書の作成に失敗しました', isLoading: false });
          }
        },
        
        updateInvoice: async (id, updates) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 800));
            
            set(state => ({
              invoices: state.invoices.map(invoice => 
                invoice.id === id 
                  ? { ...invoice, ...updates, updatedAt: new Date().toISOString() } 
                  : invoice
              ),
              isLoading: false
            }));
          } catch (error) {
            console.error('Failed to update invoice:', error);
            set({ error: '請求書の更新に失敗しました', isLoading: false });
          }
        },
        
        updateInvoiceStatus: async (id, status) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const now = new Date().toISOString();
            const updates: Partial<Invoice> = {
              status,
              updatedAt: now
            };
            
            // ステータスに応じた日付更新
            if (status === InvoiceStatus.PAID) {
              updates.paidAt = now;
            } else if (status === InvoiceStatus.CANCELED) {
              updates.canceledAt = now;
            }
            
            set(state => ({
              invoices: state.invoices.map(invoice => 
                invoice.id === id ? { ...invoice, ...updates } : invoice
              ),
              isLoading: false
            }));
            
            // 通知の作成
            const invoice = get().invoices.find(inv => inv.id === id);
            if (invoice) {
              let title = '';
              let message = '';
              
              switch (status) {
                case InvoiceStatus.ISSUED:
                  title = `請求書が発行されました: ${invoice.invoiceNumber}`;
                  message = `${invoice.periodStart}～${invoice.periodEnd}の期間の請求書が発行されました。合計金額: ${invoice.total.toLocaleString()}円`;
                  break;
                case InvoiceStatus.PAID:
                  title = `支払いが完了しました: ${invoice.invoiceNumber}`;
                  message = `請求書番号 ${invoice.invoiceNumber} の支払いが完了しました。ありがとうございます。`;
                  break;
                case InvoiceStatus.OVERDUE:
                  title = `支払期限が過ぎています: ${invoice.invoiceNumber}`;
                  message = `請求書番号 ${invoice.invoiceNumber} の支払期限が過ぎています。至急お支払いをお願いします。`;
                  break;
                case InvoiceStatus.CANCELED:
                  title = `請求書がキャンセルされました: ${invoice.invoiceNumber}`;
                  message = `請求書番号 ${invoice.invoiceNumber} がキャンセルされました。`;
                  break;
              }
              
              if (title && message) {
                const newNotification: InvoiceNotification = {
                  id: `notification-${Date.now()}`,
                  userId: invoice.customerId,
                  invoiceId: invoice.id,
                  title,
                  message,
                  isRead: false,
                  createdAt: now
                };
                
                set(state => ({
                  notifications: [...state.notifications, newNotification]
                }));
              }
            }
          } catch (error) {
            console.error('Failed to update invoice status:', error);
            set({ error: '請求書のステータス更新に失敗しました', isLoading: false });
          }
        },
        
        cancelInvoice: async (id) => {
          return get().updateInvoiceStatus(id, InvoiceStatus.CANCELED);
        },
        
        markAsPaid: async (id) => {
          return get().updateInvoiceStatus(id, InvoiceStatus.PAID);
        },
        
        generateInvoiceNumber: (customerId) => {
          const now = new Date();
          const year = now.getFullYear();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          
          // 現在の請求書から同じ年月・顧客のものを検索して連番を決定
          const currentInvoices = get().invoices.filter(invoice => 
            invoice.invoiceNumber.startsWith(`${year}${month}-${customerId}`)
          );
          
          // 連番の決定（既存の最大値+1、または1から開始）
          let seq = 1;
          if (currentInvoices.length > 0) {
            const seqNumbers = currentInvoices.map(invoice => {
              const parts = invoice.invoiceNumber.split('-');
              return parseInt(parts[parts.length - 1], 10);
            });
            seq = Math.max(...seqNumbers) + 1;
          }
          
          return `${year}${month}-${customerId}-${seq.toString().padStart(3, '0')}`;
        },
        
        fetchNotifications: async (userId) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const userNotifications = mockNotifications.filter(
              notification => notification.userId === userId
            );
            
            set({ notifications: userNotifications, isLoading: false });
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ error: '通知の取得に失敗しました', isLoading: false });
          }
        },
        
        markNotificationAsRead: async (id) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set(state => ({
              notifications: state.notifications.map(notification => 
                notification.id === id ? { ...notification, isRead: true } : notification
              ),
              isLoading: false
            }));
          } catch (error) {
            console.error('Failed to mark notification as read:', error);
            set({ error: '通知の既読マークに失敗しました', isLoading: false });
          }
        },
        
        markAllNotificationsAsRead: async (userId) => {
          set({ isLoading: true, error: null });
          try {
            // TODO: 実際のAPIコール
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set(state => ({
              notifications: state.notifications.map(notification => 
                notification.userId === userId ? { ...notification, isRead: true } : notification
              ),
              isLoading: false
            }));
          } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            set({ error: '全通知の既読マークに失敗しました', isLoading: false });
          }
        },
        
        setFilterOptions: (options) => {
          set({ filterOptions: { ...get().filterOptions, ...options } });
          get().fetchInvoices();
        },
        
        resetFilterOptions: () => {
          set({ filterOptions: {} });
          get().fetchInvoices();
        }
      };
    }
  )
); 