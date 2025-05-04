import React, { useState, Fragment, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, CheckCircle2, Clock, AlertCircle, Edit2, Plus } from 'lucide-react';
import { BillingUser, BillingHistory } from '../../store/billingStore';
import { useBillingStore } from '../../store/billingStore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface UserBillingDetailsProps {
  user: BillingUser;
  onClose: () => void;
}

interface EditInvoiceModalProps {
  history: BillingHistory;
  user: BillingUser;
  onClose: () => void;
  onSave: (editedHistory: BillingHistory & { invoiceDetails: InvoiceDetails }) => void;
}

export type InvoiceDetails = {
  title: string;
  invoiceNumber: string;
  billingDate: string;
  dueDate: string;
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  clientInfo: {
    name: string;
    address: string;
    tel: string;
    email: string;
  };
  companyInfo: {
    name: string;
    address: string;
    tel: string;
    email: string;
  };
  monthlyFee: number;
  domesticUsage: number;
  domesticPrice: number;
  internationalUsage: number;
  internationalPrice: number;
  userBreakdown?: {
    userId: string;
    username: string;
    domesticUsage: number;
    internationalUsage: number;
    domesticPrice: number;
    internationalPrice: number;
  }[];
  customItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  bankInfo: {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountName: string;
  };
  notes: string;
  sealImage?: string;
};

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ history, user, onClose, onSave }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [editedHistory, setEditedHistory] = useState<BillingHistory>({
    ...history,
    domesticPrice: history.domesticPrice || user.domesticSmsPrice,
    internationalPrice: history.internationalPrice || user.internationalSmsPrice
  });

  const [customItems, setCustomItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>>([]);

  const [isExporting, setIsExporting] = useState(false);

  const calculateSubtotal = () => {
    // 各単価計算を明示的に分離して計算
    const monthlyFeeTotal = Math.floor(editedHistory.monthlyFee);
    const domesticSmsTotal = Math.floor(editedHistory.domesticUsage * (editedHistory.domesticPrice || 0));
    const internationalSmsTotal = Math.floor(editedHistory.internationalUsage * (editedHistory.internationalPrice || 0));
    
    const fixedItemsTotal = monthlyFeeTotal + domesticSmsTotal + internationalSmsTotal;
    
    const customItemsTotal = customItems.reduce((sum, item) => 
      sum + Math.floor(item.quantity * item.unitPrice), 0);
    
    return fixedItemsTotal + customItemsTotal;
  };

  const calculateTax = (subtotal: number) => {
    return Math.floor(subtotal * 0.1); // 消費税10%、小数点以下切り捨て
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + calculateTax(subtotal);
  };

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    title: '請求書',
    invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${history.id}`,
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    billingPeriod: {
      startDate: new Date(history.date).toISOString().split('T')[0],
      endDate: new Date(new Date(history.date).setMonth(new Date(history.date).getMonth() + 1)).toISOString().split('T')[0],
    },
    clientInfo: {
      name: user.company,
      email: user.email,
      address: user.address || '〒000-0000\n東京都○○区○○1-1-1',
      tel: user.phoneNumber || '03-0000-0000',
    },
    companyInfo: {
      name: user.companyName || 'Topaz合同会社',
      address: user.postalCode ? `〒${user.postalCode}\n${user.address || ''}` : '〒285-0858\n千葉県佐倉市ユーカリが丘4-1-1 3F',
      tel: user.phoneNumber || '043-330-7050',
      email: user.contactEmail || 'contact@topaz.jp'
    },
    monthlyFee: user.monthlyFee || 5000, // デフォルト値を5000に設定
    domesticUsage: editedHistory.domesticUsage,
    domesticPrice: 3, // 固定値に変更
    internationalUsage: editedHistory.internationalUsage,
    internationalPrice: 10, // 固定値に変更
    userBreakdown: user.role === 'TENANT_ADMIN' ? [
      {
        userId: 'user-1',
        username: 'サービス利用者1',
        domesticUsage: 532,
        internationalUsage: 48,
        domesticPrice: 3, // 固定値に変更
        internationalPrice: 10 // 固定値に変更
      },
      {
        userId: 'user-2',
        username: 'サービス利用者2',
        domesticUsage: 217,
        internationalUsage: 15,
        domesticPrice: 3, // 固定値に変更
        internationalPrice: 10 // 固定値に変更
      },
      {
        userId: 'user-3',
        username: 'サービス利用者3',
        domesticUsage: 350,
        internationalUsage: 30,
        domesticPrice: 3, // 固定値に変更
        internationalPrice: 10 // 固定値に変更
      }
    ] : undefined,
    customItems: [],
    notes: `※お支払いは請求書に記載の銀行口座にお振込みください。
※振込手数料は貴社にてご負担をお願いいたします。
※ご不明な点がございましたら、お気軽にお問い合わせください。`,
    bankInfo: {
      bankName: '○○銀行',
      branchName: '○○支店',
      accountType: '普通',
      accountNumber: '1234567',
      accountName: 'Topaz合同会社'
    },
    sealImage: undefined
  });

  // 初期化後、内訳合計と全体値の整合性を強制的に確保
  useEffect(() => {
    if (user.role === 'TENANT_ADMIN' && invoiceDetails.userBreakdown) {
      // ユーザー内訳から合計を計算
      const totalDomesticUsage = invoiceDetails.userBreakdown.reduce(
        (sum, u) => sum + u.domesticUsage, 0
      );
      const totalInternationalUsage = invoiceDetails.userBreakdown.reduce(
        (sum, u) => sum + u.internationalUsage, 0
      );
      
      // 合計値が異なる場合は全体値を更新して一致させる
      if (invoiceDetails.domesticUsage !== totalDomesticUsage || 
          invoiceDetails.internationalUsage !== totalInternationalUsage) {
        console.info("内訳合計と請求書合計を同期します", {
          旧国内SMS合計: invoiceDetails.domesticUsage,
          新国内SMS合計: totalDomesticUsage,
          旧海外SMS合計: invoiceDetails.internationalUsage,
          新海外SMS合計: totalInternationalUsage
        });
        
        setInvoiceDetails({
          ...invoiceDetails,
          domesticUsage: totalDomesticUsage,
          internationalUsage: totalInternationalUsage
        });
        
        setEditedHistory({
          ...editedHistory,
          domesticUsage: totalDomesticUsage,
          internationalUsage: totalInternationalUsage
        });
      }
    }
  }, [invoiceDetails.userBreakdown]);

  const handleSave = () => {
    onSave({
      ...editedHistory,
      totalAmount: calculateTotal(),
      invoiceDetails: {
        ...invoiceDetails,
        customItems
      }
    });
  };

  const handleSealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setInvoiceDetails({ ...invoiceDetails, sealImage: imageUrl });
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, {
      description: '',
      quantity: 0,
      unitPrice: 0
    }]);
  };

  const updateCustomItem = (index: number, field: keyof typeof customItems[0], value: number | string) => {
    const newItems = [...customItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setCustomItems(newItems);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      console.log('PDF出力処理を開始', { invoiceId: editedHistory.id });
      
      // モック実装 - 実際のAPI呼び出しに置き換え
      await generateAndDownloadPdf(editedHistory);
      
      toast.success('請求書PDFをダウンロードしました');
    } catch (error) {
      console.error('PDF出力エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      toast.error(`PDF出力に失敗しました: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  // PDF生成処理
  const generateAndDownloadPdf = async (invoice: any) => {
    // PDF.jsなどのライブラリを使用して実装可能
    // ここではモックの実装
    return new Promise<void>((resolve) => {
      // モック実装: 1秒後に完了
      setTimeout(() => {
        console.log('PDF生成完了', { invoiceId: invoice.id });
        
        // モック用の一時的な実装 - 実際のAPIに置き換え
        const dummyContent = `
請求書番号: ${invoiceDetails.invoiceNumber}
発行日: ${invoiceDetails.billingDate}
請求先: ${invoiceDetails.clientInfo.name}
合計金額: ${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(calculateTotal())}
`;
        
        // テキストファイルとしてダウンロード（実際はPDFに置き換え）
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `請求書_${invoiceDetails.invoiceNumber || 'INV-001'}.txt`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        resolve();
      }, 1000);
    });
  };

  // 期間変更時の数量自動取得を修正
  const handleBillingPeriodChange = async (field: 'startDate' | 'endDate', value: string) => {
    // 期間設定を更新
    const newBillingPeriod = {
      ...invoiceDetails.billingPeriod,
      [field]: value
    };
    
    setInvoiceDetails({
      ...invoiceDetails,
      billingPeriod: newBillingPeriod
    });

    try {
      // APIリクエストシミュレーション - 指定期間の送信数取得
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user.role === 'TENANT_ADMIN') {
        // テナント管理者の場合 - サービス利用者ごとのデータを先に生成
        const userCount = 3; // テスト用に固定値にして一貫性を確保
        
        // 各サービス利用者のデータを生成
        const userData = [
          {
            userId: 'user-1',
            username: 'サービス利用者1',
            domesticUsage: 532,
            internationalUsage: 48,
            domesticPrice: 3, // 固定単価
            internationalPrice: 10 // 固定単価
          },
          {
            userId: 'user-2',
            username: 'サービス利用者2',
            domesticUsage: 217,
            internationalUsage: 15,
            domesticPrice: 3, // 固定単価
            internationalPrice: 10 // 固定単価
          },
          {
            userId: 'user-3',
            username: 'サービス利用者3',
            domesticUsage: 350,
            internationalUsage: 30,
            domesticPrice: 3, // 固定単価
            internationalPrice: 10 // 固定単価
          }
        ];
        
        // ユーザー内訳の合計を厳密に計算
        const totalDomesticUsage = userData.reduce((sum, u) => sum + u.domesticUsage, 0);
        const totalInternationalUsage = userData.reduce((sum, u) => sum + u.internationalUsage, 0);
        
        // 厳密な単価を設定（テナント管理者の単価）
        const domesticPrice = 3; // 固定値に変更
        const internationalPrice = 10; // 固定値に変更
        
        console.log("内訳合計確認:", {
          domesticTotal: totalDomesticUsage,
          internationalTotal: totalInternationalUsage
        });
        
        setEditedHistory({
          ...editedHistory,
          domesticUsage: totalDomesticUsage,
          internationalUsage: totalInternationalUsage,
          domesticPrice: domesticPrice,
          internationalPrice: internationalPrice
        });
        
        setInvoiceDetails({
          ...invoiceDetails,
          billingPeriod: newBillingPeriod,
          domesticUsage: totalDomesticUsage,
          internationalUsage: totalInternationalUsage,
          domesticPrice: domesticPrice,
          internationalPrice: internationalPrice,
          userBreakdown: userData
        });
        
        // 整合性確認
        setTimeout(() => {
          const userTotalDomestic = userData.reduce((sum, u) => sum + u.domesticUsage, 0);
          const invoiceDomestic = totalDomesticUsage;
          
          if (userTotalDomestic !== invoiceDomestic) {
            console.error("計算不一致エラー: 内訳合計と請求書合計が一致しません", {
              内訳合計: userTotalDomestic,
              請求書合計: invoiceDomestic
            });
          } else {
            console.info("計算整合性確認: OK", {
              内訳合計: userTotalDomestic,
              請求書合計: invoiceDomestic
            });
          }
        }, 500);
      } else {
        // サービス利用者の場合 - 対象ユーザーのみ
        const domesticSmsCount = Math.floor(Math.random() * 1000) + 100;
        const internationalSmsCount = Math.floor(Math.random() * 100) + 10;
        
        // 厳密な単価を設定（サービス利用者の単価）
        const domesticPrice = 3; // 固定値に変更
        const internationalPrice = 10; // 固定値に変更
        
        setEditedHistory({
          ...editedHistory,
          domesticUsage: domesticSmsCount,
          internationalUsage: internationalSmsCount,
          domesticPrice: domesticPrice,
          internationalPrice: internationalPrice
        });
        
        setInvoiceDetails({
          ...invoiceDetails,
          billingPeriod: newBillingPeriod,
          domesticUsage: domesticSmsCount,
          internationalUsage: internationalSmsCount,
          domesticPrice: domesticPrice,
          internationalPrice: internationalPrice
        });
      }
      
      toast.success('対象期間の送信数を更新しました');
    } catch (error) {
      toast.error('送信数の取得に失敗しました');
      console.error(error);
    }
  };

  return (
    <Dialog as="div" className="relative z-50" open={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel
            ref={exportRef}
            className="w-full max-w-4xl overflow-visible rounded-2xl bg-white p-6 shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                請求書の編集
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6 px-1">
              {/* タイトル */}
              <div className="text-center mb-8 border-b pb-4">
                <input
                  type="text"
                  value={invoiceDetails.title}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, title: e.target.value})}
                  className="text-3xl font-bold focus:ring-2 focus:ring-blue-500 p-2 text-center w-full my-2 border-b-2 border-transparent hover:border-gray-300 transition-colors"
                  aria-label="請求書タイトル"
                />
              </div>

              {/* 請求番号・日付・請求先・請求元 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                {/* 左側: 請求先情報 */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">請求先情報</h4>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">会社名</label>
                    <input
                      type="text"
                      value={invoiceDetails.clientInfo.name}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        clientInfo: {...invoiceDetails.clientInfo, name: e.target.value}
                      })}
                      className="text-lg font-semibold w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">住所</label>
                    <textarea
                      value={invoiceDetails.clientInfo.address}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        clientInfo: {...invoiceDetails.clientInfo, address: e.target.value}
                      })}
                      rows={3}
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                      <input
                        type="text"
                        value={invoiceDetails.clientInfo.tel}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          clientInfo: {...invoiceDetails.clientInfo, tel: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">メールアドレス</label>
                      <input
                        type="email"
                        value={invoiceDetails.clientInfo.email}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          clientInfo: {...invoiceDetails.clientInfo, email: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        value={invoiceDetails.invoiceNumber}
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})}
                        className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: INV-20230501-001"
                      />
                    </div>
                    <div className="flex flex-wrap items-center space-x-2">
                      <label className="text-xs text-gray-500 min-w-[100px]">発行日：</label>
                      <input
                        type="date"
                        value={invoiceDetails.billingDate}
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, billingDate: e.target.value})}
                        className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">会社名</label>
                    <input
                      type="text"
                      value={invoiceDetails.companyInfo.name}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        companyInfo: {...invoiceDetails.companyInfo, name: e.target.value}
                      })}
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    />
                    <label className="block text-xs text-gray-500 mb-1">住所</label>
                    <textarea
                      value={invoiceDetails.companyInfo.address}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        companyInfo: {...invoiceDetails.companyInfo, address: e.target.value}
                      })}
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                        <input
                          type="text"
                          value={invoiceDetails.companyInfo.tel}
                          onChange={(e) => setInvoiceDetails({
                            ...invoiceDetails,
                            companyInfo: {...invoiceDetails.companyInfo, tel: e.target.value}
                          })}
                          className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">メールアドレス</label>
                        <input
                          type="email"
                          value={invoiceDetails.companyInfo.email}
                          onChange={(e) => setInvoiceDetails({
                            ...invoiceDetails,
                            companyInfo: {...invoiceDetails.companyInfo, email: e.target.value}
                          })}
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
                  ¥{Math.floor(calculateTotal()).toLocaleString()}
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
                      value={invoiceDetails.billingPeriod.startDate}
                      onChange={(e) => handleBillingPeriodChange('startDate', e.target.value)}
                      className="col-span-2 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-center">〜</div>
                    <input
                      type="date"
                      value={invoiceDetails.billingPeriod.endDate}
                      onChange={(e) => handleBillingPeriodChange('endDate', e.target.value)}
                      className="col-span-2 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">お支払期限</h4>
                  <input
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 請求内容テーブル */}
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
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">月額基本料金</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">1</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <input
                            type="number"
                            value={invoiceDetails.monthlyFee}
                            onChange={(e) => setInvoiceDetails({...invoiceDetails, monthlyFee: Number(e.target.value)})}
                            className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            min="0"
                            step="100"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">{Math.floor(invoiceDetails.monthlyFee).toLocaleString()}円</div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">国内SMS送信料金</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{Math.floor(invoiceDetails.domesticUsage).toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <input
                            type="number"
                            value={invoiceDetails.domesticPrice}
                            onChange={(e) => setInvoiceDetails({...invoiceDetails, domesticPrice: Number(e.target.value)})}
                            className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">{Math.floor(invoiceDetails.domesticUsage * invoiceDetails.domesticPrice).toLocaleString()}円</div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">海外SMS送信料金</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{Math.floor(invoiceDetails.internationalUsage).toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <input
                            type="number"
                            value={invoiceDetails.internationalPrice}
                            onChange={(e) => setInvoiceDetails({...invoiceDetails, internationalPrice: Number(e.target.value)})}
                            className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">{Math.floor(invoiceDetails.internationalUsage * invoiceDetails.internationalPrice).toLocaleString()}円</div>
                        </td>
                      </tr>
                      
                      {/* カスタム項目 */}
                      {customItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                              placeholder="項目名"
                              className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCustomItem(index, 'quantity', Number(e.target.value))}
                              className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                              min="0"
                              placeholder="数量"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateCustomItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-full text-sm border border-gray-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                              min="0"
                              placeholder="単価"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right relative">
                            <div className="text-sm font-medium text-gray-900">{Math.floor(item.quantity * item.unitPrice).toLocaleString()}円</div>
                            <button
                              type="button"
                              onClick={() => removeCustomItem(index)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                              aria-label="項目を削除"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">小計</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{Math.floor(calculateSubtotal()).toLocaleString()}円</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">消費税（10%）</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{Math.floor(calculateTax(calculateSubtotal())).toLocaleString()}円</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">合計（税込）</td>
                        <td className="px-4 py-3 text-right text-base font-bold text-blue-700">{Math.floor(calculateTotal()).toLocaleString()}円</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    カスタム項目を追加
                  </button>
                </div>
              </div>

              {/* サービス利用者別内訳テーブル（テナント管理者の場合のみ表示） */}
              {user.role === 'TENANT_ADMIN' && invoiceDetails.userBreakdown && (
                <div className="mb-8 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">サービス利用者別内訳</h4>
                  
                  {/* 整合性確認表示 */}
                  {invoiceDetails.domesticUsage !== invoiceDetails.userBreakdown.reduce((sum, u) => sum + u.domesticUsage, 0) && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <p className="font-medium">注意: 内訳合計と請求書の値に不一致があります</p>
                      </div>
                      <p className="text-sm mt-1">システム管理者に連絡してください</p>
                    </div>
                  )}
                  
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
                        {invoiceDetails.userBreakdown.map((userDetail, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{userDetail.username}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm text-gray-900">{Math.floor(userDetail.domesticUsage).toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm text-gray-900">
                                {Math.floor(userDetail.domesticUsage * userDetail.domesticPrice).toLocaleString()}円
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm text-gray-900">{Math.floor(userDetail.internationalUsage).toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm text-gray-900">
                                {Math.floor(userDetail.internationalUsage * userDetail.internationalPrice).toLocaleString()}円
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {Math.floor(
                                  userDetail.domesticUsage * userDetail.domesticPrice + 
                                  userDetail.internationalUsage * userDetail.internationalPrice
                                ).toLocaleString()}円
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* 内訳合計行 */}
                        <tr className="bg-gray-50 font-medium">
                          <td className="px-4 py-3 text-sm text-gray-900">合計</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {invoiceDetails.userBreakdown.reduce((sum, u) => sum + Math.floor(u.domesticUsage), 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {invoiceDetails.userBreakdown.reduce((sum, u) => 
                              sum + Math.floor(u.domesticUsage * u.domesticPrice), 0).toLocaleString()}円
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {invoiceDetails.userBreakdown.reduce((sum, u) => sum + Math.floor(u.internationalUsage), 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {invoiceDetails.userBreakdown.reduce((sum, u) => 
                              sum + Math.floor(u.internationalUsage * u.internationalPrice), 0).toLocaleString()}円
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {invoiceDetails.userBreakdown.reduce((sum, u) => 
                              sum + Math.floor(u.domesticUsage * u.domesticPrice) + Math.floor(u.internationalUsage * u.internationalPrice), 0).toLocaleString()}円
                          </td>
                        </tr>
                        
                        {/* 請求書との一致確認行 */}
                        <tr className="bg-gray-100">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">請求書記載値</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {Math.floor(invoiceDetails.domesticUsage).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {Math.floor(invoiceDetails.domesticUsage * invoiceDetails.domesticPrice).toLocaleString()}円
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {Math.floor(invoiceDetails.internationalUsage).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {Math.floor(invoiceDetails.internationalUsage * invoiceDetails.internationalPrice).toLocaleString()}円
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {Math.floor(
                              invoiceDetails.domesticUsage * invoiceDetails.domesticPrice + 
                              invoiceDetails.internationalUsage * invoiceDetails.internationalPrice
                            ).toLocaleString()}円
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* お振込先情報 */}
              <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">お振込先</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">銀行名</label>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.bankName}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, bankName: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="○○銀行"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">支店名</label>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.branchName}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, branchName: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="○○支店"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">口座種別</label>
                      <select
                        value={invoiceDetails.bankInfo.accountType}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, accountType: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                        <option value="貯蓄">貯蓄</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">口座番号</label>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.accountNumber}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, accountNumber: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">口座名義</label>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.accountName}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, accountName: e.target.value}
                        })}
                        className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="○○合同会社"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 備考 */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">備考</h4>
                <textarea
                  value={invoiceDetails.notes}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, notes: e.target.value})}
                  rows={4}
                  className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="お支払いに関する注意事項などを記載してください"
                />
              </div>

              {/* 操作ボタン */}
              <div className="flex justify-end items-center space-x-3 pt-4 mt-8 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                
                {/* ステータスボタン */}
                <div className="inline-flex gap-2">
                  {editedHistory.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedHistory({
                          ...editedHistory,
                          status: 'paid'
                        });
                        // APIコール（実際のコードに置き換え）
                        toast.success('支払い状況を「支払済み」に更新しました');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-700 transition-colors"
                    >
                      支払済みにする
                    </button>
                  )}
                  {editedHistory.status !== 'paid' && editedHistory.status !== 'failed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedHistory({
                          ...editedHistory,
                          status: 'failed'
                        });
                        // APIコール（実際のコードに置き換え）
                        toast.success('請求書をキャンセルしました');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-md hover:bg-error-700 transition-colors"
                    >
                      キャンセルする
                    </button>
                  )}
                  {user.role === 'END_USER' && editedHistory.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        // 請求書受領APIコール（実際のコードに置き換え）
                        toast.success('請求書を受領しました');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      請求書を受領する
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setIsExporting(true);
                      console.log('PDF出力処理を開始', { history: editedHistory.id });
                      handleExportPDF();
                    } catch (error) {
                      console.error('PDF出力エラー:', error);
                      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
                      toast.error(`PDF出力に失敗しました: ${errorMessage}`);
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'エクスポート中...' : 'PDFエクスポート'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

const UserBillingDetails: React.FC<UserBillingDetailsProps> = ({ user, onClose }) => {
  const [editingHistory, setEditingHistory] = useState<BillingHistory | null>(null);
  const { downloadPDF } = useBillingStore();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // デフォルトは降順（最新の日付から）
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 1ページあたり5件表示

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: BillingHistory['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: BillingHistory['status']) => {
    switch (status) {
      case 'paid':
        return '支払済';
      case 'pending':
        return '支払い待ち';
      case 'failed':
        return '支払い失敗';
      default:
        return '';
    }
  };

  const handleEditInvoice = (history: BillingHistory) => {
    setEditingHistory(history);
  };

  const handleSaveInvoice = (editedHistory: BillingHistory & { invoiceDetails: InvoiceDetails }) => {
    // TODO: APIを呼び出して請求書を更新
    console.log('請求書を更新:', editedHistory);
    setEditingHistory(null);
  };

  // ソート方向を切り替える関数
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // ソートを変更したらページを1に戻す
  };

  // ソートされた請求履歴を取得
  const getSortedHistory = () => {
    return [...user.billingHistory].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // ページネーション用のデータを取得
  const sortedHistory = getSortedHistory();
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedHistory.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    請求・支払い詳細
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">契約情報</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <p className="text-sm text-gray-500">会社名</p>
                        <p className="text-sm font-medium text-gray-900">{user.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">メールアドレス</p>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">月額利用料</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(Math.floor(user.monthlyFee))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">国内送信単価</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(Math.floor(user.domesticSmsPrice))}/通</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">海外送信単価</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(Math.floor(user.internationalSmsPrice))}/通</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900">請求履歴</h4>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button 
                              onClick={toggleSortDirection}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              請求日
                              {sortDirection === 'asc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月額利用料</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">国内送信</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">海外送信</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((history) => (
                          <tr key={history.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(history.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatCurrency(Math.floor(history.monthlyFee))}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatCurrency(Math.floor(history.domesticUsage * user.domesticSmsPrice))}
                              <span className="text-xs text-gray-500 ml-1">({Math.floor(history.domesticUsage)}通)</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatCurrency(Math.floor(history.internationalUsage * user.internationalSmsPrice))}
                              <span className="text-xs text-gray-500 ml-1">({Math.floor(history.internationalUsage)}通)</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(Math.floor(history.totalAmount))}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {getStatusIcon(history.status)}
                                <span className="ml-2 text-sm text-gray-900">{getStatusText(history.status)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => handleEditInvoice(history)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                編集
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* ページネーション */}
                    {sortedHistory.length > itemsPerPage && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            前へ
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            次へ
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              全 <span className="font-medium">{sortedHistory.length}</span> 件中 
                              <span className="font-medium"> {indexOfFirstItem + 1}</span> - 
                              <span className="font-medium"> {Math.min(indexOfLastItem, sortedHistory.length)}</span> 件を表示
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                              >
                                <span className="sr-only">前へ</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              {Array.from({ length: totalPages }).map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentPage(index + 1)}
                                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                    currentPage === index + 1
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {index + 1}
                                </button>
                              ))}
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                              >
                                <span className="sr-only">次へ</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {editingHistory && (
                  <EditInvoiceModal
                    history={editingHistory}
                    user={user}
                    onClose={() => setEditingHistory(null)}
                    onSave={handleSaveInvoice}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UserBillingDetails; 