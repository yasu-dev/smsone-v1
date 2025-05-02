import React, { useState, useEffect } from 'react';
import { Building, Layout, Paintbrush, Save, RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const TenantSettingsTab: React.FC = () => {
  const { tenant, updateTenant, user, hasPermission } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || 'SMSOne',
    domain: tenant?.domain || '',
    subdomain: tenant?.subdomain || '',
    logoUrl: tenant?.logoUrl || '',
    primaryColor: tenant?.primaryColor || '#4f46e5',
    secondaryColor: tenant?.secondaryColor || '#9333ea',
  });

  // テナント情報が変更されたら再設定
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || 'SMSOne',
        domain: tenant.domain || '',
        subdomain: tenant.subdomain || '',
        logoUrl: tenant.logoUrl || '',
        primaryColor: tenant.primaryColor || '#4f46e5',
        secondaryColor: tenant.secondaryColor || '#9333ea',
      });
    }
  }, [tenant]);

  // テナントまたはユーザー情報が存在しない場合
  if (!tenant || !user) {
    return (
      <div className="text-center py-10">
        <Building className="h-10 w-10 text-grey-400 mx-auto mb-4" />
        <h3 className="text-base font-medium text-grey-900">テナント情報が読み込めません</h3>
        <p className="mt-2 text-sm text-grey-500">再度ログインしてください</p>
      </div>
    );
  }

  // SYSTEM_ADMINまたはTENANT_ADMINのみアクセス可能に修正
  if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'TENANT_ADMIN') {
    return (
      <div className="text-center py-10">
        <Building className="h-10 w-10 text-grey-400 mx-auto mb-4" />
        <h3 className="text-base font-medium text-grey-900">テナント設定にアクセスする権限がありません</h3>
        <p className="mt-2 text-sm text-grey-500">システム管理者またはテナント管理者のみがアクセスできます</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // カラー選択の場合、リアルタイムでプレビュー
    if (name === 'primaryColor' || name === 'secondaryColor') {
      const root = document.documentElement;
      if (name === 'primaryColor') {
        root.style.setProperty('--color-primary-600', value);
      } else if (name === 'secondaryColor') {
        root.style.setProperty('--color-primary-700', value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ドメイン形式の検証
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
      if (!domainRegex.test(formData.domain)) {
        toast.error('有効なドメイン形式を入力してください');
        setIsLoading(false);
        return;
      }

      // 色コードの検証
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(formData.primaryColor) || !colorRegex.test(formData.secondaryColor)) {
        toast.error('有効なカラーコード（#000000形式）を入力してください');
        setIsLoading(false);
        return;
      }

      // APIリクエストの代わりにupdateTenant呼び出し
      await new Promise(resolve => setTimeout(resolve, 800)); // 処理時間シミュレーション
      
      // tenantが存在し、かつidが確実にあることを確認
      if (!tenant || !tenant.id) {
        toast.error('テナント情報が不正です');
        setIsLoading(false);
        return;
      }
      
      updateTenant({
        ...tenant,
        name: formData.name,
        domain: formData.domain,
        subdomain: formData.subdomain,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        updatedAt: new Date().toISOString(),
      });

      toast.success('テナント設定を更新しました');
      
      // テーマカラーをドキュメントに適用
      document.documentElement.style.setProperty('--color-primary-600', formData.primaryColor);
      document.documentElement.style.setProperty('--color-primary-700', formData.secondaryColor);
      
    } catch (error) {
      toast.error('設定の更新に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-grey-900 mb-6 flex items-center">
        <Building className="mr-2 h-5 w-5 text-primary-600" />
        テナント設定
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本情報 */}
          <div className="bg-white p-5 rounded-lg border border-grey-200 space-y-4">
            <h3 className="text-base font-medium text-grey-900 flex items-center">
              <Layout className="mr-2 h-4 w-4 text-grey-500" />
              基本情報
            </h3>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-grey-700 mb-1">
                テナント名
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-grey-700 mb-1">
                ドメイン
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className="form-input"
                placeholder="example.com"
                required
              />
              <p className="mt-1 text-xs text-grey-500">顧客がアクセスするドメイン（例: example.com）</p>
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-grey-700 mb-1">
                サブドメイン
              </label>
              <div className="flex rounded-md">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleInputChange}
                  className="form-input rounded-r-none"
                  placeholder="app"
                />
                <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-grey-300 bg-grey-50 text-grey-500 text-sm">
                  .{formData.domain}
                </span>
              </div>
              <p className="mt-1 text-xs text-grey-500">アプリケーションのサブドメイン（例: app.example.com）</p>
            </div>
          </div>

          {/* ブランディング */}
          <div className="bg-white p-5 rounded-lg border border-grey-200 space-y-4">
            <h3 className="text-base font-medium text-grey-900 flex items-center">
              <Paintbrush className="mr-2 h-4 w-4 text-grey-500" />
              ブランディング
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-grey-700 mb-1">
                  メインカラー
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    disabled
                    className="w-8 h-8 rounded border-0 p-0 mr-2 cursor-not-allowed opacity-70"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    disabled
                    className="form-input cursor-not-allowed bg-grey-50"
                    placeholder="#4f46e5"
                  />
                </div>
                <p className="mt-1 text-xs text-grey-500">メインカラーの変更はできません</p>
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-grey-700 mb-1">
                  サブカラー
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    disabled
                    className="w-8 h-8 rounded border-0 p-0 mr-2 cursor-not-allowed opacity-70"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    disabled
                    className="form-input cursor-not-allowed bg-grey-50"
                    placeholder="#9333ea"
                  />
                </div>
                <p className="mt-1 text-xs text-grey-500">サブカラーの変更はできません</p>
              </div>
            </div>

            {/* プレビュー */}
            <div className="mt-4 pt-4 border-t border-grey-200">
              <label className="block text-sm font-medium text-grey-700 mb-3">プレビュー</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  プライマリボタン
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  セカンダリボタン
                </button>
                <div
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ 
                    color: formData.primaryColor,
                    backgroundColor: `${formData.primaryColor}10`
                  }}
                >
                  テキスト
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              // テナントのオリジナル値に戻す
              setFormData({
                name: tenant.name,
                domain: tenant.domain,
                subdomain: tenant.subdomain || '',
                logoUrl: tenant.logoUrl || '',
                primaryColor: tenant.primaryColor || '#4f46e5',
                secondaryColor: tenant.secondaryColor || '#9333ea',
              });
              toast.success('変更をリセットしました');
            }}
            className="px-4 py-2 border border-grey-300 rounded-md text-sm font-medium text-grey-700 bg-white hover:bg-grey-50"
          >
            <RefreshCw className="inline-block mr-1.5 h-4 w-4" />
            リセット
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center"
          >
            {isLoading ? (
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            設定を保存
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantSettingsTab; 