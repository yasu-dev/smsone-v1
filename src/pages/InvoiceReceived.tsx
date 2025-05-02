import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Search, Download, Filter, Eye, CreditCard, Check, X, 
  AlertCircle, Calendar, Clock, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// 請求書データの型定義
interface InvoiceData {
  id: string;
  invoiceNumber: string;
  fromCompanyName: string;
  toCompanyName: string;
  amount: number;
  tax: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  pdfUrl?: string;
}

// 支払い履歴データの型定義
interface PaymentData {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: 'completed' | 'processing' | 'failed';
}

const InvoiceReceived: React.FC = () => {
  // ステート管理
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  
  // ユーザー情報取得
  const { user } = useAuthStore();
  
  // 初期データ読み込み
  useEffect(() => {
    fetchData();
  }, []);
  
  // 検索・フィルタリング変更時
  useEffect(() => {
    filterData();
  }, [searchTerm, statusFilter, invoices, payments, activeTab]);
  
  // データ取得
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // モックデータ（APIから取得する想定）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 請求書データのモック
      const mockInvoices: InvoiceData[] = [
        {
          id: 'inv-001',
          invoiceNumber: 'INV-2023-001',
          fromCompanyName: 'Topaz合同会社',
          toCompanyName: 'サンプル株式会社',
          amount: 50000,
          tax: 5000,
          issueDate: '2023-12-01',
          dueDate: '2023-12-31',
          status: 'paid',
          pdfUrl: '#'
        },
        {
          id: 'inv-002',
          invoiceNumber: 'INV-2024-001',
          fromCompanyName: 'Topaz合同会社',
          toCompanyName: 'サンプル株式会社',
          amount: 55000,
          tax: 5500,
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          status: 'unpaid',
          pdfUrl: '#'
        },
        {
          id: 'inv-003',
          invoiceNumber: 'INV-2024-002',
          fromCompanyName: 'Topaz合同会社',
          toCompanyName: 'サンプル株式会社',
          amount: 55000,
          tax: 5500,
          issueDate: '2024-02-01',
          dueDate: '2024-02-15',
          status: 'overdue',
          pdfUrl: '#'
        }
      ];
      
      // 支払い履歴データのモック
      const mockPayments: PaymentData[] = [
        {
          id: 'pay-001',
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-2023-001',
          amount: 55000,
          paymentDate: '2023-12-20',
          method: '銀行振込',
          status: 'completed'
        }
      ];
      
      setInvoices(mockInvoices);
      setFilteredInvoices(mockInvoices);
      setPayments(mockPayments);
      setFilteredPayments(mockPayments);
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast.error('請求データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // フィルタリング処理
  const filterData = () => {
    if (activeTab === 'invoices') {
      let result = [...invoices];
      
      // 検索語でフィルタリング
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
          invoice.fromCompanyName.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // ステータスでフィルタリング
      if (statusFilter !== 'all') {
        result = result.filter(invoice => invoice.status === statusFilter);
      }
      
      setFilteredInvoices(result);
    } else {
      let result = [...payments];
      
      // 検索語でフィルタリング
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(payment => 
          payment.invoiceNumber.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // ステータスでフィルタリング（支払い履歴の場合）
      if (statusFilter !== 'all') {
        result = result.filter(payment => payment.status === statusFilter);
      }
      
      setFilteredPayments(result);
    }
    
    // ページをリセット
    setCurrentPage(1);
  };
  
  // 請求書詳細表示
  const handleViewInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
  };
  
  // 請求書PDFダウンロード
  const handleDownloadInvoice = (invoice: InvoiceData) => {
    // PDFダウンロードのモック
    toast.success(`請求書 ${invoice.invoiceNumber} のダウンロードを開始しました`);
  };
  
  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // ページネーション - 型安全なデータ取得関数
  const getInvoicesData = (): InvoiceData[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  };

  const getPaymentsData = (): PaymentData[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const totalPages = Math.ceil(
    (activeTab === 'invoices' ? filteredInvoices.length : filteredPayments.length) / itemsPerPage
  );
  
  // ステータスバッジのスタイル取得
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'unpaid':
      case 'processing':
        return 'bg-warning-100 text-warning-800';
      case 'overdue':
      case 'failed':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-grey-100 text-grey-800';
    }
  };
  
  // ステータス表示名
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: '支払済',
      unpaid: '未払い',
      overdue: '支払期限超過',
      completed: '完了',
      processing: '処理中',
      failed: '失敗'
    };
    
    return statusMap[status] || status;
  };
  
  // タブコンテンツ
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (activeTab === 'invoices') {
      const invoiceItems = getInvoicesData();
      
      if (invoiceItems.length === 0) {
        return (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium">請求書がありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm || statusFilter !== 'all'
                ? '検索条件に一致するデータが見つかりませんでした。'
                : ''}
            </p>
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-grey-200">
            <thead className="bg-grey-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">請求書番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">請求元</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">発行日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">支払期限</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">状態</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-grey-200">
              {invoiceItems.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-grey-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-grey-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">{invoice.fromCompanyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">{formatDate(invoice.issueDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">{formatCurrency(invoice.amount + invoice.tax)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-primary-600 hover:text-primary-900"
                      onClick={() => handleDownloadInvoice(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      const paymentItems = getPaymentsData();
      
      if (paymentItems.length === 0) {
        return (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium">支払い履歴がありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm || statusFilter !== 'all'
                ? '検索条件に一致するデータが見つかりませんでした。'
                : ''}
            </p>
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-grey-200">
            <thead className="bg-grey-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">請求書番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">支払日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">支払方法</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">状態</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-grey-200">
              {paymentItems.map((payment) => (
                <tr key={payment.id} className="hover:bg-grey-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-grey-900">{payment.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">{formatDate(payment.paymentDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">{payment.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">請求受領</h1>
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <ul className="flex border-b">
            <li className="mr-1">
              <button
                className={`py-2 px-4 font-medium rounded-t-lg ${
                  activeTab === 'invoices'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-grey-500 hover:text-primary-500'
                }`}
                onClick={() => setActiveTab('invoices')}
              >
                請求書一覧
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`py-2 px-4 font-medium rounded-t-lg ${
                  activeTab === 'payments'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-grey-500 hover:text-primary-500'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                支払い履歴
              </button>
            </li>
          </ul>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-grey-400" />
              </div>
              <input
                type="text"
                placeholder={activeTab === 'invoices' ? "請求書番号で検索..." : "請求書番号で検索..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">すべてのステータス</option>
                {activeTab === 'invoices' ? (
                  <>
                    <option value="paid">支払済</option>
                    <option value="unpaid">未払い</option>
                    <option value="overdue">支払期限超過</option>
                  </>
                ) : (
                  <>
                    <option value="completed">完了</option>
                    <option value="processing">処理中</option>
                    <option value="failed">失敗</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-0">
          {renderTabContent()}
        </div>
        
        {((activeTab === 'invoices' && getInvoicesData().length > 0) || 
          (activeTab === 'payments' && getPaymentsData().length > 0)) && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-grey-700">
              全{activeTab === 'invoices' ? filteredInvoices.length : filteredPayments.length}件中
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, 
                (activeTab === 'invoices' ? filteredInvoices.length : filteredPayments.length))}件を表示
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-grey-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 請求書詳細モーダル */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium">請求書詳細</h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-grey-400 hover:text-grey-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-grey-500">請求書番号</p>
                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-500">状態</p>
                    <p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedInvoice.status)}`}>
                        {getStatusLabel(selectedInvoice.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-500">請求元</p>
                    <p className="font-medium">{selectedInvoice.fromCompanyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-500">請求先</p>
                    <p className="font-medium">{selectedInvoice.toCompanyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-500">発行日</p>
                    <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-500">支払期限</p>
                    <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">金額</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>小計</span>
                      <span>{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消費税（10%）</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>合計</span>
                      <span>{formatCurrency(selectedInvoice.amount + selectedInvoice.tax)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">お支払い方法</h3>
                  <div className="bg-grey-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">振込先口座: </span>
                      〇〇銀行 △△支店 普通 1234567 トパーズ（ゴウドウガイシャ）
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">振込期限: </span>
                      {formatDate(selectedInvoice.dueDate)}まで
                    </p>
                    <p className="text-sm mt-2 text-grey-500">
                      ※振込手数料はお客様負担にてお願いいたします。
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="btn-secondary"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDFダウンロード
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InvoiceReceived; 