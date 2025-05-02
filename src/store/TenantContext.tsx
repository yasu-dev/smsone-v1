import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Tenant, TenantUser, TenantContextType, UserRole } from '../types/tenant';
import useAuthStore from './authStore';

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // AuthStoreから認証情報を取得
  const { 
    user: authUser, 
    tenant: authTenant, 
    isAuthenticated,
    logout: authLogout
  } = useAuthStore();

  useEffect(() => {
    const initializeTenant = async () => {
      try {
        // AuthStoreからユーザー情報とテナント情報を取得
        if (isAuthenticated && authUser) {
          // AuthStoreのユーザー情報をTenantUserに変換
          const tenantUser: TenantUser = {
            id: authUser.id,
            tenantId: authUser.tenant_id,
            email: authUser.email,
            role: authUser.role as UserRole,
            permissions: Object.entries(authUser.permissions || {})
              .filter(([_, value]) => value === true)
              .map(([key]) => key)
          };
          
          setUser(tenantUser);
          if (authTenant) {
            const mappedTenant: Tenant = {
              id: authTenant.id,
              name: authTenant.name || 'Topaz合同会社のSMSOne',
              domain: authTenant.domain,
              theme: {
                primaryColor: authTenant.primaryColor || '#4f46e5',
                secondaryColor: authTenant.secondaryColor || '#9333ea',
                logoUrl: authTenant.logoUrl || '/logo.svg'
              },
              settings: {
                smsSenderId: 'DEMO',
                maxSmsPerDay: 1000,
                allowedCountries: ['JP']
              }
            };
            setTenant(mappedTenant);
          }
        }
      } catch (err) {
        console.error('テナント初期化エラー:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, [isAuthenticated, authUser, authTenant]);

  const logout = () => {
    setUser(null);
    setTenant(null);
    authLogout(); // AuthStoreのログアウト処理も呼び出す
  };

  // useMemoを使用してコンテキスト値をメモ化
  const contextValue = useMemo(() => ({
    tenant,
    user,
    isLoading: isLoading && !user,
    error,
    setTenant,
    setUser,
    logout,
  }), [tenant, user, isLoading, error]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}; 