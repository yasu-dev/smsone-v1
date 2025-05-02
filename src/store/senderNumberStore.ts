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
  
  // admin用の電話番号
  { id: 'sender-3', number: '0433307000', description: '東京オフィス', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '1' },
  { id: 'sender-4', number: '0433307011', description: '大阪オフィス', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '1' },
  
  // user用の電話番号
  { id: 'sender-5', number: '08012345678', description: 'グランドリバーホテル 東京', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '2' },
  { id: 'sender-6', number: '08087654321', description: 'グランドリバーホテル 大阪', isActive: true, createdAt: new Date().toISOString(), isPhoneNumber: true, userId: '2' },
  { id: 'sender-7', number: 'Grand River Hotel', description: '国際送信用（英語表記）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '2' },
  { id: 'sender-8', number: 'グランドリバーホテル', description: '国際送信用（日本語表記）', isActive: true, createdAt: new Date().toISOString(), isInternational: true, isPhoneNumber: false, userId: '2' },
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
    
    // フィルター条件：アクティブであること、そしてユーザーIDが指定されている場合は、
    // 1. 共通の送信者名（userId未設定）
    // 2. 指定されたユーザーIDに属する送信者名
    return senderNumbers
      .filter(sn => 
        sn.isActive && 
        (!userId || !sn.userId || sn.userId === userId)
      )
      .sort((a, b) => a.number.localeCompare(b.number));
  },

  getSoftBankSenderNumber: () => {
    return '21061';
  },

  addSenderNumber: async (data: Partial<SenderNumber>) => {
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
  }
}));

export default useSenderNumberStore;