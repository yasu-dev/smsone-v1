import React, { useState, useEffect } from 'react';
import { Search, User, Grid, List, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import UserBillingDetails from '../components/billing/UserBillingDetails';
import { BillingUser, useBillingStore } from '../store/billingStore';

const BillingManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<BillingUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // billingStoreからデータを取得
  const { users, isLoading, error, fetchUsers, exportCSV } = useBillingStore();
  
  // コンポーネントのマウント時にデータを取得
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-grey-900">請求・支払い管理</h1>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-grey-900 mb-4">ユーザー一覧</h2>
        <div className="mb-4 flex items-center gap-4 justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-grey-400" />
            </div>
            <input
              type="search"
              className="form-input pl-10 w-full"
              placeholder="ユーザー名、会社名、メールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-100 text-grey-900' : 'text-grey-500 hover:text-grey-900'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-100 text-grey-900' : 'text-grey-500 hover:text-grey-900'}`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2 px-4 py-2 border border-grey-300 rounded shadow-sm text-grey-700 hover:bg-grey-50"
              onClick={() => exportCSV('users')}
            >
              <Download className="h-4 w-4" />
              エクスポート
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p>データを読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">
            <p>{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-md">
            <User className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-grey-900">データがありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm ? '検索条件に一致するユーザーが見つかりませんでした。' : 'ユーザーデータがありません。'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-grey-200">
              <thead className="bg-grey-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    ユーザー名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    会社名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    メールアドレス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    月額利用料
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    ステータス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-grey-500">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-grey-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-grey-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-grey-500">
                      {user.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-grey-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-grey-900">
                      {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(user.monthlyFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-grey-100 text-grey-800'
                      }`}>
                        {user.status === 'active' ? 'アクティブ' :
                         user.status === 'overdue' ? '支払い遅延' :
                         user.status === 'inactive' ? '無効' : '解約'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-primary-600">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="hover:text-primary-900"
                      >
                        詳細を表示
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="bg-white rounded-lg border border-grey-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-grey-900">{user.username}</h3>
                    <p className="text-sm text-grey-500">{user.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-grey-100 text-grey-800'
                  }`}>
                    {user.status === 'active' ? 'アクティブ' :
                     user.status === 'overdue' ? '支払い遅延' :
                     user.status === 'inactive' ? '無効' : '解約'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-grey-500">{user.email}</p>
                  <p className="mt-2 text-sm font-medium">
                    {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(user.monthlyFee)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserBillingDetails
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </motion.div>
  );
};

export default BillingManagement; 