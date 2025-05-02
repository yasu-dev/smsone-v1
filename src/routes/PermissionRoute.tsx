import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Shield } from 'lucide-react';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

/**
 * 特定の権限を要求するルートコンポーネント
 * 権限がない場合はアクセス拒否メッセージを表示
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const authStore = useAuthStore();

  if (!authStore.hasPermission(permission)) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center bg-white p-8 rounded-lg border border-grey-200 shadow-sm">
          <Shield className="mx-auto h-16 w-16 text-grey-300 mb-4" />
          <h2 className="text-2xl font-medium text-grey-900 mb-3">アクセス権限がありません</h2>
          <p className="text-grey-600 mb-6">
            このページを表示するには「{permission}」の権限が必要です。
            必要な権限がない場合は、管理者にお問い合わせください。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              前のページに戻る
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              ダッシュボードへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionRoute; 