import { create } from 'zustand';
import { Tag, generateTagId } from '../utils/tagUtils';

interface TagStore {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  selectedTagId: string | null;
  
  // アクション
  fetchTags: () => Promise<void>;
  addTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  setTagValue: (id: string, value: string) => Promise<void>;
  selectTag: (id: string | null) => void;
  getTagById: (id: string) => Tag | undefined;
  getTagByName: (name: string) => Tag | undefined;
}

// 現在のユーザーIDを取得する関数（認証ストアから取得する想定）
const getCurrentUserId = (): string => {
  return 'current-user'; // 実際の実装では認証ストアから取得
};

// サンプルタグデータ
const sampleTags: Tag[] = [
  {
    id: 'tag-1',
    name: 'お客様の名前を入力',
    description: 'お客様の名前を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-2',
    name: '注文番号を入力',
    description: '注文番号や伝票番号を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-3',
    name: '予約日時を入力',
    description: '予約日や配達日などの日付情報を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-4',
    name: '配送業者名を入力',
    description: '配送業者の名前を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-5',
    name: '追跡番号を入力',
    description: '配送の追跡番号を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-6',
    name: '予約サービス名を入力',
    description: '予約したサービス名を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-7',
    name: '予約詳細を入力',
    description: '予約の詳細情報を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-8',
    name: '予約内容を入力',
    description: '予約内容の概要を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-9',
    name: '日時を入力',
    description: '日付と時間を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-10',
    name: '商品名を入力',
    description: '商品名を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-11',
    name: '割引率を入力',
    description: '割引率や割引額を入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  },
  {
    id: 'tag-12',
    name: 'クーポンコードを入力',
    description: 'クーポンやプロモーションコードを入力するためのタグ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    value: ''
  }
];

const useTagStore = create<TagStore>((set, get) => ({
  tags: sampleTags,
  isLoading: false,
  error: null,
  selectedTagId: null,

  // タグ一覧を取得
  fetchTags: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // APIから取得する代わりに、サンプルデータを使用
      set({ tags: sampleTags, isLoading: false });
    } catch (error) {
      set({ error: '取得中にエラーが発生しました', isLoading: false });
      console.error('タグ取得エラー:', error);
    }
  },

  // 新しいタグを追加
  addTag: async (tagData) => {
    set({ isLoading: true, error: null });
    
    try {
      const now = new Date().toISOString();
      const newTag: Tag = {
        id: generateTagId(),
        name: tagData.name,
        description: tagData.description,
        value: tagData.value || '',
        createdAt: now,
        updatedAt: now,
        createdBy: getCurrentUserId(),
      };
      
      // タグの重複チェック
      const { tags } = get();
      if (tags.some(tag => tag.name === newTag.name)) {
        throw new Error('同じ名前のタグが既に存在します');
      }
      
      // APIの代わりに、ローカルステートを更新
      set({ tags: [...tags, newTag], isLoading: false });
      return newTag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '追加中にエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      console.error('タグ追加エラー:', error);
      throw error;
    }
  },

  // タグを更新
  updateTag: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const { tags } = get();
      
      // 名前の重複チェック（名前を変更する場合）
      if (updates.name) {
        const existingTag = tags.find(tag => tag.name === updates.name && tag.id !== id);
        if (existingTag) {
          throw new Error('同じ名前のタグが既に存在します');
        }
      }
      
      // APIの代わりに、ローカルステートを更新
      const updatedTags = tags.map(tag => {
        if (tag.id === id) {
          return {
            ...tag,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return tag;
      });
      
      set({ tags: updatedTags, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新中にエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      console.error('タグ更新エラー:', error);
      throw error;
    }
  },

  // タグを削除
  deleteTag: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { tags } = get();
      
      // APIの代わりに、ローカルステートを更新
      const updatedTags = tags.filter(tag => tag.id !== id);
      set({ tags: updatedTags, isLoading: false });
    } catch (error) {
      set({ error: '削除中にエラーが発生しました', isLoading: false });
      console.error('タグ削除エラー:', error);
      throw error;
    }
  },

  // タグの値を設定
  setTagValue: async (id, value) => {
    const { tags } = get();
    const updatedTags = tags.map(tag => {
      if (tag.id === id) {
        return { ...tag, value, updatedAt: new Date().toISOString() };
      }
      return tag;
    });
    set({ tags: updatedTags });
  },

  // タグを選択
  selectTag: (id) => {
    set({ selectedTagId: id });
  },

  // IDでタグを取得
  getTagById: (id) => {
    const { tags } = get();
    return tags.find(tag => tag.id === id);
  },

  // 名前でタグを取得
  getTagByName: (name) => {
    const { tags } = get();
    return tags.find(tag => tag.name === name);
  }
}));

export default useTagStore; 