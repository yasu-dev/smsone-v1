import React, { useEffect, memo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTenant } from '../store/TenantContext';
import useAuthStore from '../store/authStore';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading: tenantLoading } = useTenant();
  const { 
    isAuthenticated, 
    isLoading: authLoading,
    user: authUser
  } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute: 現在のパス:', location.pathname);
    console.log('ProtectedRoute: 認証状態:', { isAuthenticated, user: !!user, authUser: !!authUser });
  }, [location, isAuthenticated, user, authUser]);

  // 認証とテナント情報の読み込み状態を確認
  const isLoading = tenantLoading || authLoading;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>;
  }

  // TenantContextのユーザーまたはAuthStoreの認証状態のどちらかがあればOK
  if (!user && !isAuthenticated && !authUser) {
    console.log('ProtectedRoute: 認証されていないためリダイレクト');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: 認証OK、コンテンツを表示');
  return <Outlet />;
};

// memoを使用してコンポーネントをメモ化
export default memo(ProtectedRoute);