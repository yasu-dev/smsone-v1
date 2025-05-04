import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// 料金設定の型定義
interface PriceSettings {
  id: string;
  targetType: 'tenant' | 'user'; // テナント向け or 利用者向け
  targetId?: string; // 特定のテナント/利用者ID (全体設定の場合は未指定)
  serviceFee: number; // サービス利用料
  domesticSmsRate: number; // 国内SMS単価
  internationalSmsRate: number; // 国際SMS単価
  updatedAt: string;
  updatedBy: string;
}

// モック：料金設定データの取得
const fetchPriceSettings = async (currentUserId: string, currentUserRole: string): Promise<PriceSettings[]> => {
  // 実際の実装ではAPIから取得
  await new Promise(resolve => setTimeout(resolve, 500)); // モック遅延
  
  const mockSettings: PriceSettings[] = [];
  
  // システム管理者の場合
  if (currentUserRole === 'SYSTEM_ADMIN') {
    // テナント向け全体設定
    mockSettings.push({
      id: 'price-tenant-default',
      targetType: 'tenant',
      serviceFee: 400000,
      domesticSmsRate: 5,
      internationalSmsRate: 8,
      updatedAt: '2023-12-01T00:00:00Z',
      updatedBy: currentUserId
    });
    
    // 特定テナント向け個別設定
    mockSettings.push({
      id: 'price-tenant-1',
      targetType: 'tenant',
      targetId: 'tenant-1',
      serviceFee: 350000,
      domesticSmsRate: 4.5,
      internationalSmsRate: 7.5,
      updatedAt: '2023-12-15T00:00:00Z',
      updatedBy: currentUserId
    });
    
    // 利用者向け全体設定
    mockSettings.push({
      id: 'price-user-default',
      targetType: 'user',
      serviceFee: 300000,
      domesticSmsRate: 8,
      internationalSmsRate: 12,
      updatedAt: '2023-12-01T00:00:00Z',
      updatedBy: currentUserId
    });
  }
  
  // テナント管理者の場合
  if (currentUserRole === 'TENANT_ADMIN') {
    // 利用者向け全体設定
    mockSettings.push({
      id: 'price-user-tenant-default',
      targetType: 'user',
      serviceFee: 500000,
      domesticSmsRate: 8,
      internationalSmsRate: 12,
      updatedAt: '2023-12-10T00:00:00Z',
      updatedBy: currentUserId
    });
    
    // 特定利用者向け個別設定
    mockSettings.push({
      id: 'price-user-1',
      targetType: 'user',
      targetId: 'user-1',
      serviceFee: 450000,
      domesticSmsRate: 7.5,
      internationalSmsRate: 11,
      updatedAt: '2023-12-20T00:00:00Z',
      updatedBy: currentUserId
    });
  }
  
  return mockSettings;
};

// モック：料金設定の保存
const savePriceSettings = async (settings: PriceSettings): Promise<PriceSettings> => {
  // 実際の実装ではAPIに保存
  await new Promise(resolve => setTimeout(resolve, 800)); // モック遅延
  
  return {
    ...settings,
    updatedAt: new Date().toISOString()
  };
};

const PriceSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PriceSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // 料金設定データの取得
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPriceSettings(user.id, user.role);
        setSettings(data);
        
        // 初期表示時はセクションを全て展開
        const expanded: Record<string, boolean> = {};
        data.forEach(setting => {
          expanded[setting.id] = true;
        });
        setExpandedSections(expanded);
      } catch (error) {
        console.error('Failed to fetch price settings:', error);
        setError('料金設定の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  // セクションの展開/折りたたみを切り替え
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // 料金設定の更新
  const handleUpdateSetting = (id: string, field: keyof PriceSettings, value: number) => {
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id 
          ? { ...setting, [field]: value } 
          : setting
      )
    );
  };
  
  // 料金設定の保存
  const handleSaveSetting = async (setting: PriceSettings) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      const updatedSetting = await savePriceSettings({
        ...setting,
        updatedBy: user.id
      });
      
      // 成功したら設定を更新
      setSettings(prevSettings => 
        prevSettings.map(s => 
          s.id === updatedSetting.id ? updatedSetting : s
        )
      );
      
      toast.success('料金設定を保存しました');
    } catch (error) {
      console.error('Failed to save price setting:', error);
      setError('料金設定の保存に失敗しました');
      toast.error('料金設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 対象種別の表示名
  const getTargetTypeLabel = (targetType: 'tenant' | 'user', targetId?: string) => {
    if (targetType === 'tenant') {
      return targetId ? '特定テナント向け' : 'テナント向け（デフォルト）';
    } else {
      return targetId ? '特定利用者向け' : '利用者向け（デフォルト）';
    }
  };
  
  // 金額の表示フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-grey-900">価格設定</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-error-50 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-error-700">{error}</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-grey-50 rounded-md p-8 text-center">
          <p className="text-grey-500">表示できる料金設定がありません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {user?.role === 'SYSTEM_ADMIN' && (
            <div className="bg-grey-50 p-4 rounded-md">
              <p className="text-sm text-grey-700">
                <strong>システム管理者として</strong>、テナント向けと利用者向けの両方の料金を設定できます。
              </p>
            </div>
          )}
          
          {user?.role === 'TENANT_ADMIN' && (
            <div className="bg-grey-50 p-4 rounded-md">
              <p className="text-sm text-grey-700">
                <strong>テナント管理者として</strong>、利用者向けの料金を設定できます。
              </p>
            </div>
          )}
          
          {settings.map(setting => (
            <div key={setting.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div 
                className="p-4 border-b border-grey-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection(setting.id)}
              >
                <div>
                  <h3 className="font-medium text-grey-900">
                    {getTargetTypeLabel(setting.targetType, setting.targetId)}
                  </h3>
                  <p className="text-sm text-grey-500">
                    更新日: {new Date(setting.updatedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <button className="p-1 text-grey-500 hover:text-grey-700">
                  {expandedSections[setting.id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {expandedSections[setting.id] && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor={`${setting.id}-serviceFee`} className="block text-sm font-medium text-grey-700 mb-1">
                        サービス利用料
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id={`${setting.id}-serviceFee`}
                          className="form-input mr-2"
                          value={setting.serviceFee}
                          onChange={(e) => handleUpdateSetting(setting.id, 'serviceFee', Number(e.target.value))}
                          min="0"
                        />
                        <span className="text-grey-500">円 / 月</span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`${setting.id}-domesticSmsRate`} className="block text-sm font-medium text-grey-700 mb-1">
                        国内SMS単価
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id={`${setting.id}-domesticSmsRate`}
                          className="form-input mr-2"
                          value={setting.domesticSmsRate}
                          onChange={(e) => handleUpdateSetting(setting.id, 'domesticSmsRate', Number(e.target.value))}
                          min="0"
                          step="0.1"
                        />
                        <span className="text-grey-500">円 / 通</span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`${setting.id}-internationalSmsRate`} className="block text-sm font-medium text-grey-700 mb-1">
                        国際SMS単価
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id={`${setting.id}-internationalSmsRate`}
                          className="form-input mr-2"
                          value={setting.internationalSmsRate}
                          onChange={(e) => handleUpdateSetting(setting.id, 'internationalSmsRate', Number(e.target.value))}
                          min="0"
                          step="0.1"
                        />
                        <span className="text-grey-500">円 / 通</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        className="btn-primary flex items-center gap-1"
                        onClick={() => handleSaveSetting(setting)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            保存
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PriceSettings; 