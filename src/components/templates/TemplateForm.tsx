import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle, Tag, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import useTemplateStore from '../../store/templateStore';
import { Template } from '../../types';
import TagHighlighter from '../ui/TagHighlighter';

interface TemplateFormProps {
  template?: Template;
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onClose }) => {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(template?.content || '');
  const [description, setDescription] = useState(template?.description || '');
  const [isShared, setIsShared] = useState(template?.isShared || false);
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [characterCount, setCharacterCount] = useState(0);
  
  const { addTemplate, updateTemplate, isLoading } = useTemplateStore();
  
  // Update character count when content changes
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);
  
  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'テンプレート名は必須です';
    }
    
    if (!content.trim()) {
      newErrors.content = '本文は必須です';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      if (template?.id) {
        // Update
        await updateTemplate(template.id, {
          name,
          content,
          description,
          isShared,
          tags,
        });
        toast.success('テンプレートを更新しました');
      } else {
        // Create
        await addTemplate({
          name,
          content,
          description,
          isShared,
          tags,
        });
        toast.success('テンプレートを作成しました');
      }
      
      onClose();
    } catch (error) {
      toast.error('操作に失敗しました');
    }
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <div className="px-6 py-4 border-b border-grey-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-grey-900">
            {template?.id ? 'テンプレートを編集' : 'テンプレートを作成'}
          </h2>
          <button
            type="button"
            className="text-grey-400 hover:text-grey-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">
                  テンプレート名
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`form-input ${errors.name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-error-600">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="content" className="form-label">
                  本文
                </label>
                <div className="mt-1">
                  <textarea
                    id="content"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`form-input ${errors.content ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="メッセージ本文を入力してください。{お客様の名前を入力}のような動的タグを使用できます。"
                  />
                </div>
                {errors.content ? (
                  <p className="mt-1 text-sm text-error-600">{errors.content}</p>
                ) : (
                  <div className="mt-1 text-sm text-grey-500 flex justify-between">
                    <p>
                      動的タグ例: {'{お客様の名前を入力}'}, {'{注文番号を入力}'}, {'{予約日時を入力}'} をタグとして使用できます
                    </p>
                    <p>
                      文字数: {characterCount} / 70文字
                      {characterCount > 70 && (
                        <span className="text-error-600 ml-2 inline-flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          制限超過
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              {content && (
                <div className="mt-4 p-3 border border-grey-100 rounded-md bg-grey-50">
                  <p className="text-xs text-grey-500 mb-1">プレビュー:</p>
                  <div className="text-sm text-grey-800 whitespace-pre-wrap">
                    <TagHighlighter 
                      text={content} 
                      interactive={false}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="description" className="form-label">
                  説明 (オプション)
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input"
                    placeholder="テンプレートの使用目的や注意事項などを記載"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="tags" className="form-label">
                  タグ (オプション)
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="form-input flex-grow"
                    placeholder="タグを入力してEnterを押す"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="ml-2 px-3 py-2 border border-grey-300 rounded-md text-grey-700 bg-white hover:bg-grey-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span 
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-grey-100 text-grey-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 rounded-full hover:bg-grey-200 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  id="shared"
                  name="shared"
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor="shared" className="ml-2 block text-sm text-grey-700">
                  他のユーザーと共有する
                </label>
              </div>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-3 border-t border-grey-200 flex justify-end">
          <button
            type="button"
            className="btn-secondary mr-3"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TemplateForm;