import { create } from 'zustand';
import { Template } from '../types';

// Generate mock templates for demo
const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: '注文確認',
    content: '{お客様の名前を入力}様、ご注文ありがとうございます。注文番号{注文番号を入力}の処理が完了しました。',
    description: '注文確認のための基本テンプレート',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: '1',
    isShared: true,
    tags: ['注文', '確認'],
  },
  {
    id: 'template-2',
    name: '配送通知',
    content: '{お客様の名前を入力}様、注文番号{注文番号を入力}の商品が発送されました。配送業者:{配送業者名を入力} 追跡番号:{追跡番号を入力}',
    description: '配送開始通知用テンプレート',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: '1',
    isShared: true,
    tags: ['配送', '通知'],
  },
  {
    id: 'template-3',
    name: '予約確認',
    content: '{お客様の名前を入力}様、{予約サービス名を入力}での予約が確定しました。日時:{予約日時を入力} {予約詳細を入力}',
    description: '予約確認用テンプレート',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: '1',
    isShared: true,
    tags: ['予約', '確認'],
  },
  {
    id: 'template-4',
    name: 'リマインダー',
    content: '{お客様の名前を入力}様、{予約内容を入力}の予約が{日時を入力}に予定されています。ご確認ください。',
    description: 'リマインダー用テンプレート',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: '1',
    isShared: false,
    tags: ['リマインダー'],
  },
  {
    id: 'template-5',
    name: 'キャンペーン通知',
    content: '{お客様の名前を入力}様、期間限定キャンペーンのお知らせです。{商品名を入力}が{割引率を入力}%OFFになります。コード:{クーポンコードを入力}',
    description: 'キャンペーン告知用テンプレート',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: '1',
    isShared: true,
    tags: ['キャンペーン', 'マーケティング'],
  },
];

interface TemplateStore {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  addTemplate: (template: Partial<Template>) => Promise<void>;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set({ 
        templates: mockTemplates, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch templates', 
        isLoading: false 
      });
    }
  },

  addTemplate: async (template: Partial<Template>) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        name: template.name || 'New Template',
        content: template.content || '',
        description: template.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '1', // Current user ID would come from auth store
        isShared: template.isShared || false,
        tags: template.tags || [],
      };
      
      set({ 
        templates: [...get().templates, newTemplate], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add template', 
        isLoading: false 
      });
    }
  },

  updateTemplate: async (id: string, template: Partial<Template>) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const templates = get().templates;
      const templateIndex = templates.findIndex(t => t.id === id);
      
      if (templateIndex === -1) {
        throw new Error('Template not found');
      }
      
      // Update the template
      const updatedTemplate = {
        ...templates[templateIndex],
        ...template,
        updatedAt: new Date().toISOString(),
      };
      
      const updatedTemplates = [...templates];
      updatedTemplates[templateIndex] = updatedTemplate;
      
      set({ 
        templates: updatedTemplates, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update template', 
        isLoading: false 
      });
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      set({ 
        templates: get().templates.filter(template => template.id !== id), 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete template', 
        isLoading: false 
      });
    }
  }
}));

export default useTemplateStore;