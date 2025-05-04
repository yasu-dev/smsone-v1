import { UserRole } from '../../types/tenant';

export interface MockUserData {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt: string | null;
  createdAt: string;
  company: string;
  postalCode: string;
  phoneNumber: string;
  address: string;
  monthlyFee?: number;
  domesticSmsPrice?: number;
  internationalSmsPrice?: number;
  permissions: {
    internationalSms: boolean;
    templateEditing: boolean;
    bulkSending: boolean;
    apiAccess: boolean;
    scheduledSending: boolean;
    analyticsAccess: boolean;
    userManagement: boolean;
    surveysCreation: boolean;
  };
}

export interface MockActivityData {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

export interface MockContractData {
  id: string;
  userId: string;
  planName: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
  updatedAt: string;
}

// モック利用者データ
export const generateMockUsers = (): MockUserData[] => {
  return [
    // 運用管理者
    {
      id: 'operation-1',
      username: 'sample-company-admin',
      email: 'admin@samplecompany.co.jp',
      role: UserRole.OPERATION_ADMIN,
      status: 'active',
      tenant_id: 'sample-company',
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      company: 'サンプル会社',
      postalCode: '100-0001',
      phoneNumber: '03-1234-5678',
      address: '東京都千代田区',
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: true,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: true
      }
    },
    // 運用担当者
    {
      id: 'operation-2',
      username: 'sample-company-user',
      email: 'user@samplecompany.co.jp',
      role: UserRole.OPERATION_USER,
      status: 'active',
      tenant_id: 'sample-company',
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      company: 'サンプル会社',
      postalCode: '100-0001',
      phoneNumber: '03-1234-5678',
      address: '東京都千代田区',
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: true,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: false
      }
    },
    // テナント管理者配下のサービス利用者（operation-3 は sample-oem-push テナントに属する）
    {
      id: 'operation-3',
      username: 'tenant-company-admin',
      email: 'admin@tenantcompany.co.jp',
      role: UserRole.OPERATION_ADMIN,
      status: 'active',
      tenant_id: 'sample-oem-push',
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      company: 'テナント配下会社',
      postalCode: '160-0022',
      phoneNumber: '03-9876-5432',
      address: '東京都新宿区',
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: true,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: true
      }
    },
    // テナント管理者配下のサービス利用者をさらに追加（sample-oem-push テナントに属する）
    {
      id: 'operation-4',
      username: '山田商事',
      email: 'yamada@tenant-example.co.jp',
      role: UserRole.OPERATION_ADMIN,
      status: 'active',
      tenant_id: 'sample-oem-push',
      lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      company: '山田商事株式会社',
      postalCode: '150-0043',
      phoneNumber: '03-1111-2222',
      address: '東京都渋谷区道玄坂1-1-1',
      monthlyFee: 10000,
      domesticSmsPrice: 3.0,
      internationalSmsPrice: 10.0,
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: false,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: true
      }
    },
    {
      id: 'operation-5',
      username: '佐藤電機',
      email: 'info@sato-denki.co.jp',
      role: UserRole.OPERATION_USER,
      status: 'active',
      tenant_id: 'sample-oem-push',
      lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
      company: '佐藤電機株式会社',
      postalCode: '160-0023',
      phoneNumber: '03-3333-4444',
      address: '東京都新宿区西新宿2-2-2',
      monthlyFee: 8000,
      domesticSmsPrice: 3.0,
      internationalSmsPrice: 10.0,
      permissions: {
        internationalSms: false,
        templateEditing: true,
        bulkSending: true,
        apiAccess: false,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: false
      }
    },
    {
      id: 'operation-6',
      username: '田中運輸',
      email: 'contact@tanaka-unyu.co.jp',
      role: UserRole.OPERATION_ADMIN,
      status: 'active',
      tenant_id: 'sample-oem-push',
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      company: '田中運輸株式会社',
      postalCode: '108-0014',
      phoneNumber: '03-5555-6666',
      address: '東京都港区芝5-5-5',
      monthlyFee: 15000,
      domesticSmsPrice: 2.8,
      internationalSmsPrice: 9.5,
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: true,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: true
      }
    },
    {
      id: 'operation-7',
      username: '鈴木販売',
      email: 'suzuki@example.net',
      role: UserRole.OPERATION_USER,
      status: 'inactive',
      tenant_id: 'sample-oem-push',
      lastLoginAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      company: '鈴木販売株式会社',
      postalCode: '210-0005',
      phoneNumber: '044-1111-2222',
      address: '神奈川県川崎市川崎区3-3-3',
      monthlyFee: 5000,
      domesticSmsPrice: 3.2,
      internationalSmsPrice: 10.5,
      permissions: {
        internationalSms: false,
        templateEditing: true,
        bulkSending: false,
        apiAccess: false,
        scheduledSending: false,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: false
      }
    },
    {
      id: 'operation-8',
      username: '高橋工業',
      email: 'info@takahashi-kogyo.co.jp',
      role: UserRole.OPERATION_ADMIN,
      status: 'pending',
      tenant_id: 'sample-oem-push',
      lastLoginAt: null, // 未ログインのケース
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      company: '高橋工業株式会社',
      postalCode: '330-0845',
      phoneNumber: '048-7777-8888',
      address: '埼玉県さいたま市大宮区4-4-4',
      monthlyFee: 12000,
      domesticSmsPrice: 3.0,
      internationalSmsPrice: 10.0,
      permissions: {
        internationalSms: true,
        templateEditing: true,
        bulkSending: true,
        apiAccess: true,
        scheduledSending: true,
        analyticsAccess: true,
        userManagement: false,
        surveysCreation: true
      }
    }
  ];
};

// モックアクティビティログ生成
export const generateMockActivityLogs = (users: MockUserData[]): MockActivityData[] => {
  const actions = [
    'ログイン',
    'プロフィール更新',
    'パスワード変更',
    'SMS送信',
    'テンプレート作成',
    '一括送信実行',
    '設定変更',
    'API利用',
    'ログイン失敗'
  ];
  
  const logs: MockActivityData[] = [];
  
  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();
    
    logs.push({
      id: `log-${i + 1}`,
      userId: user.id,
      action,
      timestamp,
      details: `${user.username}が${action}を実行しました（${Math.random() > 0.5 ? 'Webアプリ' : 'モバイルアプリ'}から）`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    });
  }
  
  // タイムスタンプでソート（新しい順）
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return logs;
};

// モック契約データ生成
export const generateMockContracts = (users: MockUserData[]): MockContractData[] => {
  const plans = ['スタンダードプラン', 'プレミアムプラン', 'エンタープライズプラン', 'スモールビジネスプラン', 'フリープラン'];
  const fees = [0, 5000, 10000, 30000, 50000, 100000];
  const statuses: Array<'active' | 'expired' | 'pending'> = ['active', 'expired', 'pending'];
  
  return users.map(user => {
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    return {
      id: `contract-${user.id}`,
      userId: user.id,
      planName: plans[Math.floor(Math.random() * plans.length)],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthlyFee: fees[Math.floor(Math.random() * fees.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: startDate.toISOString(),
      updatedAt: new Date(startDate.getTime() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
    };
  });
}; 