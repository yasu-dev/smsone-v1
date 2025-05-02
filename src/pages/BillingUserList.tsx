import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useBillingStore } from '../store/billingStore';
import { Search, Grid, List, DollarSign, Mail, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import UserBillingDetails from '../components/billing/UserBillingDetails';

interface BillingUser {
  id: string;
  username: string;
  company: string;
  email: string;
  monthlyFee: number;
  domesticSmsPrice: number;
  internationalSmsPrice: number;
  status: 'active' | 'inactive' | 'overdue' | 'canceled';
  billingHistory: {
    id: string;
    date: string;
    monthlyFee: number;
    domesticUsage: number;
    internationalUsage: number;
    totalAmount: number;
    status: 'paid' | 'pending' | 'failed';
    invoiceUrl: string;
  }[];
}

const BillingUserList: React.FC = () => {
  const navigate = useNavigate();
  const { users, isLoading, error, fetchUsers, exportCSV } = useBillingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<BillingUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUserClick = (user: BillingUser) => {
    setSelectedUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-grey-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-grey-900">テナント向け請求管理</h1>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="card">
          <h2 className="text-xl font-semibold text-grey-900 mb-4">ユーザー一覧</h2>
          <p className="mt-1 text-sm text-grey-500 mb-4">
            ユーザーごとの請求・支払い情報を管理します
          </p>
          
          <div className="mb-4 flex items-center gap-4">
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
                className="btn-secondary flex items-center gap-2"
                onClick={() => exportCSV('users')}
              >
                <Download className="h-4 w-4" />
                エクスポート
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-grey-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ユーザー名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      会社名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      月額利用料
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-grey-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-grey-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-grey-500">{user.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-grey-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-grey-900">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(user.monthlyFee)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-grey-100 text-grey-800' :
                          user.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status === 'active' ? 'アクティブ' :
                           user.status === 'inactive' ? '非アクティブ' :
                           user.status === 'overdue' ? '支払い遅延' :
                           'キャンセル'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        <button
                          onClick={() => handleUserClick(user)}
                          className="text-primary-600 hover:text-primary-900"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg border border-grey-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-grey-900">{user.username}</h3>
                      <p className="text-sm text-grey-500">{user.company}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-grey-100 text-grey-800' :
                      user.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status === 'active' ? 'アクティブ' :
                       user.status === 'inactive' ? '非アクティブ' :
                       user.status === 'overdue' ? '支払い遅延' :
                       'キャンセル'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-grey-500">
                      <DollarSign className="h-4 w-4" />
                      <span>月額利用料: {user.monthlyFee.toLocaleString()}円</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-grey-500">
                      <Mail className="h-4 w-4" />
                      <span>SMS単価（国内）: ¥{user.domesticSmsPrice}/通</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {selectedUser && (
        <UserBillingDetails
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </motion.div>
  );
};

export default BillingUserList; 