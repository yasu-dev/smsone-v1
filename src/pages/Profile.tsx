import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Save, Building, Upload, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SettingCard from '../components/ui/SettingCard';

// ユーザーロールの定義
enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  OPERATION_ADMIN = 'OPERATION_ADMIN',
  OPERATION_USER = 'OPERATION_USER'
}

const Profile: React.FC = () => {
  console.log('Profile: コンポーネントのレンダリング開始');
  const { user, tenant, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    companyName: '',
    postalCode: '',
    address: '',
    phoneNumber: '',
    contactEmail: '',
    sealImage: ''
  });
  
  useEffect(() => {
    // ユーザー情報をフォームデータに設定
    if (user) {
      setFormData({
        ...formData,
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        companyName: user.companyName || '',
        postalCode: user.postalCode || '',
        address: user.address || '',
        phoneNumber: user.phoneNumber || '',
        contactEmail: user.contactEmail || user.email || '',
        sealImage: user.sealImage || ''
      });
    }
    console.log('Profile: コンポーネントがマウントされました');
    console.log('Profile: ユーザー情報:', user);
  }, [user]);

  // ロール表示名の変換
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'SYSTEM_ADMIN': 'システム管理者',
      'TENANT_ADMIN': 'テナント管理者',
      'OPERATION_ADMIN': '運用管理者',
      'OPERATION_USER': '運用担当者'
    };
    return roleMap[role] || role;
  };

  // 権限説明の取得
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'システム管理者はプラットフォーム全体の設定、テナント管理、ユーザー管理などすべての機能にアクセスできます。';
      case 'TENANT_ADMIN':
        return 'テナント管理者は所属テナント内のユーザー管理、請求設定、メッセージング設定などにアクセスできます。';
      case 'OPERATION_ADMIN':
        return '運用管理者は日常的な運用管理、請求確認、メッセージング設定にアクセスできます。';
      case 'OPERATION_USER':
        return '運用担当者は基本的なメッセージング機能とサポート機能のみにアクセスできます。';
      default:
        return '権限が設定されていません。';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          sealImage: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // モック処理としてタイムアウトを入れる
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 実際のアプリではここでAPI呼び出しなどで保存処理を行う
      // ここではストアの更新関数を呼び出す
      if (user) {
        updateUser({
          ...user,
          username: formData.username,
          email: formData.email,
          companyName: formData.companyName,
          postalCode: formData.postalCode,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          contactEmail: formData.contactEmail,
          sealImage: formData.sealImage
        });
      }
      
      toast.success('プロフィール情報を更新しました');
      setIsEditing(false);
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">プロフィール</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          <SettingCard>
            <SettingCard.Header>
              <div className="flex justify-between items-center">
                <div>
                  <SettingCard.Title>プロフィール設定</SettingCard.Title>
                  <SettingCard.Description>
                    アカウント情報を確認・編集できます
                  </SettingCard.Description>
                </div>
                <button
                  type="button"
                  onClick={() => isEditing ? handleSubmit() : setIsEditing(true)}
                  disabled={isLoading}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    isEditing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      処理中...
                    </span>
                  ) : isEditing ? (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </span>
                  ) : (
                    "編集"
                  )}
                </button>
              </div>
            </SettingCard.Header>
            <SettingCard.Content>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        ユーザー名
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        メールアドレス
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">運用会社情報</h3>
                  <p className="text-sm text-gray-500 mb-4">この情報は請求書の請求元情報として使用されます</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                        運用会社名
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        郵便番号
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          placeholder="例: 285-0858"
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        住所
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          rows={3}
                          placeholder="例: 千葉県佐倉市ユーカリが丘4-1-1 3F"
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        電話番号
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          placeholder="例: 043-330-7050"
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                        連絡先メールアドレス
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="contactEmail"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          readOnly={!isEditing}
                          placeholder="例: contact@topaz.jp"
                          className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="sealImage" className="block text-sm font-medium text-gray-700">
                        印鑑データ
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        {formData.sealImage ? (
                          <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                            <img 
                              src={formData.sealImage} 
                              alt="印鑑" 
                              className="w-full h-full object-contain" 
                            />
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, sealImage: ''})}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-24 h-24 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                            <Building className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        {isEditing && (
                          <div>
                            <input
                              type="file"
                              id="sealImage"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={handleFileButtonClick}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {formData.sealImage ? '画像を変更' : '画像をアップロード'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">ロールと権限</h3>
                  <div className="mt-2">
                    <div className="rounded-md bg-blue-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            現在のロール: {getRoleDisplayName(formData.role)}
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>{getRoleDescription(formData.role)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SettingCard.Content>
          </SettingCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;