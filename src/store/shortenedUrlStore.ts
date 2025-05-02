import { create } from 'zustand';
import { ShortenedUrl, ShortenedUrlStats } from '../types';

// モック用の短縮URL変換関数
const generateShortenedUrl = (originalUrl: string): string => {
  // 短縮URLを生成（実際のAPIでは短縮サービスを使用）
  const prefix = originalUrl.startsWith('https://') ? 'https://sms.l/' : 'http://sms.l/';
  // ランダム英数字6文字を生成
  const randomChars = Math.random().toString(36).substring(2, 8);
  return `${prefix}${randomChars}`;
};

// モック用のURL ID生成
const generateId = (): string => {
  return `url-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

interface ShortenedUrlStore {
  // 短縮URL関連の状態
  originalUrl: string;
  shortenedUrl: string;
  originalUrl2: string;
  shortenedUrl2: string;
  originalUrl3: string;
  shortenedUrl3: string;
  originalUrl4: string;
  shortenedUrl4: string;
  hasMultipleUrls: boolean;
  accessCode: string;
  accessCode2: string;
  accessCode3: string;
  accessCode4: string;
  hasAccessCodeFeature: boolean;
  
  // 履歴・統計
  urlHistory: ShortenedUrl[];
  isLoading: boolean;
  error: string | null;
  
  // アクション
  setOriginalUrl: (url: string, index?: number) => void;
  setAccessCode: (code: string, index?: number) => void;
  shortenUrl: (url: string, index?: number) => Promise<string>;
  clearUrls: () => void;
  getUrlClickStats: (shortenedUrlId: string) => Promise<ShortenedUrlStats>;
  validateUrl: (url: string) => boolean;
}

// 短縮URL用ストア
const useShortenedUrlStore = create<ShortenedUrlStore>((set, get) => ({
  // 初期状態
  originalUrl: '',
  shortenedUrl: '',
  originalUrl2: '',
  shortenedUrl2: '',
  originalUrl3: '',
  shortenedUrl3: '',
  originalUrl4: '',
  shortenedUrl4: '',
  hasMultipleUrls: false, // 複数URL機能フラグ（管理者設定）
  accessCode: '',
  accessCode2: '',
  accessCode3: '',
  accessCode4: '',
  hasAccessCodeFeature: false, // アクセスコード機能フラグ（管理者設定）
  urlHistory: [],
  isLoading: false,
  error: null,
  
  // オリジナルURLをセット
  setOriginalUrl: (url: string, index = 1) => {
    if (index === 1) set({ originalUrl: url });
    else if (index === 2) set({ originalUrl2: url });
    else if (index === 3) set({ originalUrl3: url });
    else if (index === 4) set({ originalUrl4: url });
  },
  
  // アクセスコードをセット
  setAccessCode: (code: string, index = 1) => {
    if (index === 1) set({ accessCode: code });
    else if (index === 2) set({ accessCode2: code });
    else if (index === 3) set({ accessCode3: code });
    else if (index === 4) set({ accessCode4: code });
  },
  
  // URLを短縮
  shortenUrl: async (url: string, index = 1): Promise<string> => {
    set({ isLoading: true, error: null });
    
    try {
      // 実際のアプリではAPIを呼び出して短縮URL生成
      await new Promise(resolve => setTimeout(resolve, 300)); // API遅延シミュレーション
      
      const shortenedUrl = generateShortenedUrl(url);
      
      // インデックスに対応する短縮URLをセット
      if (index === 1) set({ shortenedUrl });
      else if (index === 2) set({ shortenedUrl2: shortenedUrl });
      else if (index === 3) set({ shortenedUrl3: shortenedUrl });
      else if (index === 4) set({ shortenedUrl4: shortenedUrl });
      
      // 履歴に追加
      const { urlHistory, accessCode, accessCode2, accessCode3, accessCode4 } = get();
      const accessCodeValue = 
        index === 1 ? accessCode : 
        index === 2 ? accessCode2 : 
        index === 3 ? accessCode3 : 
        index === 4 ? accessCode4 : '';
      
      const newUrlEntry: ShortenedUrl = {
        id: generateId(),
        originalUrl: url,
        shortenedUrl,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日有効
        clickCount: 0,
        userId: '1', // 現在のユーザーID
        accessCode: accessCodeValue || undefined
      };
      
      set({ 
        urlHistory: [newUrlEntry, ...urlHistory.slice(0, 49)], // 最新50件まで保持
        isLoading: false 
      });
      
      return shortenedUrl;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'URL短縮に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // URLとアクセスコードをクリア
  clearUrls: () => {
    set({
      originalUrl: '',
      shortenedUrl: '',
      originalUrl2: '',
      shortenedUrl2: '',
      originalUrl3: '',
      shortenedUrl3: '',
      originalUrl4: '',
      shortenedUrl4: '',
      accessCode: '',
      accessCode2: '',
      accessCode3: '',
      accessCode4: '',
    });
  },
  
  // クリック統計情報取得
  getUrlClickStats: async (shortenedUrlId: string): Promise<ShortenedUrlStats> => {
    set({ isLoading: true });
    
    try {
      // 実際のアプリではAPIを呼び出してクリック統計を取得
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // モックデータを生成
      const now = new Date();
      const dailyStats = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10)
        };
      }).reverse();
      
      const stats: ShortenedUrlStats = {
        totalClicks: dailyStats.reduce((sum, day) => sum + day.count, 0),
        uniqueClicks: Math.floor(dailyStats.reduce((sum, day) => sum + day.count, 0) * 0.7), // ユニーククリックは約70%と仮定
        clicksPerDay: dailyStats
      };
      
      set({ isLoading: false });
      return stats;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'クリック統計の取得に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },
  
  // URL形式の検証
  validateUrl: (url: string): boolean => {
    if (!url) return false;
    
    // 標準的なURL検証（http, https, または他のスキーム）
    try {
      // カスタムスキームの場合もバリデーション通過させる場合
      if (get().hasAccessCodeFeature) {
        // スキーム・プロトコル名がある場合は有効と判断（例: comgooglemaps://)
        const hasScheme = /^[a-z][a-z0-9+.-]*:/.test(url);
        if (hasScheme) return true;
      }
      
      // 標準的なURL検証
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}));

export default useShortenedUrlStore;