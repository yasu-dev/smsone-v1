import React, { useState } from 'react';
import { SettingCard } from "../ui/SettingCard";
import { CreditCard, DollarSign, Clock, Plus, Edit, Trash2 } from 'lucide-react';

const BillingSettings: React.FC = () => {
  const [activeSubscription, setActiveSubscription] = useState({
    plan: 'ビジネスプラン',
    price: '¥15,000',
    cycle: '月額',
    nextBilling: '2023年12月1日',
    status: 'アクティブ'
  });

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'card_1',
      type: 'クレジットカード',
      last4: '4242',
      brand: 'Visa',
      expMonth: 12,
      expYear: 2025,
      isDefault: true
    }
  ]);

  const [billingHistory, setBillingHistory] = useState([
    { id: 'inv_1', date: '2023年11月1日', amount: '¥15,000', status: '支払い済み', invoice: '#INV-2023-11' },
    { id: 'inv_2', date: '2023年10月1日', amount: '¥15,000', status: '支払い済み', invoice: '#INV-2023-10' },
    { id: 'inv_3', date: '2023年9月1日', amount: '¥15,000', status: '支払い済み', invoice: '#INV-2023-09' }
  ]);

  return (
    <div className="space-y-8 py-4">
      {/* 現在のプラン情報 */}
      <SettingCard>
        <SettingCard.Header>
          <SettingCard.Title>現在のプラン</SettingCard.Title>
          <SettingCard.Description>
            現在契約中のプランと次回の請求日
          </SettingCard.Description>
        </SettingCard.Header>
        <SettingCard.Content>
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-700">{activeSubscription.plan}</h3>
                <p className="text-sm text-gray-600">{activeSubscription.price} / {activeSubscription.cycle}</p>
                <p className="text-xs text-gray-500 mt-1">次回請求日: {activeSubscription.nextBilling}</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {activeSubscription.status}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
              プランを変更する
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
              プランをキャンセルする
            </button>
          </div>
        </SettingCard.Content>
      </SettingCard>

      {/* 支払い方法 */}
      <SettingCard>
        <SettingCard.Header>
          <SettingCard.Title>支払い方法</SettingCard.Title>
          <SettingCard.Description>
            請求に使用する支払い方法を管理します
          </SettingCard.Description>
        </SettingCard.Header>
        <SettingCard.Content>
          <div className="space-y-4 mb-6">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="mr-4 bg-gray-100 p-2 rounded-md">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                      {method.isDefault && <span className="ml-2 text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">デフォルト</span>}
                    </p>
                    <p className="text-sm text-gray-500">有効期限: {method.expMonth}/{method.expYear}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Plus className="h-4 w-4 mr-2" />
            新しい支払い方法を追加
          </button>
        </SettingCard.Content>
      </SettingCard>

      {/* 請求履歴 */}
      <SettingCard>
        <SettingCard.Header>
          <SettingCard.Title>請求履歴</SettingCard.Title>
          <SettingCard.Description>
            過去の請求書と支払い履歴
          </SettingCard.Description>
        </SettingCard.Header>
        <SettingCard.Content>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">請求日</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">請求書番号</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary-600 hover:text-primary-900">ダウンロード</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingCard.Content>
      </SettingCard>

      {/* 税金・請求先情報 */}
      <SettingCard>
        <SettingCard.Header>
          <SettingCard.Title>請求先情報</SettingCard.Title>
          <SettingCard.Description>
            請求書に表示される会社情報や税務情報
          </SettingCard.Description>
        </SettingCard.Header>
        <SettingCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">請求先住所</h4>
              <div className="p-4 border border-gray-200 rounded-md">
                <p className="text-sm">株式会社サンプル</p>
                <p className="text-sm">〒100-0001</p>
                <p className="text-sm">東京都千代田区千代田1-1</p>
                <p className="text-sm">サンプルビル 5F</p>
                <button className="mt-3 text-sm text-primary-600 hover:text-primary-800 flex items-center">
                  <Edit className="h-3 w-3 mr-1" />
                  編集する
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">税務情報</h4>
              <div className="p-4 border border-gray-200 rounded-md">
                <p className="text-sm">事業者番号: T1234567890123</p>
                <p className="text-sm">法人番号: 1234567890123</p>
                <button className="mt-3 text-sm text-primary-600 hover:text-primary-800 flex items-center">
                  <Edit className="h-3 w-3 mr-1" />
                  編集する
                </button>
              </div>
            </div>
          </div>
        </SettingCard.Content>
      </SettingCard>
    </div>
  );
};

export default BillingSettings; 