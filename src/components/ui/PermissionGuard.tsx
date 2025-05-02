import React, { ReactNode } from 'react';
import { Shield } from 'lucide-react';
import useAuthStore from '../../store/authStore';

interface PermissionGuardProps {
  requiredPermission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * 特定の権限が必要なコンポーネントをラップするガードコンポーネント
 * 権限がない場合は代替表示またはエラーメッセージを表示
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  requiredPermission, 
  children, 
  fallback,
  requireAll = false
}) => {
  const authStore = useAuthStore();
  
  const permissions = Array.isArray(requiredPermission) 
    ? requiredPermission 
    : [requiredPermission];
  
  const hasRequiredPermissions = requireAll
    ? permissions.every(p => authStore.hasPermission(p))
    : permissions.some(p => authStore.hasPermission(p));
  
  // 指定された権限を持っていれば子コンポーネントを表示
  if (hasRequiredPermissions) {
    return <>{children}</>;
  }
  
  // 代替表示がある場合はそれを表示
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // 代替表示がない場合はデフォルトのアクセス拒否メッセージ
  const permissionText = Array.isArray(requiredPermission)
    ? requiredPermission.join(requireAll ? ' と ' : ' または ')
    : requiredPermission;
  
  return (
    <div className="p-6 text-center bg-grey-50 rounded-lg border border-grey-200">
      <Shield className="mx-auto h-12 w-12 text-grey-300 mb-4" />
      <h3 className="text-lg font-medium text-grey-900 mb-2">アクセス権限がありません</h3>
      <p className="text-sm text-grey-600 mb-4">
        この機能を利用するには「{permissionText}」の権限が必要です。
      </p>
      <p className="text-xs text-grey-500">
        必要な場合は管理者にお問い合わせください。
      </p>
    </div>
  );
};

export default PermissionGuard; 