import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, CheckCircle2, Clock, AlertCircle, Edit2 } from 'lucide-react';
import { BillingUser, BillingHistory } from '../../store/billingStore';
import { useBillingStore } from '../../store/billingStore';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { Document, Page, Text, StyleSheet, View } from '@react-pdf/renderer';

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

  const calculateSubtotal = () => {
    const fixedItemsTotal = editedHistory.monthlyFee +
      (editedHistory.domesticUsage * (editedHistory.domesticPrice || 0)) +
      (editedHistory.internationalUsage * (editedHistory.internationalPrice || 0));
    
    const customItemsTotal = customItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0);
    
    return fixedItemsTotal + customItemsTotal;
  };

  const calculateTax = (subtotal: number) => {
    return Math.floor(subtotal * 0.1);
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
    monthlyFee: user.monthlyFee,
    domesticUsage: editedHistory.domesticUsage,
    domesticPrice: editedHistory.domesticPrice || user.domesticSmsPrice,
    internationalUsage: editedHistory.internationalUsage,
    internationalPrice: editedHistory.internationalPrice || user.internationalSmsPrice,
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

  return (
    <Dialog as="div" className="relative z-50" open={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                請求書の編集
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* タイトル */}
              <div className="text-center mb-8">
                <input
                  type="text"
                  value={invoiceDetails.title}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, title: e.target.value})}
                  className="text-3xl font-bold border-none focus:ring-0 p-0 text-center w-full"
                />
              </div>

              {/* 請求番号・日付・請求先・請求元 */}
              <div className="grid grid-cols-2 gap-x-8 mb-8">
                {/* 左側: 請求先情報 */}
                <div className="space-y-4">
                  <div className="mb-6">
                    <input
                      type="text"
                      value={invoiceDetails.clientInfo.name}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        clientInfo: {...invoiceDetails.clientInfo, name: e.target.value}
                      })}
                      className="text-lg font-semibold w-full border-none focus:ring-0"
                    />
                    <div className="text-sm">御中</div>
                  </div>
                  <textarea
                    value={invoiceDetails.clientInfo.address}
                    onChange={(e) => setInvoiceDetails({
                      ...invoiceDetails,
                      clientInfo: {...invoiceDetails.clientInfo, address: e.target.value}
                    })}
                    rows={3}
                    className="w-full text-sm border-none focus:ring-0 resize-none"
                  />
                  <div className="text-sm">
                    <div>TEL: {invoiceDetails.clientInfo.tel}</div>
                    <div>Email: {invoiceDetails.clientInfo.email}</div>
                  </div>
                </div>

                {/* 右側: 発行日・請求元情報 */}
                <div>
                  <div className="text-right space-y-2 mb-6">
                    <div className="flex justify-end items-center space-x-4">
                      <span className="text-sm">請求書番号：</span>
                      <input
                        type="text"
                        value={invoiceDetails.invoiceNumber}
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})}
                        className="text-sm border-none focus:ring-0 text-right w-40"
                      />
                    </div>
                    <div className="flex justify-end items-center space-x-4">
                      <span className="text-sm">発行日：</span>
                      <input
                        type="date"
                        value={invoiceDetails.billingDate}
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, billingDate: e.target.value})}
                        className="text-sm border-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <input
                      type="text"
                      value={invoiceDetails.companyInfo.name}
                      onChange={(e) => setInvoiceDetails({
                        ...invoiceDetails,
                        companyInfo: {...invoiceDetails.companyInfo, name: e.target.value}
                      })}
                      className="text-lg font-semibold text-right w-full border-none focus:ring-0 mb-2"
                    />
                    <div className="text-sm space-y-1 mb-4">
                      <input
                        type="text"
                        value={invoiceDetails.companyInfo.address}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          companyInfo: {...invoiceDetails.companyInfo, address: e.target.value}
                        })}
                        className="w-full text-sm border-none focus:ring-0 text-right"
                      />
                      <div className="flex justify-end items-center space-x-2">
                        <span>TEL:</span>
                        <input
                          type="text"
                          value={invoiceDetails.companyInfo.tel}
                          onChange={(e) => setInvoiceDetails({
                            ...invoiceDetails,
                            companyInfo: {...invoiceDetails.companyInfo, tel: e.target.value}
                          })}
                          className="text-sm border-none focus:ring-0 text-right"
                        />
                      </div>
                      <div className="flex justify-end items-center space-x-2">
                        <span>Email:</span>
                        <input
                          type="text"
                          value={invoiceDetails.companyInfo.email}
                          onChange={(e) => setInvoiceDetails({
                            ...invoiceDetails,
                            companyInfo: {...invoiceDetails.companyInfo, email: e.target.value}
                          })}
                          className="text-sm border-none focus:ring-0 text-right"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-16 h-16 border border-gray-300 flex items-center justify-center relative">
                        {invoiceDetails.sealImage ? (
                          <img
                            src={invoiceDetails.sealImage}
                            alt="印"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span>印</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSealImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 請求金額 */}
              <div className="mb-8">
                <div className="space-y-2">
                  <div className="text-base font-medium">ご請求金額</div>
                  <div className="text-2xl font-bold">
                    ¥{calculateSubtotal().toLocaleString()}
                    <span className="text-lg ml-1">（税込）</span>
                  </div>
                </div>
              </div>

              {/* 請求期間 */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold">対象期間：</span>
                  <input
                    type="date"
                    value={invoiceDetails.billingPeriod.startDate}
                    onChange={(e) => setInvoiceDetails({
                      ...invoiceDetails,
                      billingPeriod: {...invoiceDetails.billingPeriod, startDate: e.target.value}
                    })}
                    className="text-sm border-gray-300 rounded-md"
                  />
                  <span>～</span>
                  <input
                    type="date"
                    value={invoiceDetails.billingPeriod.endDate}
                    onChange={(e) => setInvoiceDetails({
                      ...invoiceDetails,
                      billingPeriod: {...invoiceDetails.billingPeriod, endDate: e.target.value}
                    })}
                    className="text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* お支払期限 */}
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold">お支払期限：</span>
                  <input
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
                    className="text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 請求内容テーブル */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-gray-800">
                      <th className="py-3 text-left px-4">項目</th>
                      <th className="py-3 text-right px-4">数量</th>
                      <th className="py-3 text-right px-4">単価</th>
                      <th className="py-3 text-right px-4">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2">月額基本料金</td>
                      <td className="px-4 py-2 text-right">1</td>
                      <td className="px-4 py-2 text-right">{user.monthlyFee.toLocaleString()}円</td>
                      <td className="px-4 py-2 text-right">{user.monthlyFee.toLocaleString()}円</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">国内SMS送信料金</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={editedHistory.domesticUsage}
                          onChange={(e) => setEditedHistory({ ...editedHistory, domesticUsage: Number(e.target.value) })}
                          className="w-32 text-right border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">{editedHistory.domesticPrice?.toLocaleString() || 0}円</td>
                      <td className="px-4 py-2 text-right">
                        {((editedHistory.domesticUsage * (editedHistory.domesticPrice || 0))).toLocaleString()}円
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">海外SMS送信料金</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={editedHistory.internationalUsage}
                          onChange={(e) => setEditedHistory({ ...editedHistory, internationalUsage: Number(e.target.value) })}
                          className="w-32 text-right border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">{editedHistory.internationalPrice?.toLocaleString() || 0}円</td>
                      <td className="px-4 py-2 text-right">
                        {((editedHistory.internationalUsage * (editedHistory.internationalPrice || 0))).toLocaleString()}円
                      </td>
                    </tr>
                    
                    {/* カスタム項目 */}
                    {customItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                            className="w-full border-gray-300 rounded-md"
                            placeholder="項目名"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCustomItem(index, 'quantity', Number(e.target.value))}
                            className="w-32 text-right border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateCustomItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-32 text-right border-gray-300 rounded-md"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(item.quantity * item.unitPrice).toLocaleString()}円
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-800">
                      <td colSpan={3} className="py-3 text-right font-medium px-4">小計</td>
                      <td className="py-3 text-right font-medium px-4">{calculateSubtotal().toLocaleString()}円</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-3 text-right font-medium px-4">消費税（10%）</td>
                      <td className="py-3 text-right font-medium px-4">{calculateTax(calculateSubtotal()).toLocaleString()}円</td>
                    </tr>
                    <tr className="border-t-2 border-b-2 border-gray-800">
                      <td colSpan={3} className="py-3 text-right font-bold px-4">合計</td>
                      <td className="py-3 text-right font-bold px-4">{calculateTotal().toLocaleString()}円</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* お振込先情報 */}
              <div className="bg-gray-50 p-6 rounded mb-6">
                <h4 className="font-semibold mb-4 text-lg">お振込先</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm w-24 font-medium">銀行名：</span>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.bankName}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, bankName: e.target.value}
                        })}
                        className="flex-1 text-sm border-none focus:ring-0 bg-transparent"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm w-24 font-medium">支店名：</span>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.branchName}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, branchName: e.target.value}
                        })}
                        className="flex-1 text-sm border-none focus:ring-0 bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm w-24 font-medium">口座種別：</span>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.accountType}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, accountType: e.target.value}
                        })}
                        className="flex-1 text-sm border-none focus:ring-0 bg-transparent"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm w-24 font-medium">口座番号：</span>
                      <input
                        type="text"
                        value={invoiceDetails.bankInfo.accountNumber}
                        onChange={(e) => setInvoiceDetails({
                          ...invoiceDetails,
                          bankInfo: {...invoiceDetails.bankInfo, accountNumber: e.target.value}
                        })}
                        className="flex-1 text-sm border-none focus:ring-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 備考 */}
              <div>
                <h4 className="font-semibold mb-2">備考</h4>
                <textarea
                  value={invoiceDetails.notes}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, notes: e.target.value})}
                  rows={4}
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>

              {/* 操作ボタン */}
              <div className="flex justify-end items-center space-x-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 画面を印刷する（PDF保存可能）
                    window.print();
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  エクスポート
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
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(user.monthlyFee)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">国内送信単価</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(user.domesticSmsPrice)}/通</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">海外送信単価</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(user.internationalSmsPrice)}/通</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900">請求履歴</h4>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">請求日</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月額利用料</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">国内送信</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">海外送信</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {user.billingHistory.map((history) => (
                          <tr key={history.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(history.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(history.monthlyFee)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(history.domesticUsage * user.domesticSmsPrice)}
                              <span className="text-xs text-gray-500 ml-1">({history.domesticUsage}通)</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(history.internationalUsage * user.internationalSmsPrice)}
                              <span className="text-xs text-gray-500 ml-1">({history.internationalUsage}通)</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(history.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon(history.status)}
                                <span className="ml-2 text-sm text-gray-900">{getStatusText(history.status)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
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