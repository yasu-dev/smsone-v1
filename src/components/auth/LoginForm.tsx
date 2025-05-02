import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { Tenant } from '../../types/tenant';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { login, isLoading, error, forceLogin } = useAuthStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const navigate = useNavigate();

  // コンポーネントマウント時にテナント情報を取得
  useEffect(() => {
    const mockTenant: Tenant = {
      id: 'demo-tenant',
      name: 'デモテナント',
      domain: 'localhost',
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#9333ea',
        logoUrl: '/logo.svg'
      },
      settings: {
        smsSenderId: 'DEMO',
        maxSmsPerDay: 1000,
        allowedCountries: ['JP']
      }
    };
    setTenant(mockTenant);
    
    // テーマカラーをドキュメントに適用
    if (mockTenant.theme.primaryColor) {
      document.documentElement.style.setProperty('--color-primary-600', mockTenant.theme.primaryColor);
      if (mockTenant.theme.secondaryColor) {
        document.documentElement.style.setProperty('--color-primary-700', mockTenant.theme.secondaryColor);
      }
    }
    
    // デモ環境用に自動ログイン試行
    checkAutoLogin();
  }, []);
  
  // デモ環境での自動ログイン処理
  const checkAutoLogin = async () => {
    try {
      // forceLoginが関数として定義されているかチェック
      if (typeof forceLogin === 'function') {
        forceLogin();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('自動ログイン失敗:', err);
      // 自動ログイン失敗時は手動ログインを促す
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!username || !password) {
        throw new Error('ユーザー名とパスワードを入力してください');
      }
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // エラーはlogin関数内で設定されるため、ここでは何もしない
    }
  };

  return (
    <div className="w-full"
      style={tenant?.theme.primaryColor ? {
        background: `linear-gradient(135deg, ${tenant.theme.primaryColor}20, ${tenant.theme.secondaryColor || tenant.theme.primaryColor}10)`,
      } : {}}
    >
      <motion.div 
        className="bg-white px-8 py-10 shadow sm:rounded-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-error-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">ログインエラー</h3>
                  <div className="mt-2 text-sm text-error-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="form-label">
              ユーザー名
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input w-full"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="form-label">
                パスワード
              </label>
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  パスワードをお忘れですか？
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full"
                placeholder="password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-grey-700">
                ログイン状態を保持する
              </label>
            </div>
          </div>
          
          {/* デモユーザー情報 */}
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3 w-full">
                <h3 className="text-sm font-medium text-blue-800">デモ環境情報</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>以下のアカウントでログインできます：</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full border border-blue-200 text-sm">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="py-2 px-3 text-left border-b border-blue-200">権限</th>
                          <th className="py-2 px-3 text-left border-b border-blue-200">ユーザー名</th>
                          <th className="py-2 px-3 text-left border-b border-blue-200">パスワード</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50">
                          <td className="py-2 px-3 border-b border-blue-200">システム管理者</td>
                          <td className="py-2 px-3 border-b border-blue-200 font-medium">admin</td>
                          <td className="py-2 px-3 border-b border-blue-200">password</td>
                        </tr>
                        <tr className="hover:bg-blue-50">
                          <td className="py-2 px-3 border-b border-blue-200">テナント管理者</td>
                          <td className="py-2 px-3 border-b border-blue-200 font-medium">jintech-admin</td>
                          <td className="py-2 px-3 border-b border-blue-200">password</td>
                        </tr>
                        <tr className="hover:bg-blue-50">
                          <td className="py-2 px-3 border-b border-blue-200">運用管理者</td>
                          <td className="py-2 px-3 border-b border-blue-200 font-medium">imperialhotel-admin</td>
                          <td className="py-2 px-3 border-b border-blue-200">password</td>
                        </tr>
                        <tr className="hover:bg-blue-50">
                          <td className="py-2 px-3 border-b border-blue-200">運用担当者</td>
                          <td className="py-2 px-3 border-b border-blue-200 font-medium">imperialhotel-user</td>
                          <td className="py-2 px-3 border-b border-blue-200">password</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center py-3 text-lg"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              ログイン
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginForm;