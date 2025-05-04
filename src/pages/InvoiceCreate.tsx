import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Calendar, CalendarRange } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInvoiceStore } from '../store/invoiceStore';
import { InvoiceItem, Invoice, InvoiceStatus } from '../types/invoice';
import useAuthStore from '../store/authStore';

type InvoiceFormProps = {
  isEdit?: boolean;
};

const InvoiceCreate: React.FC<InvoiceFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createInvoice, fetchInvoiceById, updateInvoice } = useInvoiceStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // フォーム状態
  const [invoiceData, setInvoiceData] = useState<Partial<Invoice>>({
    status: InvoiceStatus.UNPAID,
    items: [],
    subtotal: 0,
    taxTotal: 0,
    total: 0,
  });
  
  // 顧客リスト (実際のアプリではAPIから取得)
  const [customers] = useState([
    { id: 'tenant-1', name: '株式会社サンプル' },
    { id: 'tenant-2', name: '株式会社エグザンプル' },
    { id: 'operation-1', name: 'サンプル会社' },
    { id: 'operation-2', name: 'サンプル会社 ユーザー部門' }
  ]);
  
  // 編集モードの場合、請求書データを取得
  useEffect(() => {
    const fetchInvoice = async () => {
      if (isEdit && id) {
        setIsLoading(true);
        try {
          const invoice = await fetchInvoiceById(id);
          if (invoice) {
            setInvoiceData(invoice);
          } else {
            toast.error('請求書が見つかりませんでした');
            navigate('/dashboard/invoices');
          }
        } catch (error) {
          toast.error('請求書の取得に失敗しました');
        } finally {
          setIsLoading(false);
        }
      } else {
        // 新規作成時のデフォルト値設定
        // 現在の月の1日から末日までの期間をデフォルトに
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 支払期限は翌月末日
        const dueDate = new Date(year, month + 1, 0);
        
        setInvoiceData({
          ...invoiceData,
          tenantId: user?.tenant_id || '',
          issueDate: now.toISOString().split('T')[0],
          periodStart: firstDay.toISOString().split('T')[0],
          periodEnd: lastDay.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          items: [createNewItem()]
        });
      }
    };
    
    fetchInvoice();
  }, [id, isEdit, fetchInvoiceById, navigate]);
  
  // フォームフィールドの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setInvoiceData({
      ...invoiceData,
      [name]: value
    });
    
    // 顧客IDが変更された場合、顧客名も更新
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setInvoiceData(prev => ({
          ...prev,
          customerId: value,
          customerName: selectedCustomer.name
        }));
      }
    }
  };
  
  // 新しい請求項目を作成
  const createNewItem = (): InvoiceItem => {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 10, // デフォルト税率10%
      taxAmount: 0
    };
  };
  
  // 請求項目を追加
  const handleAddItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...(invoiceData.items || []), createNewItem()]
    });
  };
  
  // 請求項目を削除
  const handleRemoveItem = (itemId: string) => {
    if (!invoiceData.items || invoiceData.items.length <= 1) {
      toast.error('少なくとも1つの請求項目が必要です');
      return;
    }
    
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== itemId)
    });
    
    // 削除後に金額を再計算
    recalculateTotals(invoiceData.items.filter(item => item.id !== itemId));
  };
  
  // 請求項目のフィールド変更を処理
  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    if (!invoiceData.items) return;
    
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // 数量または単価が変更された場合、金額を再計算
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
          const taxRate = field === 'taxRate' ? Number(value) : item.taxRate;
          
          const amount = quantity * unitPrice;
          const taxAmount = amount * (taxRate / 100);
          
          return {
            ...updatedItem,
            amount,
            taxAmount
          };
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems
    });
    
    // 変更後に金額を再計算
    recalculateTotals(updatedItems);
  };
  
  // 金額の再計算
  const recalculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxTotal;
    
    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxTotal,
      total
    }));
  };
  
  // 入力値のバリデーション
  const validateForm = (): boolean => {
    if (!invoiceData.customerId) {
      toast.error('顧客を選択してください');
      return false;
    }
    
    if (!invoiceData.issueDate) {
      toast.error('発行日を入力してください');
      return false;
    }
    
    if (!invoiceData.dueDate) {
      toast.error('支払期限を入力してください');
      return false;
    }
    
    if (!invoiceData.periodStart || !invoiceData.periodEnd) {
      toast.error('請求期間を入力してください');
      return false;
    }
    
    // 請求項目のバリデーション
    if (!invoiceData.items || invoiceData.items.length === 0) {
      toast.error('少なくとも1つの請求項目が必要です');
      return false;
    }
    
    for (const item of invoiceData.items) {
      if (!item.name) {
        toast.error('請求項目名を入力してください');
        return false;
      }
      
      if (item.quantity <= 0) {
        toast.error('数量は0より大きい値を入力してください');
        return false;
      }
    }
    
    return true;
  };
  
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // 銀行情報をユーザーから取得
      const bankInfo = user?.bankInfo || {
        bankName: '三菱UFJ銀行',
        branchName: '渋谷支店',
        accountType: 'ordinary',
        accountNumber: '1234567',
        accountHolder: 'トパーズ（ゴウドウガイシャ'
      };
      
      if (isEdit && id) {
        // 既存の請求書を更新
        await updateInvoice(id, {
          ...invoiceData as Invoice,
          updatedAt: new Date().toISOString()
        });
        toast.success('請求書を更新しました');
      } else {
        // 新しい請求書を作成
        await createInvoice({
          ...invoiceData as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>,
          bankInfo
        });
        toast.success('請求書を作成しました');
      }
      
      // 請求書一覧ページに戻る
      navigate('/dashboard/invoices');
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error(isEdit ? '請求書の更新に失敗しました' : '請求書の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 金額をフォーマット
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  if (isLoading && isEdit) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard/invoices')}
            className="mr-4 text-grey-600 hover:text-grey-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-grey-900">
            {isEdit ? '請求書編集' : '新規請求書作成'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-grey-700 mb-1">
                  顧客 <span className="text-error-600">*</span>
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  value={invoiceData.customerId || ''}
                  onChange={handleInputChange}
                  className="form-select w-full"
                  required
                >
                  <option value="">顧客を選択してください</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-grey-700 mb-1">
                  発行日 <span className="text-error-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    value={invoiceData.issueDate || ''}
                    onChange={handleInputChange}
                    className="form-input w-full pl-10"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-grey-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-grey-700 mb-1">
                  支払期限 <span className="text-error-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={invoiceData.dueDate || ''}
                    onChange={handleInputChange}
                    className="form-input w-full pl-10"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-grey-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4">請求対象期間</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="periodStart" className="block text-sm font-medium text-grey-700 mb-1">
                    開始日 <span className="text-error-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="periodStart"
                      name="periodStart"
                      value={invoiceData.periodStart || ''}
                      onChange={handleInputChange}
                      className="form-input w-full pl-10"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarRange className="h-5 w-5 text-grey-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="periodEnd" className="block text-sm font-medium text-grey-700 mb-1">
                    終了日 <span className="text-error-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="periodEnd"
                      name="periodEnd"
                      value={invoiceData.periodEnd || ''}
                      onChange={handleInputChange}
                      className="form-input w-full pl-10"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarRange className="h-5 w-5 text-grey-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-1">
                  備考
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={invoiceData.notes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea w-full"
                  placeholder="請求書に関する追加情報を入力してください"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">請求項目</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="btn-secondary flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              項目追加
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-grey-200">
              <thead className="bg-grey-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    項目名 <span className="text-error-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    詳細
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider w-20">
                    数量 <span className="text-error-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider w-32">
                    単価 <span className="text-error-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider w-24">
                    税率 (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider w-32">
                    金額
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider w-16">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-grey-200">
                {invoiceData.items?.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="form-input w-full"
                        placeholder="例: 月額基本料金"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="form-input w-full"
                        placeholder="例: 1ヶ月分"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        min="1"
                        step="1"
                        className="form-input w-full text-right"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                        min="0"
                        step="1"
                        className="form-input w-full text-right"
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(item.id, 'taxRate', Number(e.target.value))}
                        min="0"
                        step="0.1"
                        className="form-input w-full text-right"
                        required
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(item.amount)}
                      {item.taxAmount > 0 && (
                        <div className="text-xs text-grey-500">
                          (税: {formatCurrency(item.taxAmount)})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-grey-600 hover:text-error-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-grey-300">
                  <td colSpan={5} className="px-4 py-2 text-right font-medium">
                    小計:
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(invoiceData.subtotal || 0)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right font-medium">
                    消費税:
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(invoiceData.taxTotal || 0)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t-2 border-grey-300">
                  <td colSpan={5} className="px-4 py-2 text-right font-semibold text-lg">
                    合計:
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-lg text-primary-700">
                    {formatCurrency(invoiceData.total || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/invoices')}
            className="btn-secondary mr-4"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </span>
            ) : (
              isEdit ? '更新する' : '作成する'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default InvoiceCreate; 