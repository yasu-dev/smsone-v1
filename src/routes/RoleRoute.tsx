import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface RoleRouteProps {
  role: string | string[];
  children: React.ReactNode;
}

// ロール階層定義
const roleHierarchy: Record<string, number> = {
  'SYSTEM_ADMIN': 100,
  'TENANT_ADMIN': 80,
  'OPERATION_ADMIN': 60,
  'OPERATION_USER': 40
};

const RoleRoute: React.FC<RoleRouteProps> = ({ role, children }) => {
  const { user } = useAuthStore();
  const roles = Array.isArray(role) ? role : [role];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ユーザーのロールと要求されたロールを比較
  const isAuthorized = roles.some(requiredRole => 
    roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  );

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute; 