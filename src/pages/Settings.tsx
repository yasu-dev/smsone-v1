import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import SecuritySettings from '../components/settings/SecuritySettings';
import BillingSettings from '../components/settings/BillingSettings';
import MessagingSettings from '../components/settings/MessagingSettings';
import HelpSupport from '../components/settings/HelpSupport';
import TenantSettingsTab from '../components/settings/TenantSettingsTab';
import { useNavigate } from 'react-router-dom';
import { SETTINGS_ROUTES, SettingsTab } from '../constants/routes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

// 管理者向け設定画面
const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tenant');
  const { user } = useAuthStore();
  // SYSTEM_ADMINかどうか
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';
  const navigate = useNavigate();

  // タブを切り替える処理
  const handleTabChange = (tab: SettingsTab) => {
    if (tab === 'billing' && isSystemAdmin) {
      navigate('/dashboard/billing/users');
      return;
    }
    setActiveTab(tab);
  };

  // ユーザーがアクセス可能なメニュー項目をフィルタリング
  const filteredSettingsRoutes = SETTINGS_ROUTES.filter(route => {
    // requiredRolesが定義されていない場合はアクセス可能
    if (!route.requiredRoles) return true;
    // ユーザーのロールがrequiredRolesに含まれている場合はアクセス可能
    return route.requiredRoles.includes(user?.role || '');
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">設定</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-grey-200">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              {filteredSettingsRoutes.map(route => (
                <TabsTrigger key={route.id} value={route.id}>
                  {route.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {filteredSettingsRoutes.map(route => (
              <TabsContent key={route.id} value={route.id} className="mt-2">
                {route.id === 'tenant' && <TenantSettingsTab />}
                {route.id === 'security' && <SecuritySettings />}
                {route.id === 'billing' && <BillingSettings />}
                {route.id === 'messaging' && <MessagingSettings />}
                {route.id === 'support' && <HelpSupport />}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;