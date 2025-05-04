import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, Calendar,
  Download, FileText, CheckCircle, AlertCircle, XCircle,
  Grid, List, Check, Clock, X, ArrowUpDown, Columns
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import { Invoice, InvoiceStatus, InvoiceFilterOptions, InvoiceItem } from '../types/invoice';
import useAuthStore from '../store/authStore';
import InvoiceKanbanView from '../components/invoice/InvoiceKanbanView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 利用者情報のインターフェース
interface UserDetail {
  name: string;
  domesticUsage: number;
  internationalUsage: number;
  domesticPrice: number;
  internationalPrice: number;
  domesticAmount?: number;
  internationalAmount?: number;
  total?: number;
}

const InvoiceManagement: React.FC = () => {
  // ストアから請求書と関連機能を取得
  const { 
    invoices, 
    isLoading, 
    error, 
    fetchInvoices, 
    updateInvoiceStatus,
    cancelInvoice,
    markAsPaid,
    setFilterOptions,
    resetFilterOptions
  } = useInvoiceStore();
  
  const { user } = useAuthStore();
  
  // UI状態
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('issueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // フィルター条件 - デフォルト値に2ヶ月前からの範囲を設定
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return twoMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD形式
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD形式
  });
  
  // 追加のInvoice項目（Invoiceエンティティに存在しない拡張項目）
  const [invoiceExtendedInfo, setInvoiceExtendedInfo] = useState<{
    customerAddress?: string;
    customerPhone?: string;
    customerEmail?: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  }>({});
  
  // ページごとの表示数
  const itemsPerPage = 10;
  
  // 初回マウント時に請求書を取得
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);
  
  // 未請求のデモデータを追加（独立したエフェクト）
  useEffect(() => {
    // 初回レンダリング時のみ実行するためのフラグ
    let isInitialRender = true;

    // 未請求のデモデータを追加
    const addUnpaidDemoData = async () => {
      // ストアから直接最新の請求書データを取得
      const currentInvoices = useInvoiceStore.getState().invoices;
      
      // 既存データをチェックして未請求データがない場合のみ追加
      const hasUnpaidInvoices = currentInvoices.some(inv => inv.status === InvoiceStatus.UNPAID);
      
      if (!hasUnpaidInvoices && currentInvoices.length > 0 && isInitialRender) {
        try {
          // 初回実行のフラグをオフにして、再実行を防止
          isInitialRender = false;
          
          // 既存の請求書からテンプレートとして使用
          const templateInvoice = { ...currentInvoices[0] };
          
          // 現在の日付から2日後を期限とする
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + 2);
          
          // 未請求の請求書データを作成
          const unpaidInvoice = {
            ...templateInvoice,
            id: `unpaid-demo-${Date.now()}`,
            invoiceNumber: `INV-UNPAID-${Date.now().toString().slice(-6)}`,
            status: InvoiceStatus.UNPAID,
            issueDate: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            customerName: '未請求サンプル株式会社',
            subtotal: 34650,
            taxTotal: 3465,
            total: 38115
          };
          
          // モックの請求書追加API呼び出し
          console.log('未請求のデモデータを追加しました', unpaidInvoice);
          
          // 注: 実際のプロダクションではAPIを呼び出し、サーバーに保存します
          // ここではフロントエンドのステートを直接更新する簡易的な実装
          useInvoiceStore.setState({
            invoices: [unpaidInvoice, ...currentInvoices]
          });
        } catch (error) {
          console.error('デモデータの追加に失敗しました', error);
        }
      }
    };
    
    // デモデータの追加を少し遅延させる（データ取得後に実行するため）
    const timer = setTimeout(addUnpaidDemoData, 1500);
    
    // クリーンアップ関数でタイマーをクリア
    return () => clearTimeout(timer);
  }, []); // 空の依存配列で初回レンダリング時のみ実行
  
  // 検索とフィルタリング
  useEffect(() => {
    const options: InvoiceFilterOptions = {};
    
    if (statusFilter !== 'all') {
      options.status = statusFilter;
    }
    
    if (startDate) {
      options.startDate = startDate;
    }
    
    if (endDate) {
      options.endDate = endDate;
    }
    
    if (searchTerm) {
      options.customerName = searchTerm;
    }
    
    setFilterOptions(options);
  }, [statusFilter, startDate, endDate, searchTerm, setFilterOptions]);
  
  // フィルターをリセット - 日付は2ヶ月前から現在まで
  const handleResetFilters = () => {
    setStatusFilter('all');
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    setStartDate(twoMonthsAgo.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSearchTerm('');
    
    const options: InvoiceFilterOptions = {
      startDate: twoMonthsAgo.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
    setFilterOptions(options);
  };
  
  // 請求書ステータスの更新
  const handleUpdateStatus = async (invoiceId: string, newStatus: InvoiceStatus, skipConfirmation = false) => {
    try {
      // ステータス変更の確認ダイアログ
      const statusMessages = {
        [InvoiceStatus.UNPAID]: '未請求',
        [InvoiceStatus.ISSUED]: '請求済み',
        [InvoiceStatus.PAID]: '支払済み',
        [InvoiceStatus.OVERDUE]: '期限超過',
        [InvoiceStatus.CANCELED]: 'キャンセル済み'
      };
      
      // skipConfirmation=trueの場合は確認ダイアログをスキップ
      let shouldProceed = skipConfirmation;
      
      if (!skipConfirmation) {
        // skipConfirmationがfalseの場合のみ確認メッセージを表示
        shouldProceed = window.confirm(`この請求書を「${statusMessages[newStatus]}」に変更してもよろしいですか？`);
      }
      
      // キャンセルされた場合は処理を中断
      if (!shouldProceed) return;
      
      await updateInvoiceStatus(invoiceId, newStatus);
      
      // 成功メッセージ
      toast.success(`請求書を${statusMessages[newStatus]}に更新しました`);
      
      // モーダルが開いている場合は更新して閉じる
      if (selectedInvoice?.id === invoiceId) {
        const updatedInvoice = invoices.find(inv => inv.id === invoiceId);
        if (updatedInvoice) {
          setSelectedInvoice(updatedInvoice);
        }
        // ステータス変更後にモーダルを閉じる
        setShowInvoiceModal(false);
      }
    } catch (error) {
      toast.error('ステータスの更新に失敗しました');
    }
  };
  
  // 請求書をキャンセル
  const handleCancelInvoice = async (invoiceId: string) => {
    if (window.confirm('この請求書をキャンセルしてもよろしいですか？')) {
      try {
        await cancelInvoice(invoiceId);
        toast.success('請求書をキャンセルしました');
        
        // モーダルが開いている場合は閉じる
        if (selectedInvoice?.id === invoiceId) {
          setShowInvoiceModal(false);
        }
      } catch (error) {
        toast.error('請求書のキャンセルに失敗しました');
      }
    }
  };
  
  // 請求書を支払済みにする
  const handleMarkAsPaid = async (invoiceId: string) => {
    if (window.confirm('この請求書を支払済みに変更してもよろしいですか？')) {
      try {
        await markAsPaid(invoiceId);
        toast.success('請求書を支払済みに更新しました');
        
        // モーダルが開いている場合は閉じる
        if (selectedInvoice?.id === invoiceId) {
          setShowInvoiceModal(false);
        }
      } catch (error) {
        toast.error('請求書の更新に失敗しました');
      }
    }
  };
  
  // 詳細モーダルを表示
  const handleViewInvoice = (invoice: Invoice) => {
    // サービス利用者データ（API連携前の固定値）
    const userData = [
      {
        name: 'サービス利用者1',
        domesticUsage: 532,
        internationalUsage: 48,
      },
      {
        name: 'サービス利用者2',
        domesticUsage: 217,
        internationalUsage: 15,
      },
      {
        name: 'サービス利用者3',
        domesticUsage: 350,
        internationalUsage: 30,
      }
    ];
    
    // 国内・海外SMS使用量の合計を計算
    const totalDomesticUsage = userData.reduce((sum, u) => sum + u.domesticUsage, 0); // 1099になる
    const totalInternationalUsage = userData.reduce((sum, u) => sum + u.internationalUsage, 0); // 93になる
    
    // 単価設定
    const domesticUnitPrice = 3;
    const internationalUnitPrice = 10;
    
    // 金額計算
    const domesticAmount = totalDomesticUsage * domesticUnitPrice;
    const internationalAmount = totalInternationalUsage * internationalUnitPrice;
    
    setSelectedInvoice(invoice);
    // 拡張情報をリセット
    setInvoiceExtendedInfo({
      customerAddress: '',
      customerPhone: '',
      customerEmail: '',
      companyName: 'Topaz合同会社',
      companyAddress: '〒150-0001\n東京都千代田区',
      companyPhone: '03-1234-5678',
      companyEmail: 'contact@topaz.jp'
    });
    
    // 請求書に必ず国内SMSと海外SMSの項目があるか確認し、なければ追加
    const hasNationalSms = invoice.items.some(item => item.name === '国内SMS送信');
    const hasInternationalSms = invoice.items.some(item => item.name === '海外SMS送信');
    
    const updatedItems = [...invoice.items];
    
    if (!hasNationalSms) {
      // 国内SMS送信の項目を追加 - 利用者別内訳の合計と一致させる
      updatedItems.push({
        id: `domestic-${Date.now()}`,
        name: '国内SMS送信',
        description: '国内SMS送信料金',
        quantity: totalDomesticUsage, // 1099
        unitPrice: domesticUnitPrice,
        taxRate: 10,
        amount: domesticAmount,
        taxAmount: Math.floor(domesticAmount * 0.1)
      });
    } else {
      // 既存の国内SMS項目を更新
      const index = updatedItems.findIndex(item => item.name === '国内SMS送信');
      if (index !== -1) {
        updatedItems[index] = {
          ...updatedItems[index],
          quantity: totalDomesticUsage, // 1099
          unitPrice: domesticUnitPrice,
          amount: domesticAmount, 
          taxAmount: Math.floor(domesticAmount * 0.1)
        };
      }
    }
    
    if (!hasInternationalSms) {
      // 海外SMS送信の項目を追加 - 利用者別内訳の合計と一致させる
      updatedItems.push({
        id: `international-${Date.now()}`,
        name: '海外SMS送信',
        description: '海外SMS送信料金',
        quantity: totalInternationalUsage, // 93
        unitPrice: internationalUnitPrice,
        taxRate: 10,
        amount: internationalAmount,
        taxAmount: Math.floor(internationalAmount * 0.1)
      });
    } else {
      // 既存の海外SMS項目を更新
      const index = updatedItems.findIndex(item => item.name === '海外SMS送信');
      if (index !== -1) {
        updatedItems[index] = {
          ...updatedItems[index],
          quantity: totalInternationalUsage, // 93
          unitPrice: internationalUnitPrice,
          amount: internationalAmount,
          taxAmount: Math.floor(internationalAmount * 0.1)
        };
      }
    }
    
    // 小計、税額、合計を再計算
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxTotal;
    
    setSelectedInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      taxTotal,
      total
    });
    
    setShowInvoiceModal(true);
  };
  
  // 口座種別の表示用変換
  const getAccountTypeLabel = (type?: string): string => {
    switch (type) {
      case 'ordinary': return '普通';
      case 'checking': return '当座';
      default: return type || '';
    }
  };
  
  // 請求書のダウンロード
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      console.log('PDF出力処理を開始', { invoiceId });
      
      const selectedInv = invoices.find(inv => inv.id === invoiceId);
      
      if (!selectedInv) {
        throw new Error('請求書データが見つかりません');
      }
      
      // PDFデータを準備
      const isForTenant = selectedInv.customerId.includes('tenant');
      const isForUser = !isForTenant && selectedInv.tenantId !== 'system';
      
      // 国内・海外SMS項目を取得
      const domesticSmsItem = selectedInv.items.find(i => i.name === '国内SMS送信');
      const internationalSmsItem = selectedInv.items.find(i => i.name === '海外SMS送信');
      
      // 利用者情報を取得（実際のAPIに置き換え）
      const userDetails: UserDetail[] = isForTenant ? [
        { name: 'サービス利用者1', domesticUsage: 532, internationalUsage: 48, domesticPrice: 3, internationalPrice: 10 },
        { name: 'サービス利用者2', domesticUsage: 217, internationalUsage: 15, domesticPrice: 3, internationalPrice: 10 },
        { name: 'サービス利用者3', domesticUsage: 350, internationalUsage: 30, domesticPrice: 3, internationalPrice: 10 }
      ] : [];
      
      // 合計計算
      const totalDomesticUsage = isForTenant ? userDetails.reduce((sum, u) => sum + u.domesticUsage, 0) : (domesticSmsItem?.quantity || 0);
      const totalInternationalUsage = isForTenant ? userDetails.reduce((sum, u) => sum + u.internationalUsage, 0) : (internationalSmsItem?.quantity || 0);
      
      const domesticPrice = domesticSmsItem?.unitPrice || 3;
      const internationalPrice = internationalSmsItem?.unitPrice || 10;
      
      // 金額計算
      const totalDomesticAmount = totalDomesticUsage * domesticPrice;
      const totalInternationalAmount = totalInternationalUsage * internationalPrice;
      
      // 利用者別の金額を計算
      if (userDetails.length > 0) {
        userDetails.forEach(user => {
          user.domesticAmount = user.domesticUsage * user.domesticPrice;
          user.internationalAmount = user.internationalUsage * user.internationalPrice;
          user.total = user.domesticAmount + user.internationalAmount;
        });
      }
      
      // 一時的なHTMLコンテナを作成
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // 請求書HTMLを構築
      container.innerHTML = `
        <div id="pdf-container" style="width: 210mm; padding: 20mm; font-family: sans-serif; font-size: 12px;">
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px;">請求書</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">請求先</div>
              <div>${selectedInv.customerName}</div>
              <div>${invoiceExtendedInfo.customerAddress || ''}</div>
              <div>TEL: ${invoiceExtendedInfo.customerPhone || ''}</div>
              <div>Email: ${invoiceExtendedInfo.customerEmail || ''}</div>
            </div>
            
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">請求元</div>
              <div>${invoiceExtendedInfo.companyName || 'Topaz合同会社'}</div>
              <div>${(invoiceExtendedInfo.companyAddress || '〒150-0001\n東京都千代田区').replace('\n', '<br>')}</div>
              <div>TEL: ${invoiceExtendedInfo.companyPhone || '03-1234-5678'}</div>
              <div>Email: ${invoiceExtendedInfo.companyEmail || 'contact@topaz.jp'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="text-align: left; padding: 5px; background-color: #f2f2f2;">請求書番号</th>
                <td style="padding: 5px;">${selectedInv.invoiceNumber}</td>
                <th style="text-align: left; padding: 5px; background-color: #f2f2f2;">発行日</th>
                <td style="padding: 5px;">${formatDate(selectedInv.issueDate)}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 5px; background-color: #f2f2f2;">対象期間</th>
                <td style="padding: 5px;">${formatDate(selectedInv.periodStart)} 〜 ${formatDate(selectedInv.periodEnd)}</td>
                <th style="text-align: left; padding: 5px; background-color: #f2f2f2;">支払期限</th>
                <td style="padding: 5px;">${formatDate(selectedInv.dueDate)}</td>
              </tr>
            </table>
          </div>
          
          <div style="font-size: 18px; font-weight: bold; color: #1a56db; padding: 10px; background: #e1effe; border-radius: 5px; margin: 15px 0;">
            ご請求金額: ${formatCurrency(selectedInv.total)}（税込）
          </div>
          
          <div style="font-size: 14px; font-weight: bold; margin: 15px 0 5px 0;">請求明細</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">項目</th>
                <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">数量</th>
                <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">単価</th>
                <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">金額</th>
              </tr>
            </thead>
            <tbody>
              ${selectedInv.items.map(item => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity.toLocaleString()}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.unitPrice)}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">小計</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(selectedInv.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">消費税（10%）</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(selectedInv.taxTotal)}</td>
              </tr>
              <tr style="font-weight: bold; background-color: #f9fafb;">
                <td colspan="3" style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">合計（税込）</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(selectedInv.total)}</td>
              </tr>
            </tfoot>
          </table>
          
          ${isForTenant ? `
            <div style="margin-top: 20px;">
              <div style="font-size: 14px; font-weight: bold; margin: 15px 0 5px 0;">サービス利用者別内訳</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr>
                    <th style="padding: 8px; text-align: left; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">ユーザー名</th>
                    <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">国内SMS数</th>
                    <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">国内SMS金額</th>
                    <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">海外SMS数</th>
                    <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">海外SMS金額</th>
                    <th style="padding: 8px; text-align: right; background-color: #f2f2f2; border-bottom: 1px solid #ddd;">合計</th>
                  </tr>
                </thead>
                <tbody>
                  ${userDetails.map(user => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.name}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${user.domesticUsage.toLocaleString()}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(user.domesticAmount || 0)}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${user.internationalUsage.toLocaleString()}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(user.internationalAmount || 0)}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(user.total || 0)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background-color: #f9fafb;">
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">合計</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalDomesticUsage.toLocaleString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(totalDomesticAmount)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalInternationalUsage.toLocaleString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(totalInternationalAmount)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(totalDomesticAmount + totalInternationalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px;">
            <div style="margin-top: 20px;">
              <div style="font-size: 14px; font-weight: bold; margin: 15px 0 5px 0;">お振込先</div>
              <div>銀行名: ${selectedInv.bankInfo?.bankName || ''}</div>
              <div>支店名: ${selectedInv.bankInfo?.branchName || ''}</div>
              <div>口座種別: ${getAccountTypeLabel(selectedInv.bankInfo?.accountType)}</div>
              <div>口座番号: ${selectedInv.bankInfo?.accountNumber || ''}</div>
              <div>口座名義: ${selectedInv.bankInfo?.accountHolder || ''}</div>
            </div>
            
            <div style="margin-top: 20px; white-space: pre-line;">
              ${selectedInv.notes || "※お支払いは請求書に記載の銀行口座にお振込みください。\n※振込手数料は貴社にてご負担をお願いいたします。\n※ご不明な点がございましたら、お気軽にお問い合わせください。"}
            </div>
          </div>
        </div>
      `;
      
      // ローディング表示
      toast.loading('PDF生成中...', { id: 'pdf-loading' });
      
      try {
        // html2canvasを使用してHTML要素をキャンバスに変換
        const element = container.querySelector('#pdf-container');
        if (!element) throw new Error('PDF生成用の要素が見つかりません');
        
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2, // 高解像度化
          useCORS: true,
          logging: false
        });
        
        // A4サイズのPDFを作成
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        // キャンバスの縦横比を維持しながらPDFに配置
        const imgWidth = 210; // A4幅
        const pageHeight = 297; // A4高さ
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // 最初のページに画像を追加
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // 複数ページが必要な場合、ページを追加
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // PDFをダウンロード
        pdf.save(`請求書_${selectedInv.invoiceNumber}.pdf`);
        
        // 一時コンテナを削除
        document.body.removeChild(container);
        
        // トーストを表示
        toast.success('PDFをダウンロードしました', { id: 'pdf-loading' });
      } catch (error) {
        console.error('PDF生成エラー:', error);
        toast.error('PDF生成中にエラーが発生しました', { id: 'pdf-loading' });
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('PDF出力エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDF出力中に問題が発生しました';
      toast.error(`PDF出力に失敗しました: ${errorMessage}`);
    }
  };
  
  // 請求書送信（メール送信画面への遷移）
  const handleSendInvoice = (invoice: Invoice) => {
    toast.success('メール送信画面を開きます');
    // TODO: メール送信画面への遷移
  };
  
  // ソート処理
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    // TODO: ソート処理を実装
  };
  
  // 表示用ステータスのラベルを取得
  const getStatusLabel = (status: InvoiceStatus): string => {
    const labels = {
      [InvoiceStatus.UNPAID]: '未請求',
      [InvoiceStatus.ISSUED]: '請求済み',
      [InvoiceStatus.PAID]: '支払済み',
      [InvoiceStatus.OVERDUE]: '期限超過',
      [InvoiceStatus.CANCELED]: 'キャンセル済み'
    };
    return labels[status];
  };
  
  // ステータスに応じたバッジスタイルを取得
  const getStatusBadgeClass = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-success-100 text-success-800';
      case InvoiceStatus.ISSUED:
        return 'bg-primary-100 text-primary-800';
      case InvoiceStatus.UNPAID:
        return 'bg-grey-100 text-grey-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-error-100 text-error-800';
      case InvoiceStatus.CANCELED:
        return 'bg-grey-100 text-grey-500';
      default:
        return 'bg-grey-100 text-grey-800';
    }
  };
  
  // ステータスに応じたアイコンを取得
  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case InvoiceStatus.ISSUED:
        return <FileText className="h-4 w-4 text-primary-600" />;
      case InvoiceStatus.UNPAID:
        return <Clock className="h-4 w-4 text-grey-600" />;
      case InvoiceStatus.OVERDUE:
        return <AlertCircle className="h-4 w-4 text-error-600" />;
      case InvoiceStatus.CANCELED:
        return <XCircle className="h-4 w-4 text-grey-500" />;
      default:
        return <FileText className="h-4 w-4 text-grey-600" />;
    }
  };
  
  // 金額をフォーマット
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
  };
  
  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // ページネーション
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 一覧表示のダウンロードアイコンを削除
  // 修正: グリッドビューのダウンロードボタンを削除
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginatedInvoices.map((invoice) => (
        <div
          key={invoice.id}
          className="bg-white rounded-lg border hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => handleViewInvoice(invoice)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">{invoice.customerName}</h3>
                <p className="text-sm text-grey-500">{invoice.invoiceNumber}</p>
                {/* テナント管理者/利用者の区別表示 */}
                <p className="text-xs text-grey-400 mt-1">
                  {invoice.tenantId === 'system' ? 'システム管理者向け' : 
                   invoice.customerId.includes('tenant') ? 'テナント管理者向け' : '利用者向け'}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(invoice.status)}
                <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                  {getStatusLabel(invoice.status)}
                </span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-grey-500">請求額:</span>
                <span className="text-sm font-medium">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grey-500">請求日:</span>
                <span className="text-sm">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grey-500">支払期限:</span>
                <span className="text-sm">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
              {invoice.status === InvoiceStatus.UNPAID ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(invoice.id, InvoiceStatus.ISSUED, false);
                  }}
                  className="btn-sm btn-primary"
                >
                  請求する
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewInvoice(invoice);
                  }}
                  className="btn-sm btn-secondary"
                >
                  詳細
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 修正: リストビューのダウンロードボタンを削除
  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-grey-200">
        <thead className="bg-grey-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('invoiceNumber')}
            >
              <div className="flex items-center">
                請求書番号
                {sortField === 'invoiceNumber' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('customerName')}
            >
              <div className="flex items-center">
                顧客名
                {sortField === 'customerName' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('issueDate')}
            >
              <div className="flex items-center">
                発行日
                {sortField === 'issueDate' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('dueDate')}
            >
              <div className="flex items-center">
                支払期限
                {sortField === 'dueDate' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('total')}
            >
              <div className="flex items-center">
                金額
                {sortField === 'total' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                ステータス
                {sortField === 'status' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
            >
              請求書種別
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-grey-200">
          {paginatedInvoices.map((invoice) => (
            <tr 
              key={invoice.id} 
              className="hover:bg-grey-50 cursor-pointer"
              onClick={() => handleViewInvoice(invoice)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-grey-900">{invoice.invoiceNumber}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-grey-900">{invoice.customerName}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-grey-500">{formatDate(invoice.issueDate)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-grey-500">{formatDate(invoice.dueDate)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium">{formatCurrency(invoice.total)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(invoice.status)}
                  <span className={`ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-xs px-2 py-1 rounded-full bg-grey-100 text-grey-800">
                  {invoice.tenantId === 'system' ? 'システム管理者' : 
                   invoice.customerId.includes('tenant') ? 'テナント管理者' : '利用者'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {invoice.status === InvoiceStatus.UNPAID && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(invoice.id, InvoiceStatus.ISSUED, false);
                      }}
                      className="btn-xs btn-primary"
                      title="請求する"
                    >
                      請求する
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  // カスタム請求書項目を追加
  const handleAddCustomItem = () => {
    if (!selectedInvoice) return;
    
    // 税金計算のための処理を追加
    const newItem: InvoiceItem = {
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
      amount: 0,
      taxAmount: 0 // 必須フィールド
    };
    
    // 計算処理
    newItem.amount = newItem.quantity * newItem.unitPrice;
    newItem.taxAmount = Math.floor(newItem.amount * (newItem.taxRate / 100));
    
    setSelectedInvoice({
      ...selectedInvoice,
      items: [...selectedInvoice.items, newItem]
    });
    
    // 合計を再計算
    recalculateInvoice(selectedInvoice.items.concat(newItem));
  };

  // 請求書合計の再計算
  const recalculateInvoice = (items: InvoiceItem[]) => {
    if (!selectedInvoice) return;
    
    const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0);
    const taxTotal = items.reduce((sum: number, item: InvoiceItem) => sum + item.taxAmount, 0);
    const total = subtotal + taxTotal;
    
    setSelectedInvoice({
      ...selectedInvoice,
      subtotal,
      taxTotal,
      total
    });
  };
  
  // 請求明細部分のJSXを改善
  const renderInvoiceItems = () => {
    if (!selectedInvoice) return null;
    
    return (
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">請求明細</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">項目</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">数量</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">単価</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">金額</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedInvoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.name === '' ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...selectedInvoice.items];
                            newItems[index] = { ...newItems[index], name: e.target.value };
                            setSelectedInvoice({ ...selectedInvoice, items: newItems });
                          }}
                          className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="項目名"
                        />
                      ) : (
                        item.name
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = Number(e.target.value);
                        const newAmount = newQuantity * item.unitPrice;
                        const newTaxAmount = Math.floor(newAmount * (item.taxRate / 100));
                        
                        const newItems = [...selectedInvoice.items];
                        newItems[index] = {
                          ...newItems[index],
                          quantity: newQuantity,
                          amount: newAmount,
                          taxAmount: newTaxAmount
                        };
                        
                        setSelectedInvoice({
                          ...selectedInvoice,
                          items: newItems
                        });
                        
                        recalculateInvoice(newItems);
                      }}
                      className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newUnitPrice = Number(e.target.value);
                        const newAmount = item.quantity * newUnitPrice;
                        const newTaxAmount = Math.floor(newAmount * (item.taxRate / 100));
                        
                        const newItems = [...selectedInvoice.items];
                        newItems[index] = {
                          ...newItems[index],
                          unitPrice: newUnitPrice,
                          amount: newAmount,
                          taxAmount: newTaxAmount
                        };
                        
                        setSelectedInvoice({
                          ...selectedInvoice,
                          items: newItems
                        });
                        
                        recalculateInvoice(newItems);
                      }}
                      className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      min="0"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">小計</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">消費税（10%）</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(selectedInvoice.taxTotal)}</td>
              </tr>
              <tr className="bg-blue-50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">合計（税込）</td>
                <td className="px-4 py-3 text-right text-base font-bold text-blue-700">{formatCurrency(selectedInvoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            カスタム項目を追加
          </button>
        </div>
      </div>
    );
  };

  // テナント管理者向けの内訳表示を改善
  const renderUserBreakdown = () => {
    if (!selectedInvoice || !(user?.role === 'SYSTEM_ADMIN' || user?.role === 'TENANT_ADMIN') || !selectedInvoice.customerId.includes('tenant')) {
      return null;
    }
    
    // 国内・海外SMS項目を取得
    const domesticSmsItem = selectedInvoice.items.find(i => i.name === '国内SMS送信');
    const internationalSmsItem = selectedInvoice.items.find(i => i.name === '海外SMS送信');
    
    const domesticPrice = domesticSmsItem?.unitPrice || 3;
    const internationalPrice = internationalSmsItem?.unitPrice || 10;
    
    // サンプルユーザーデータ（固定値）
    const userData = [
      {
        name: 'サービス利用者1',
        domesticUsage: 532,
        domesticPrice: domesticPrice,
        domesticAmount: Math.floor(532 * domesticPrice),
        internationalUsage: 48,
        internationalPrice: internationalPrice,
        internationalAmount: Math.floor(48 * internationalPrice),
        total: Math.floor(532 * domesticPrice) + Math.floor(48 * internationalPrice)
      },
      {
        name: 'サービス利用者2',
        domesticUsage: 217,
        domesticPrice: domesticPrice,
        domesticAmount: Math.floor(217 * domesticPrice),
        internationalUsage: 15,
        internationalPrice: internationalPrice,
        internationalAmount: Math.floor(15 * internationalPrice),
        total: Math.floor(217 * domesticPrice) + Math.floor(15 * internationalPrice)
      },
      {
        name: 'サービス利用者3',
        domesticUsage: 350,
        domesticPrice: domesticPrice,
        domesticAmount: Math.floor(350 * domesticPrice),
        internationalUsage: 30,
        internationalPrice: internationalPrice,
        internationalAmount: Math.floor(30 * internationalPrice),
        total: Math.floor(350 * domesticPrice) + Math.floor(30 * internationalPrice)
      }
    ];
    
    // 合計計算
    const totalDomesticUsage = userData.reduce((sum, u) => sum + u.domesticUsage, 0);
    const totalDomesticAmount = userData.reduce((sum, u) => sum + u.domesticAmount, 0);
    const totalInternationalUsage = userData.reduce((sum, u) => sum + u.internationalUsage, 0);
    const totalInternationalAmount = userData.reduce((sum, u) => sum + u.internationalAmount, 0);
    const totalAmount = totalDomesticAmount + totalInternationalAmount;
    
    return (
      <div className="mb-8 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">サービス利用者別内訳</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">国内SMS数</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">国内SMS金額</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">海外SMS数</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">海外SMS金額</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userData.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-gray-900">{user.domesticUsage}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-gray-900">{formatCurrency(user.domesticAmount).replace('¥', '')}円</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-gray-900">{user.internationalUsage}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-gray-900">{formatCurrency(user.internationalAmount).replace('¥', '')}円</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(user.total).replace('¥', '')}円</div>
                  </td>
                </tr>
              ))}

              {/* 内訳合計行 */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-3 text-sm text-gray-900">合計</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{totalDomesticUsage}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totalDomesticAmount).replace('¥', '')}円</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{totalInternationalUsage}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totalInternationalAmount).replace('¥', '')}円</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(totalAmount).replace('¥', '')}円</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-grey-900">請求管理</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-grey-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">請求書一覧</h2>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-grey-400" />
                </div>
                <input
                  type="search"
                  placeholder="顧客名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                  onClick={() => setViewMode('grid')}
                  title="グリッド表示"
                >
                  <Grid className="h-5 w-5 text-grey-700" />
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                  onClick={() => setViewMode('list')}
                  title="リスト表示"
                >
                  <List className="h-5 w-5 text-grey-700" />
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                  onClick={() => setViewMode('kanban')}
                  title="カンバン表示"
                >
                  <Columns className="h-5 w-5 text-grey-700" />
                </button>
              </div>
              
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                フィルター
              </button>
            </div>
            
            <Link to="/dashboard/invoices/new" className="btn-secondary flex items-center gap-2 ml-4">
              <Plus className="h-4 w-4" />
              新規作成
            </Link>
          </div>
          
          {showFilters && (
            <div className="bg-grey-50 p-4 rounded-lg mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">ステータス</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                    className="form-select w-full"
                  >
                    <option value="all">すべて</option>
                    <option value={InvoiceStatus.UNPAID}>未請求</option>
                    <option value={InvoiceStatus.ISSUED}>請求済み</option>
                    <option value={InvoiceStatus.PAID}>支払済み</option>
                    <option value={InvoiceStatus.OVERDUE}>期限超過</option>
                    <option value={InvoiceStatus.CANCELED}>キャンセル済み</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={handleResetFilters}
                >
                  フィルターをリセット
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-error-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-grey-900">エラーが発生しました</h3>
              <p className="mt-1 text-sm text-grey-500">{error}</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-grey-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium">請求書が見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                検索条件に一致する請求書がありません
              </p>
            </div>
          ) : viewMode === 'kanban' ? (
            <InvoiceKanbanView
              invoices={invoices}
              onUpdateStatus={handleUpdateStatus}
              onViewInvoice={handleViewInvoice}
              onDownloadInvoice={handleDownloadInvoice}
              getStatusLabel={getStatusLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ) : viewMode === 'grid' ? renderGridView() : renderListView()}
        </div>
        
        {invoices.length > 0 && viewMode !== 'kanban' && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-grey-500">
              全 {invoices.length} 件中 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, invoices.length)} 件を表示
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm px-2 py-1 disabled:opacity-50"
              >
                前へ
              </button>
              <span className="text-sm text-grey-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm px-2 py-1 disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 請求書詳細モーダル */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto my-8 overflow-hidden relative">
            <div className="overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex justify-between items-start sticky top-0 bg-white pb-4 mb-4 border-b z-10">
                  <h2 className="text-lg font-medium">請求書の編集</h2>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-grey-400 hover:text-grey-500 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* 請求書種別表示 */}
                <div className="mb-4 bg-grey-50 p-3 rounded-md text-sm">
                  <span className="font-medium">請求書種別: </span>
                  <span className="inline-block ml-2 px-2 py-1 rounded-full bg-grey-100 text-grey-800">
                    {selectedInvoice.tenantId === 'system' ? 'システム管理者向け' : 
                     selectedInvoice.customerId.includes('tenant') ? 'テナント管理者向け' : '利用者向け'}
                  </span>
                </div>
                
                <div className="space-y-6">
                  {/* 請求先情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                    {/* 左側: 請求先情報 */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">請求先情報</h4>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">会社名</label>
                        <input
                          type="text"
                          value={selectedInvoice.customerName}
                          onChange={(e) => {
                            setSelectedInvoice({
                              ...selectedInvoice,
                              customerName: e.target.value
                            });
                          }}
                          className="text-lg font-semibold w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">住所</label>
                        <textarea
                          value={invoiceExtendedInfo.customerAddress || ''}
                          onChange={(e) => {
                            setInvoiceExtendedInfo({
                              ...invoiceExtendedInfo,
                              customerAddress: e.target.value
                            });
                          }}
                          rows={3}
                          className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="〒100-0001&#10;東京都千代田区"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                          <input
                            type="text"
                            value={invoiceExtendedInfo.customerPhone || ''}
                            onChange={(e) => {
                              setInvoiceExtendedInfo({
                                ...invoiceExtendedInfo,
                                customerPhone: e.target.value
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="03-1234-5678"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">メールアドレス</label>
                          <input
                            type="email"
                            value={invoiceExtendedInfo.customerEmail || ''}
                            onChange={(e) => {
                              setInvoiceExtendedInfo({
                                ...invoiceExtendedInfo,
                                customerEmail: e.target.value
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="contact@example.jp"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 右側: 発行日・請求元情報 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">請求元・請求情報</h4>
                      <div className="mb-4 space-y-2">
                        <div className="flex flex-wrap items-center space-x-2 mb-2">
                          <label className="text-xs text-gray-500 min-w-[100px]">請求書番号：</label>
                          <input
                            type="text"
                            value={selectedInvoice.invoiceNumber}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                invoiceNumber: e.target.value
                              });
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex flex-wrap items-center space-x-2">
                          <label className="text-xs text-gray-500 min-w-[100px]">発行日：</label>
                          <input
                            type="date"
                            value={selectedInvoice.issueDate}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                issueDate: e.target.value
                              });
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs text-gray-500 mb-1">会社名</label>
                        <input
                          type="text"
                          value={invoiceExtendedInfo.companyName || "Topaz合同会社"}
                          onChange={(e) => {
                            setInvoiceExtendedInfo({
                              ...invoiceExtendedInfo,
                              companyName: e.target.value
                            });
                          }}
                          className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                        />
                        <label className="block text-xs text-gray-500 mb-1">住所</label>
                        <textarea
                          value={invoiceExtendedInfo.companyAddress || "〒150-0001\n東京都千代田区"}
                          onChange={(e) => {
                            setInvoiceExtendedInfo({
                              ...invoiceExtendedInfo,
                              companyAddress: e.target.value
                            });
                          }}
                          className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                            <input
                              type="text"
                              value={invoiceExtendedInfo.companyPhone || "03-1234-5678"}
                              onChange={(e) => {
                                setInvoiceExtendedInfo({
                                  ...invoiceExtendedInfo,
                                  companyPhone: e.target.value
                                });
                              }}
                              className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">メールアドレス</label>
                            <input
                              type="email"
                              value={invoiceExtendedInfo.companyEmail || "contact@topaz.jp"}
                              onChange={(e) => {
                                setInvoiceExtendedInfo({
                                  ...invoiceExtendedInfo,
                                  companyEmail: e.target.value
                                });
                              }}
                              className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 請求金額 */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
                    <h4 className="text-base font-semibold text-gray-700 mb-2">ご請求金額</h4>
                    <div className="text-3xl font-bold text-blue-700">
                      {formatCurrency(selectedInvoice.total)}
                      <span className="text-lg ml-1 text-blue-500">（税込）</span>
                    </div>
                  </div>

                  {/* 請求期間とお支払期限 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">対象期間</h4>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <input
                          type="date"
                          value={selectedInvoice.periodStart}
                          onChange={(e) => {
                            setSelectedInvoice({
                              ...selectedInvoice,
                              periodStart: e.target.value
                            });
                          }}
                          className="col-span-2 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="text-center">〜</div>
                        <input
                          type="date"
                          value={selectedInvoice.periodEnd}
                          onChange={(e) => {
                            setSelectedInvoice({
                              ...selectedInvoice,
                              periodEnd: e.target.value
                            });
                          }}
                          className="col-span-2 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">お支払期限</h4>
                      <input
                        type="date"
                        value={selectedInvoice.dueDate}
                        onChange={(e) => {
                          setSelectedInvoice({
                            ...selectedInvoice,
                            dueDate: e.target.value
                          });
                        }}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 請求内容テーブル */}
                  {renderInvoiceItems()}

                  {/* サービス利用者別内訳テーブル */}
                  {renderUserBreakdown()}

                  {/* お振込先情報 */}
                  <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">お振込先</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">銀行名</label>
                          <input
                            type="text"
                            value={selectedInvoice.bankInfo?.bankName || ''}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                bankInfo: {
                                  ...(selectedInvoice.bankInfo || {}),
                                  bankName: e.target.value
                                }
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="○○銀行"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">支店名</label>
                          <input
                            type="text"
                            value={selectedInvoice.bankInfo?.branchName || ''}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                bankInfo: {
                                  ...(selectedInvoice.bankInfo || {}),
                                  branchName: e.target.value
                                }
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="○○支店"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">口座種別</label>
                          <select
                            value={selectedInvoice.bankInfo?.accountType || 'ordinary'}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                bankInfo: {
                                  ...(selectedInvoice.bankInfo || {}),
                                  accountType: e.target.value as 'ordinary' | 'checking'
                                }
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="ordinary">普通</option>
                            <option value="checking">当座</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">口座番号</label>
                          <input
                            type="text"
                            value={selectedInvoice.bankInfo?.accountNumber || ''}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                bankInfo: {
                                  ...(selectedInvoice.bankInfo || {}),
                                  accountNumber: e.target.value
                                }
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="1234567"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">口座名義</label>
                          <input
                            type="text"
                            value={selectedInvoice.bankInfo?.accountHolder || ''}
                            onChange={(e) => {
                              setSelectedInvoice({
                                ...selectedInvoice,
                                bankInfo: {
                                  ...(selectedInvoice.bankInfo || {}),
                                  accountHolder: e.target.value
                                }
                              });
                            }}
                            className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Topaz合同会社"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 備考 */}
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">備考</h4>
                    <textarea
                      value={selectedInvoice.notes || "※お支払いは請求書に記載の銀行口座にお振込みください。\n※振込手数料は貴社にてご負担をお願いいたします。\n※ご不明な点がございましたら、お気軽にお問い合わせください。"}
                      onChange={(e) => {
                        setSelectedInvoice({
                          ...selectedInvoice,
                          notes: e.target.value
                        });
                      }}
                      rows={4}
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="お支払いに関する注意事項などを記載してください"
                    />
                  </div>

                  {/* 操作ボタン */}
                  <div className="flex justify-end items-center space-x-3 pt-4 mt-8 border-t">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    
                    {/* ステータスボタン - ユーザーロールに応じて表示を変更 */}
                    <div className="inline-flex gap-2">
                      {user?.role === 'SYSTEM_ADMIN' && (
                        <>
                          {selectedInvoice.status === InvoiceStatus.UNPAID && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedInvoice.id, InvoiceStatus.ISSUED, false)}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                            >
                              請求する
                            </button>
                          )}
                          {selectedInvoice.status === InvoiceStatus.ISSUED && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-700 transition-colors"
                            >
                              支払済みにする
                            </button>
                          )}
                          {(selectedInvoice.status === InvoiceStatus.UNPAID || selectedInvoice.status === InvoiceStatus.ISSUED) && (
                            <button
                              type="button"
                              onClick={() => handleCancelInvoice(selectedInvoice.id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-md hover:bg-error-700 transition-colors"
                            >
                              キャンセルする
                            </button>
                          )}
                        </>
                      )}
                      
                      {user?.role === 'TENANT_ADMIN' && (
                        <>
                          {selectedInvoice.status === InvoiceStatus.ISSUED && (
                            <button
                              type="button"
                              onClick={() => {
                                // 請求書受領API呼び出し
                                toast.success('請求書を受領しました');
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                            >
                              請求書を受領する
                            </button>
                          )}
                        </>
                      )}
                      
                      {user?.role === 'END_USER' && (
                        <>
                          {selectedInvoice.status === InvoiceStatus.ISSUED && (
                            <button
                              type="button"
                              onClick={() => {
                                // 請求書受領API呼び出し
                                toast.success('請求書を受領しました');
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                            >
                              請求書を受領する
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* 保存ボタン - すべてのユーザーで表示 */}
                    <button
                      type="button"
                      onClick={() => {
                        // 請求書更新API呼び出し
                        toast.success('請求書を保存しました');
                        setShowInvoiceModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      保存
                    </button>
                    
                    {/* PDFエクスポートボタン - すべてのユーザーで表示 */}
                    <button
                      type="button"
                      onClick={() => {
                        // PDF出力機能の呼び出し
                        handleDownloadInvoice(selectedInvoice.id);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDFエクスポート
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InvoiceManagement; 