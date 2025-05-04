import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Save, Building, Upload, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SettingCard from '../components/ui/SettingCard';
import { motion } from 'framer-motion';

// 口座種別の型定義
type AccountType = 'ordinary' | 'checking';

// 銀行情報の型定義
interface BankInfo {
  bankName: string;
  branchName: string;
  accountType: AccountType;
  accountNumber: string;
  accountHolder: string;
}

// 利用者ロールの定義
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
    sealImage: '',
    bankInfo: {
      bankName: '',
      branchName: '',
      accountType: 'ordinary' as AccountType,
      accountNumber: '',
      accountHolder: ''
    }
  });
  
  useEffect(() => {
    // 利用者情報をフォームデータに設定
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
        sealImage: user.sealImage || '',
        bankInfo: user.bankInfo || {
          bankName: '三菱UFJ銀行',
          branchName: '渋谷支店',
          accountType: 'ordinary' as AccountType,
          accountNumber: '1234567',
          accountHolder: 'トパーズ（ゴウドウガイシャ'
        }
      });
    }
    console.log('Profile: コンポーネントがマウントされました');
    console.log('Profile: 利用者情報:', user);
  }, [user]);

  // ロール表示名の変換
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'SYSTEM_ADMIN': 'システム管理者',
      'TENANT_ADMIN': 'テナント管理者',
      'OPERATION_ADMIN': '利用者（管理者権限）',
      'OPERATION_USER': '利用者'
    };
    return roleMap[role] || role;
  };

  // 権限説明の取得
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'システム管理者はプラットフォーム全体の設定、テナント管理、利用者管理などすべての機能にアクセスできます。';
      case 'TENANT_ADMIN':
        return 'テナント管理者は所属テナント内の利用者管理、請求設定、メッセージング設定などにアクセスできます。';
      case 'OPERATION_ADMIN':
        return '利用者（管理者権限）は日常的な運用管理、請求確認、メッセージング設定にアクセスできます。';
      case 'OPERATION_USER':
        return '利用者は基本的なメッセージング機能とサポート機能のみにアクセスできます。';
      default:
        return '権限が設定されていません。';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setFormData({
        ...formData,
        bankInfo: {
          ...formData.bankInfo,
          [bankField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
          sealImage: formData.sealImage,
          bankInfo: formData.bankInfo
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">プロフィール</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 flex justify-between items-center border-b border-grey-200">
          <div>
            <h2 className="text-lg font-medium">プロフィール設定</h2>
            <p className="text-sm text-grey-500">アカウント情報の確認・編集ができます</p>
          </div>
          <button
            type="button"
            onClick={() => isEditing ? handleSubmit() : setIsEditing(true)}
            disabled={isLoading}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              isEditing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-grey-700 border border-grey-300 hover:bg-grey-50'
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
        
        <div className="p-6">
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex">
                <div className="ml-2">
                  <h3 className="text-sm font-medium text-blue-800">
                    現在のロール: {getRoleDisplayName(formData.role)}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{getRoleDescription(formData.role)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-grey-900 mb-4">基本情報</h3>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-grey-700">
                    利用者名
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-grey-900 mb-4">運用会社情報</h3>
              <p className="text-sm text-grey-500 mb-4">この情報は請求書の請求元情報として使用されます</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-grey-700">
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
                        isEditing ? 'border-grey-300' : 'border-grey-300 bg-grey-50'
                      }`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="sealImage" className="block text-sm font-medium text-grey-700 mb-2">
                    印鑑データ
                  </label>
                  <div className="mt-1 flex items-center space-x-4 bg-grey-50 p-4 rounded-lg border border-grey-200">
                    {formData.sealImage ? (
                      <div className="relative w-24 h-24 border border-grey-300 rounded-md overflow-hidden bg-white">
                        <img 
                          src={formData.sealImage} 
                          alt="印鑑" 
                          className="w-full h-full object-contain" 
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, sealImage: ''})}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 border border-grey-300 rounded-md flex items-center justify-center bg-white">
                        <Building className="h-8 w-8 text-grey-300" />
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
                          className="inline-flex items-center px-4 py-2 border border-grey-300 rounded-md shadow-sm text-sm font-medium text-grey-700 bg-white hover:bg-grey-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
              <h3 className="text-lg font-medium text-grey-900 mb-4">振込先情報</h3>
              <p className="text-sm text-grey-500 mb-4">この情報は請求書のお支払い先情報として表示されます</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 bg-grey-50 p-5 rounded-lg border border-grey-200">
                <div>
                  <label htmlFor="bank.bankName" className="block text-sm font-medium text-grey-700">
                    銀行名
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bank.bankName"
                      name="bank.bankName"
                      value={formData.bankInfo.bankName}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      placeholder="例: 三菱UFJ銀行"
                      className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        isEditing ? 'border-grey-300 bg-white' : 'border-grey-300 bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bank.branchName" className="block text-sm font-medium text-grey-700">
                    支店名
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bank.branchName"
                      name="bank.branchName"
                      value={formData.bankInfo.branchName}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      placeholder="例: 渋谷支店"
                      className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        isEditing ? 'border-grey-300 bg-white' : 'border-grey-300 bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bank.accountType" className="block text-sm font-medium text-grey-700">
                    口座種別
                  </label>
                  <div className="mt-1">
                    <select
                      id="bank.accountType"
                      name="bank.accountType"
                      value={formData.bankInfo.accountType}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        isEditing ? 'border-grey-300 bg-white' : 'border-grey-300 bg-white'
                      }`}
                    >
                      <option value="ordinary">普通</option>
                      <option value="checking">当座</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="bank.accountNumber" className="block text-sm font-medium text-grey-700">
                    口座番号
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bank.accountNumber"
                      name="bank.accountNumber"
                      value={formData.bankInfo.accountNumber}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      placeholder="例: 1234567"
                      className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        isEditing ? 'border-grey-300 bg-white' : 'border-grey-300 bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="bank.accountHolder" className="block text-sm font-medium text-grey-700">
                    口座名義
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bank.accountHolder"
                      name="bank.accountHolder"
                      value={formData.bankInfo.accountHolder}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      placeholder="例: トパーズ（ゴウドウガイシャ"
                      className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        isEditing ? 'border-grey-300 bg-white' : 'border-grey-300 bg-white'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-grey-500">
                    ※カタカナで入力してください
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;