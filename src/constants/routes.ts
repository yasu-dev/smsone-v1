/** @jsxImportSource react */
import React from 'react';
import { 
  Home, Send, History, FileText, Settings, Users, 
  BarChart2, FileQuestion, Bell, CreditCard, HelpCircle, Tag, Building,
  Receipt, Landmark, ScrollText, Briefcase, Plus, File, DollarSign
} from 'lucide-react';

export interface RouteItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  children?: RouteItem[];
}

// アイコンを作成する関数
const createIcon = (Icon: any) => React.createElement(Icon, {});

// サイドバーメニュー定義 - 要件に従って再構築
export const SIDEBAR_ROUTES: RouteItem[] = [
  {
    path: '/dashboard',
    label: 'ダッシュボード',
    icon: createIcon(Home),
  },
  {
    path: '/dashboard/send',
    label: 'SMS送信',
    icon: createIcon(Send),
  },
  {
    path: '/dashboard/history',
    label: '送信履歴管理',
    icon: createIcon(History),
  },
  {
    path: '/dashboard/templates',
    label: 'テンプレート管理',
    icon: createIcon(FileText),
  },
  {
    path: '/dashboard/tags',
    label: 'タグ管理',
    icon: createIcon(Tag),
  },
  {
    path: '/dashboard/surveys',
    label: 'アンケート管理',
    icon: createIcon(FileQuestion),
    requiredPermissions: ['surveysCreation'],
  },
  {
    path: '/dashboard/analytics',
    label: '分析',
    icon: createIcon(BarChart2),
  },
  // システム管理（システム管理者のみ）
  {
    path: '/dashboard/system',
    label: 'システム管理',
    icon: createIcon(Briefcase),
    requiredRoles: ['SYSTEM_ADMIN'],
    children: [
      {
        path: '/dashboard/system/tenants',
        label: 'テナント管理',
        icon: createIcon(Building),
        requiredRoles: ['SYSTEM_ADMIN'],
      },
      {
        path: '/dashboard/users',
        label: '利用者管理',
        icon: createIcon(Users),
        requiredRoles: ['SYSTEM_ADMIN'],
      },
      {
        path: '/dashboard/invoices',
        label: '請求管理',
        icon: createIcon(CreditCard),
        requiredRoles: ['SYSTEM_ADMIN'],
      }
    ]
  },
  // テナント管理（テナント管理者のみ）
  {
    path: '/dashboard/tenant',
    label: 'テナント管理',
    icon: createIcon(Building),
    requiredRoles: ['TENANT_ADMIN'],
    children: [
      {
        path: '/dashboard/tenant-users',
        label: '利用者管理',
        icon: createIcon(Users),
        requiredRoles: ['TENANT_ADMIN'],
      },
      {
        path: '/dashboard/invoices',
        label: '請求管理',
        icon: createIcon(CreditCard),
        requiredRoles: ['TENANT_ADMIN'],
      }
    ]
  },
  // 請求受領（テナント管理者、サービス利用者）
  {
    path: '/dashboard/invoices/received',
    label: '請求受領管理',
    icon: createIcon(ScrollText),
    requiredRoles: ['TENANT_ADMIN', 'OPERATION_ADMIN', 'OPERATION_USER'],
  },
  {
    path: '/dashboard/support',
    label: 'ヘルプ＆サポート',
    icon: createIcon(HelpCircle),
  },
];

// 設定画面のタブメニュー定義
export type SettingsTab = 
  | 'security' 
  | 'billing' 
  | 'messaging' 
  | 'support'
  | 'tenant';

export const SETTINGS_ROUTES: {id: SettingsTab, label: string, icon: React.ReactNode, requiredRoles?: string[]}[] = []; 