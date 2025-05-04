import { Invoice, InvoiceStatus, InvoiceItem } from '../types/invoice';
import { User } from '../types/auth';

/**
 * 請求書の自動生成・ステータス更新のバッチ処理関数
 * 
 * この関数は以下の処理を行います：
 * 1. 毎月10日に先月分の請求書を自動生成
 * 2. 支払期限を過ぎた請求書のステータスを「期限超過」に更新
 * 3. 毎月20日に未請求の請求書に対するリマインダー通知
 * 4. 毎月5日に請求済の請求書に対するリマインダー通知
 * 
 * @param date 処理を実行する日付（デフォルトは現在日時）
 * @returns 処理結果の情報
 */
export const runInvoiceBatchProcessing = async (date: Date = new Date()): Promise<{
  generatedInvoices: Invoice[];
  updatedInvoices: Invoice[];
  reminderSent: { invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[];
}> => {
  const today = date;
  const day = today.getDate();
  
  // 処理結果格納用
  const result = {
    generatedInvoices: [] as Invoice[],
    updatedInvoices: [] as Invoice[],
    reminderSent: [] as { invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[]
  };
  
  // 実際のアプリでは以下の処理をAPIやデータベースと連携
  try {
    // 1. 毎月10日に自動請求書生成
    if (day === 10) {
      const newInvoices = await generateMonthlyInvoices(today);
      result.generatedInvoices = newInvoices;
    }
    
    // 2. 支払期限超過チェックと更新（毎日実行）
    const overdueInvoices = await updateOverdueInvoices();
    result.updatedInvoices = overdueInvoices;
    
    // 3. 未請求リマインダー（毎月20日）
    if (day === 20) {
      const unpaidReminders = await sendUnpaidReminders();
      result.reminderSent.push(...unpaidReminders);
    }
    
    // 4. 請求済リマインダー（毎月5日）
    if (day === 5) {
      const issuedReminders = await sendIssuedReminders();
      result.reminderSent.push(...issuedReminders);
    }
    
    return result;
  } catch (error) {
    console.error('Invoice batch processing failed:', error);
    throw error;
  }
};

/**
 * 月次請求書の自動生成
 * 実際のアプリではデータベースやAPIから顧客情報と請求データを取得
 */
const generateMonthlyInvoices = async (date: Date): Promise<Invoice[]> => {
  // モック顧客データ
  const customers = [
    { id: 'tenant-1', name: '株式会社サンプル', monthlyFee: 30000 },
    { id: 'tenant-2', name: '株式会社エグザンプル', monthlyFee: 20000 },
    { id: 'operation-1', name: 'サンプル会社', monthlyFee: 15000 },
    { id: 'operation-2', name: 'サンプル会社 ユーザー部門', monthlyFee: 10000 }
  ];
  
  // モック管理者データ
  const admin = {
    tenant_id: 'system-admin',
    bankInfo: {
      bankName: '三菱UFJ銀行',
      branchName: '渋谷支店',
      accountType: 'ordinary' as const,
      accountNumber: '1234567',
      accountHolder: 'トパーズ（ゴウドウガイシャ'
    }
  };
  
  const generatedInvoices: Invoice[] = [];
  
  // 前月の期間を計算
  const year = date.getFullYear();
  const month = date.getMonth(); // 現在月（0-11）
  
  // 前月の初日と末日
  const prevMonthFirstDay = new Date(year, month - 1, 1);
  const prevMonthLastDay = new Date(year, month, 0);
  
  // 支払期限（当月末日）
  const dueDate = new Date(year, month + 1, 0);
  
  for (const customer of customers) {
    // 既存の請求書がないか確認（実際のアプリではDB検索）
    const existingInvoice = false; // モック：実際はDBチェック
    
    if (!existingInvoice) {
      // 請求書番号生成
      const invoiceNumber = `${year}${String(month).padStart(2, '0')}-${customer.id}-001`;
      
      // 請求項目
      const items: InvoiceItem[] = [
        {
          id: `item-${Date.now()}-1`,
          name: '月額基本料金',
          description: `${prevMonthFirstDay.getFullYear()}年${prevMonthFirstDay.getMonth() + 1}月分`,
          quantity: 1,
          unitPrice: customer.monthlyFee,
          amount: customer.monthlyFee,
          taxRate: 10,
          taxAmount: customer.monthlyFee * 0.1
        }
      ];
      
      // 合計金額計算
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const total = subtotal + taxTotal;
      
      // 請求書生成
      const newInvoice: Invoice = {
        id: `invoice-${Date.now()}-${customer.id}`,
        invoiceNumber,
        tenantId: admin.tenant_id,
        customerId: customer.id,
        customerName: customer.name,
        issueDate: date.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        periodStart: prevMonthFirstDay.toISOString().split('T')[0],
        periodEnd: prevMonthLastDay.toISOString().split('T')[0],
        status: InvoiceStatus.UNPAID,
        items,
        subtotal,
        taxTotal,
        total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bankInfo: admin.bankInfo
      };
      
      // 実際のアプリではDBに保存
      generatedInvoices.push(newInvoice);
      
      // 通知送信（実際のアプリではメールとアプリ内通知）
      console.log(`通知: ${customer.name}様の${prevMonthFirstDay.getMonth() + 1}月分請求書が自動生成されました`);
    }
  }
  
  return generatedInvoices;
};

/**
 * 支払期限超過の請求書ステータス更新
 * 実際のアプリではデータベースから請求書を取得して更新
 */
const updateOverdueInvoices = async (): Promise<Invoice[]> => {
  // モックデータ - 実際のアプリではDBから請求済みの請求書を取得
  const issuedInvoices: Invoice[] = [
    {
      id: 'invoice-sample-1',
      invoiceNumber: '202401-tenant-1-001',
      tenantId: 'system-admin',
      customerId: 'tenant-1',
      customerName: '株式会社サンプル',
      issueDate: '2024-01-10',
      dueDate: '2024-01-31', // 期限切れ
      periodStart: '2023-12-01',
      periodEnd: '2023-12-31',
      status: InvoiceStatus.ISSUED,
      items: [],
      subtotal: 30000,
      taxTotal: 3000,
      total: 33000,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      bankInfo: {
        bankName: '三菱UFJ銀行',
        branchName: '渋谷支店',
        accountType: 'ordinary',
        accountNumber: '1234567',
        accountHolder: 'トパーズ（ゴウドウガイシャ'
      }
    }
  ];
  
  const updatedInvoices: Invoice[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const invoice of issuedInvoices) {
    // 支払期限が過去で、ステータスが請求済みの請求書を検出
    if (invoice.status === InvoiceStatus.ISSUED && invoice.dueDate < today) {
      // ステータスを期限超過に更新
      const updatedInvoice: Invoice = {
        ...invoice,
        status: InvoiceStatus.OVERDUE,
        updatedAt: new Date().toISOString()
      };
      
      // 実際のアプリではDBを更新
      updatedInvoices.push(updatedInvoice);
      
      // 通知送信（実際のアプリではメールとアプリ内通知）
      console.log(`通知: ${invoice.customerName}様の請求書(${invoice.invoiceNumber})が支払期限を超過しました`);
    }
  }
  
  return updatedInvoices;
};

/**
 * 未請求リマインダー通知（毎月20日）
 * 実際のアプリではデータベースから未請求の請求書を取得して通知
 */
const sendUnpaidReminders = async (): Promise<{ invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[]> => {
  // モックデータ - 実際のアプリではDBから未請求の請求書を取得
  const unpaidInvoices: Invoice[] = [
    {
      id: 'invoice-sample-2',
      invoiceNumber: '202402-tenant-2-001',
      tenantId: 'system-admin',
      customerId: 'tenant-2',
      customerName: '株式会社エグザンプル',
      issueDate: '2024-02-10',
      dueDate: '2024-02-29',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      status: InvoiceStatus.UNPAID,
      items: [],
      subtotal: 20000,
      taxTotal: 2000,
      total: 22000,
      createdAt: '2024-02-10T00:00:00Z',
      updatedAt: '2024-02-10T00:00:00Z',
      bankInfo: {
        bankName: '三菱UFJ銀行',
        branchName: '渋谷支店',
        accountType: 'ordinary',
        accountNumber: '1234567',
        accountHolder: 'トパーズ（ゴウドウガイシャ'
      }
    }
  ];
  
  const reminders: { invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[] = [];
  
  for (const invoice of unpaidInvoices) {
    // リマインダー通知生成（実際のアプリではメールとアプリ内通知）
    console.log(`リマインダー: ${invoice.customerName}様の請求書(${invoice.invoiceNumber})がまだ請求されていません`);
    
    reminders.push({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      type: 'unpaid'
    });
  }
  
  return reminders;
};

/**
 * 請求済リマインダー通知（毎月5日）
 * 実際のアプリではデータベースから請求済の請求書を取得して通知
 */
const sendIssuedReminders = async (): Promise<{ invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[]> => {
  // モックデータ - 実際のアプリではDBから請求済の請求書を取得
  const issuedInvoices: Invoice[] = [
    {
      id: 'invoice-sample-3',
      invoiceNumber: '202402-operation-1-001',
      tenantId: 'system-admin',
      customerId: 'operation-1',
      customerName: 'サンプル会社',
      issueDate: '2024-02-10',
      dueDate: '2024-02-29',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      status: InvoiceStatus.ISSUED,
      items: [],
      subtotal: 15000,
      taxTotal: 1500,
      total: 16500,
      createdAt: '2024-02-10T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z',
      bankInfo: {
        bankName: '三菱UFJ銀行',
        branchName: '渋谷支店',
        accountType: 'ordinary',
        accountNumber: '1234567',
        accountHolder: 'トパーズ（ゴウドウガイシャ'
      }
    }
  ];
  
  const reminders: { invoiceId: string; customerId: string; type: 'unpaid' | 'issued' }[] = [];
  
  for (const invoice of issuedInvoices) {
    // リマインダー通知生成（実際のアプリではメールとアプリ内通知）
    console.log(`リマインダー: ${invoice.customerName}様の請求書(${invoice.invoiceNumber})のお支払いをお願いします`);
    
    reminders.push({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      type: 'issued'
    });
  }
  
  return reminders;
}; 