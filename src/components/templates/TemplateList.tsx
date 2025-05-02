import React, { useState, useEffect } from 'react';
import { 
  FileText, Edit, Trash2, Plus, Search, Grid, List, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTemplateStore from '../../store/templateStore';
import { Template } from '../../types';
import TagHighlighter from '../ui/TagHighlighter';

interface TemplateListProps {
  onSelectTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ 
  onSelectTemplate,
  onEditTemplate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { templates, fetchTemplates, deleteTemplate, isLoading } = useTemplateStore();
  
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Filter templates by search term and selected tag
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTag ? template.tags?.includes(selectedTag) : true;
    
    return matchesSearch && matchesTag;
  });
  
  // Get all unique tags from templates
  const allTags = templates.reduce<string[]>((tags, template) => {
    template.tags?.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);
  
  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Confirm deletion
    if (window.confirm('テンプレートを削除してもよろしいですか？')) {
      await deleteTemplate(id);
    }
  };
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-grey-900">テンプレート一覧</h2>
      </div>
      
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-grey-400" />
          </div>
          <input
            type="search"
            className="form-input pl-10"
            placeholder="テンプレートを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-5 w-5 text-grey-700" />
          </button>
          <button
            type="button"
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-5 w-5 text-grey-700" />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onEditTemplate && onEditTemplate({
              id: '',
              name: '',
              content: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: '',
              isShared: false,
            })}
          >
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </button>
        </div>
      </div>
      
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              selectedTag === null 
                ? 'bg-primary-100 text-primary-800'
                : 'bg-grey-100 text-grey-800 hover:bg-grey-200'
            }`}
            onClick={() => setSelectedTag(null)}
          >
            すべて
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                selectedTag === tag 
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-grey-100 text-grey-800 hover:bg-grey-200'
              }`}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
          <p className="mt-2 text-grey-500">テンプレートを読み込み中...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-md">
          <FileText className="h-12 w-12 text-grey-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-grey-900">テンプレートがありません</h3>
          <p className="mt-1 text-sm text-grey-500">
            {searchTerm || selectedTag 
              ? '検索条件に一致するテンプレートが見つかりませんでした。'
              : 'テンプレートを作成して、メッセージ送信を効率化しましょう。'}
          </p>
          {(searchTerm || selectedTag) && (
            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedTag(null);
              }}
            >
              検索条件をクリア
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                className="border rounded-lg overflow-hidden hover:shadow-card transition-shadow duration-200 cursor-pointer group relative"
                variants={item}
                onClick={() => onSelectTemplate && onSelectTemplate(template)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium text-grey-900 truncate">{template.name}</h3>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTemplate && onEditTemplate(template);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-grey-500 hover:text-error-600 rounded hover:bg-grey-100"
                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-grey-600 line-clamp-3">
                    <TagHighlighter text={template.content} interactive={false} />
                  </p>
                  
                  {template.tags && template.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-grey-100 text-grey-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 bg-grey-50 border-t border-grey-100 flex justify-between items-center">
                  <span className="text-xs text-grey-500">
                    {new Date(template.updatedAt).toLocaleDateString('ja-JP')}
                  </span>
                  {template.isShared && (
                    <span className="text-xs text-grey-500">共有</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          className="border rounded-lg overflow-hidden"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <table className="min-w-full divide-y divide-grey-200">
            <thead className="bg-grey-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  テンプレート名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  内容
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  更新日
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  共有
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">アクション</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-grey-200">
              <AnimatePresence>
                {filteredTemplates.map((template) => (
                  <motion.tr 
                    key={template.id}
                    className="hover:bg-grey-50 cursor-pointer"
                    variants={item}
                    onClick={() => onSelectTemplate && onSelectTemplate(template)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-grey-400 mr-2" />
                        <div className="text-sm font-medium text-grey-900">{template.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-grey-500 max-w-xs truncate">
                        <TagHighlighter text={template.content} interactive={false} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                      {new Date(template.updatedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                      {template.isShared ? '共有' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-primary-600 hover:text-primary-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTemplate && onEditTemplate(template);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-error-600 hover:text-error-900"
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default TemplateList;