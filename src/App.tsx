import React, { useEffect } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TenantProvider } from './store/TenantContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SendSMS from './pages/SendSMS';
import MessageHistory from './pages/MessageHistory';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import TenantUserManagement from './pages/TenantUserManagement';
import ShortenerTools from './pages/ShortenerTools';
import Analytics from './pages/Analytics';
import Surveys from './pages/Surveys';
import SurveyCreate from './pages/SurveyCreate';
import SurveyStats from './pages/SurveyStats';
import SurveyResponse from './pages/SurveyResponse';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import PermissionRoute from './routes/PermissionRoute';
import RoleRoute from './routes/RoleRoute';
import BillingManagement from './pages/BillingManagement';
import BillingUserList from './pages/BillingUserList';
import BillingAnalytics from './pages/BillingAnalytics';
import InvoiceEdit from './pages/InvoiceEdit';
import InvoiceReceived from './pages/InvoiceReceived';
import InvoiceManagement from './pages/InvoiceManagement';
import InvoiceCreate from './pages/InvoiceCreate';
import TenantManagement from './pages/TenantManagement';
import useAuthStore from './store/authStore';
import TagManagement from './pages/TagManagement';
import Support from './pages/Support';
import BillingEndUserList from './pages/BillingEndUserList';
import FAQManagement from './pages/FAQManagement';

// エラーバウンダリーのコンポーネント
const ErrorBoundary = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-gray-700 mb-4">ページの読み込み中に問題が発生しました。</p>
        <button 
          onClick={() => window.location.href = '/dashboard'} 
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ダッシュボードに戻る
        </button>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    // Public routes that don't require authentication
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    // Public survey response page - no authentication required
    path: '/survey-response/:surveyId',
    element: <SurveyResponse />
  },
  {
    // Protected routes that require authentication
    path: '/dashboard',
    element: (
      <TenantProvider>
        <ProtectedRoute />
      </TenantProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <Layout />,
        errorElement: <ErrorBoundary />,
        children: [
          // Base pages - accessible to all users
          {
            path: '',
            element: (
              <PermissionRoute permission="dashboard:read">
                <Dashboard />
              </PermissionRoute>
            )
          },
          {
            path: 'profile',
            element: (
              <React.Fragment>
                <Profile />
              </React.Fragment>
            ),
            errorElement: <ErrorBoundary />
          },
          
          // Pages requiring permissions
          {
            path: 'send',
            element: (
              <PermissionRoute permission="operation:create">
                <SendSMS />
              </PermissionRoute>
            )
          },
          
          {
            path: 'history',
            element: (
              <PermissionRoute permission="operation:read">
                <MessageHistory />
              </PermissionRoute>
            )
          },
          
          {
            path: 'templates',
            element: (
              <PermissionRoute permission="templateEditing">
                <Templates />
              </PermissionRoute>
            )
          },
          
          {
            path: 'tags',
            element: (
              <PermissionRoute permission="templateEditing">
                <TagManagement />
              </PermissionRoute>
            )
          },
          
          // テナント設定画面 - SYSTEM_ADMINとTENANT_ADMINのみアクセス可能
          {
            path: 'settings',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN']}>
                <Settings />
              </RoleRoute>
            )
          },
          
          // ユーザー管理画面 - SYSTEM_ADMINとTENANT_ADMINのみアクセス可能
          {
            path: 'users',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN']}>
                <PermissionRoute permission="userManagement">
                  <UserManagement />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // テナント利用者管理画面 - TENANT_ADMINのみアクセス可能
          {
            path: 'tenant-users',
            element: (
              <RoleRoute role={['TENANT_ADMIN']}>
                <PermissionRoute permission="userManagement">
                  <TenantUserManagement />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // テナント管理画面 - SYSTEM_ADMINのみアクセス可能
          {
            path: 'system/tenants',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN']}>
                <TenantManagement />
              </RoleRoute>
            )
          },
          
          // 請求・支払いユーザー一覧画面 - SYSTEM_ADMINとTENANT_ADMINのみアクセス可能
          {
            path: 'billing/users',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <BillingUserList />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 利用者向け請求管理画面 - SYSTEM_ADMINのみアクセス可能
          {
            path: 'billing/endusers',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <BillingEndUserList />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求・支払い詳細画面 - システム管理者とテナント管理者はユーザー一覧から、運用管理者は直接アクセス可能
          {
            path: 'billing/:userId?',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATION_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <BillingManagement />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求書管理画面 - SYSTEM_ADMIN, TENANT_ADMINがアクセス可能
          {
            path: 'invoices',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <InvoiceManagement />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求書作成画面 - SYSTEM_ADMIN, TENANT_ADMINがアクセス可能
          {
            path: 'invoices/new',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <InvoiceCreate />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求書編集画面 - SYSTEM_ADMIN, TENANT_ADMINがアクセス可能
          {
            path: 'invoices/:id',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <InvoiceCreate isEdit={true} />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求書編集画面 - SYSTEM_ADMIN, TENANT_ADMIN, OPERATION_ADMINがアクセス可能
          {
            path: 'billing/invoice/edit',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATION_ADMIN']}>
                <PermissionRoute permission="billingAccess">
                  <InvoiceEdit />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          // 請求受領画面 - TENANT_ADMIN, OPERATION_ADMIN, OPERATION_USERがアクセス可能
          {
            path: 'invoices/received',
            element: (
              <RoleRoute role={['TENANT_ADMIN', 'OPERATION_ADMIN', 'OPERATION_USER']}>
                <InvoiceReceived />
              </RoleRoute>
            )
          },
          
          {
            path: 'shortener',
            element: (
              <PermissionRoute permission="apiAccess">
                <ShortenerTools />
              </PermissionRoute>
            )
          },
          
          {
            path: 'analytics',
            element: (
              <PermissionRoute permission="analyticsAccess">
                <Analytics />
              </PermissionRoute>
            )
          },
          
          {
            path: 'surveys',
            element: (
              <PermissionRoute permission="operation:read">
                <Surveys />
              </PermissionRoute>
            )
          },
          
          // アンケート作成画面 - OPERATION_USER以外がアクセス可能
          {
            path: 'surveys/create',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATION_ADMIN']}>
                <PermissionRoute permission="surveysCreation">
                  <SurveyCreate />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          {
            path: 'surveys/edit/:id',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATION_ADMIN']}>
                <PermissionRoute permission="surveysCreation">
                  <SurveyCreate />
                </PermissionRoute>
              </RoleRoute>
            )
          },
          
          {
            path: 'surveys/:surveyId/stats',
            element: (
              <PermissionRoute permission="analyticsAccess">
                <SurveyStats />
              </PermissionRoute>
            )
          },
          
          // ヘルプ＆サポート画面
          {
            path: 'support',
            element: <Support />
          },
          
          // FAQ管理画面 - SYSTEM_ADMINのみアクセス可能
          {
            path: 'faq-management',
            element: (
              <RoleRoute role={['SYSTEM_ADMIN']}>
                <FAQManagement />
              </RoleRoute>
            )
          },
          
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />
          }
        ]
      }
    ]
  }
], {
  future: {
    v7_normalizeFormMethod: true
  }
});

function App() {
  const { checkAuth, tenant } = useAuthStore();
  
  // アプリ起動時に認証状態をチェック
  useEffect(() => {
    console.log('App: 初期化中...');
    
    // 認証状態をチェック
    checkAuth().catch(err => {
      console.error('認証チェックエラー:', err);
    });
    
    console.log('App: 初期化完了');
  }, [checkAuth]);
  
  // テナント情報に基づいてページタイトルを更新
  useEffect(() => {
    if (tenant && tenant.name) {
      document.title = `${tenant.name} - SMS配信プラットフォーム`;
      
      // メタ情報も更新
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${tenant.name} - SMS配信プラットフォーム`);
      }
    } else {
      document.title = 'SMS配信プラットフォーム';
    }
  }, [tenant]);
  
  return <RouterProvider router={router} />;
}

export default App;