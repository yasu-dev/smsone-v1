import { create } from 'zustand';
import { SenderNumber, CarrierType, Carrier } from '../types';
import useAuthStore from './authStore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// 利用可能キャリア一覧
const carriers: Carrier[] = [
  { id: 'docomo', name: 'NTT docomo', hasDynamicSender: true },
  { id: 'au', name: 'KDDI au', hasDynamicSender: true },
  { id: 'softbank', name: 'SoftBank', hasDynamicSender: false, fixedNumber: '21061' },
  { id: 'rakuten', name: 'Rakuten Mobile', hasDynamicSender: true },
];

// モック送信元番号データ
const mockSenderNumbers: SenderNumber[] = [
  // 共通の電話番号（全ユーザー利用可能）
  { id: 'sender-1', number: '0120378777', description: 'カスタマーサポート', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true },
  { id: 'sender-2', number: '0120297888', description: 'カスタマーサポート', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true },
  { id: 'sender-3', number: 'TOPAZ', description: '会社名表示（国内）', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: false },
  
  // 海外送信用共通送信者名
  { id: 'sender-16', number: 'SMS_SERVICE', description: 'SMS配信サービス（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false },
  { id: 'sender-17', number: 'INFO', description: 'インフォメーション（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false },
  
  // admin用の電話番号
  { id: 'sender-4', number: '0433307000', description: '東京オフィス', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '1' },
  { id: 'sender-5', number: '0433307011', description: '大阪オフィス', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '1' },
  { id: 'sender-6', number: 'TOPAZ Inc.', description: '会社名（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '1' },
  { id: 'sender-7', number: 'Support', description: 'サポートセンター（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '1' },
  
  // user用の電話番号
  { id: 'sender-8', number: '08012345678', description: 'グランドリバーホテル 東京', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '2' },
  { id: 'sender-9', number: '08087654321', description: 'グランドリバーホテル 大阪', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '2' },
  { id: 'sender-10', number: 'Grand River Hotel', description: '海外送信用（英語表記）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '2' },
  { id: 'sender-11', number: 'グランドリバーホテル', description: '海外送信用（日本語表記）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '2' },
  
  // 運用管理者用
  { id: 'sender-12', number: '0311112222', description: 'サンプル会社', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: 'operation-1' },
  { id: 'sender-13', number: 'Sample Inc.', description: '会社名（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: 'operation-1' },
  
  // 運用担当者用
  { id: 'sender-14', number: '0322223333', description: 'サンプル部署', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: 'operation-2' },
  { id: 'sender-15', number: 'Sample Dept', description: '部署名（海外向け）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: 'operation-2' },
];

// モックキャリア別送信元番号マッピング
const carrierNumberMapping: Record<CarrierType, string[]> = {
  docomo: ['sender-1', 'sender-2', 'sender-3', 'sender-4'],
  au: ['sender-1', 'sender-2', 'sender-3', 'sender-4'],
  softbank: [], // SoftBankは固定番号のため空配列
  rakuten: ['sender-1', 'sender-2', 'sender-3', 'sender-4'],
};

interface SenderNumberStore {
  senderNumbers: SenderNumber[];
  carriers: Carrier[];
  availableCarriers: Carrier[];
  isLoading: boolean;
  error: string | null;
  fetchSenderNumbers: () => Promise<void>;
  loadSenderNumbers: () => Promise<void>;
  getAvailableSenderNumbers: (userId?: string) => SenderNumber[];
  getSoftBankSenderNumber: () => string;
  addSenderNumber: (data: Partial<SenderNumber>) => Promise<void>;
  updateSenderNumber: (id: string, updates: Partial<SenderNumber>) => Promise<void>;
  deleteSenderNumber: (id: string) => Promise<void>;
  canManageSenderNumbers: () => boolean;
}

const useSenderNumberStore = create<SenderNumberStore>((set, get) => ({
  senderNumbers: [],
  carriers,
  availableCarriers: carriers,
  isLoading: false,
  error: null,

  fetchSenderNumbers: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ 
        senderNumbers: mockSenderNumbers, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sender numbers', 
        isLoading: false 
      });
    }
  },

  loadSenderNumbers: async () => {
    return get().fetchSenderNumbers();
  },

  getAvailableSenderNumbers: (userId?: string) => {
    const { senderNumbers } = get();
    const authStore = useAuthStore.getState();
    const currentUser = authStore.user;
    
    // システム管理者かどうかチェック
    const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
    
    // 海外SMS送信権限があるかチェック
    const hasInternationalSmsPermission = authStore.hasPermission('internationalSms');
    
    // フィルター条件：
    // 1. アクティブであること
    // 2. 共通の送信者名（userId未設定）か指定されたユーザーIDに属する送信者名
    // 3. 国際送信用の送信者名は、海外SMS送信権限がある場合のみ表示
    return senderNumbers
      .filter(sn => 
        sn.isActive && 
        (!userId || !sn.userId || sn.userId === userId) &&
        (!sn.isInternational || hasInternationalSmsPermission)
      )
      .sort((a, b) => a.number.localeCompare(b.number));
  },

  getSoftBankSenderNumber: () => {
    return '21061';
  },

  addSenderNumber: async (data: Partial<SenderNumber>) => {
    // システム管理者以外は送信者名を追加できない
    if (!get().canManageSenderNumbers()) {
      toast.error('送信者名の管理権限がありません');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 現在のログインユーザーIDを取得
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id;
      
      const newSenderNumber: SenderNumber = {
        id: uuidv4(),
        number: data.number || '',
        description: data.description,
        isActive: true,
        createdAt: new Date().toISOString(),
        isInternational: data.isInternational,
        isPhoneNumber: !data.isInternational && /^\d+$/.test(data.number || ''),
        userId: data.userId || userId // 明示的に指定されたユーザーIDか、現在のユーザーID
      };
      
      set({ 
        senderNumbers: [...get().senderNumbers, newSenderNumber], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add sender number', 
        isLoading: false 
      });
    }
  },

  updateSenderNumber: async (id: string, updates: Partial<SenderNumber>) => {
    // システム管理者以外は送信者名を更新できない
    if (!get().canManageSenderNumbers()) {
      toast.error('送信者名の管理権限がありません');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const senderNumbers = get().senderNumbers.map(sn => 
        sn.id === id ? { ...sn, ...updates } : sn
      );
      
      set({ senderNumbers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update sender number', 
        isLoading: false 
      });
    }
  },

  deleteSenderNumber: async (id: string) => {
    // システム管理者以外は送信者名を削除できない
    if (!get().canManageSenderNumbers()) {
      toast.error('送信者名の管理権限がありません');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const senderNumbers = get().senderNumbers.filter(sn => sn.id !== id);
      
      set({ senderNumbers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete sender number', 
        isLoading: false 
      });
    }
  },
  
  // システム管理者のみ送信者名を管理できる
  canManageSenderNumbers: () => {
    const currentUser = useAuthStore.getState().user;
    return currentUser?.role === 'SYSTEM_ADMIN';
  }
}));

export default useSenderNumberStore;