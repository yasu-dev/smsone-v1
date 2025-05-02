import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// デモユーザーのリスト表示用
const demoUsers = [
  {
    id: 'system-1',
    username: 'admin',
    role: 'SYSTEM_ADMIN',
    description: 'システム管理者',
    tenant: 'Topaz合同会社のSMSOne'
  },
  {
    id: 'tenant-1',
    username: 'sample-oem-admin',
    role: 'TENANT_ADMIN',
    description: 'テナント管理者',
    tenant: 'サンプル株式会社のSMSService'
  },
  {
    id: 'operation-1',
    username: 'sample-company-admin',
    role: 'OPERATION_ADMIN',
    description: '運用管理者',
    tenant: 'サンプル株式会社'
  },
  {
    id: 'operation-2',
    username: 'sample-company-user',
    role: 'OPERATION_USER',
    description: '運用担当者',
    tenant: 'サンプル株式会社'
  }
];

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password'); // デモ用に固定
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { login, isLoading, error, isAuthenticated, getTenantInfo } = useAuthStore();
  const navigate = useNavigate();
  
  // テナント情報を取得
  const tenant = getTenantInfo();
  
  // 認証済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // ユーザー選択時の処理
  const handleUserSelect = (userId: string) => {
    const user = demoUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(userId);
      setUsername(user.username);
    }
  };
  
  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      try {
        await login(username, password);
        navigate('/dashboard');
      } catch (err) {
        console.error('ログイン失敗:', err);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-grey-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* <img 
          src={tenant?.logoUrl || "/logo.svg"} 
          alt="ロゴ" 
          className="mx-auto h-12 w-auto"
        /> */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-grey-900">
          <span style={{
            fontFamily: "'Arial Black', 'Helvetica Black', Gotham, sans-serif",
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#222',
            display: 'inline-block'
          }}>{tenant?.name || 'SMSOne（Topaz合同会社）'}</span>
        </h2>
        <p className="mt-2 text-center text-sm text-grey-600">
          SMS配信プラットフォーム
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* デモユーザーを選択部分を非表示に */}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-grey-700">
                ユーザー名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-grey-300 rounded-md shadow-sm placeholder-grey-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-grey-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-grey-300 rounded-md shadow-sm placeholder-grey-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !username}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || !username
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;