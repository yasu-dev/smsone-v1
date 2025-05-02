import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Tag } from '../../utils/tagUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface TagFormProps {
  tag?: Tag;
  onClose: () => void;
  onSave: (tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<Tag>) => void;
}

const TagForm: React.FC<TagFormProps> = ({ 
  tag, 
  onClose, 
  onSave,
  onUpdate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    value?: string;
  }>({});

  // 既存のタグを編集する場合は、値をフォームに設定
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setDescription(tag.description || '');
      setValue(tag.value || '');
    }
  }, [tag]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'タグ名は必須です';
    }
    // 英数字とアンダースコアに限定する制限を削除し、空白文字のみをチェック
    // タグ名に空白文字が含まれていないかチェック
    else if (/\s/.test(name)) {
      newErrors.name = 'タグ名に空白は使用できません';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (tag) {
      // 既存タグの更新
      onUpdate(tag.id, {
        name,
        description: description || undefined,
        value: value || undefined
      });
    } else {
      // 新規タグの作成
      onSave({
        name,
        description: description || undefined,
        value: value || undefined,
        createdBy: 'current-user', // 実際の実装では認証ストアから取得
      });
    }
    
    onClose();
  };

  // モーダルの外側をクリックした時の処理
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-50 p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-grey-900">
            {tag ? 'タグを編集' : '新規タグを作成'}
          </h3>
          <button
            type="button"
            className="p-1 hover:bg-grey-100 rounded-full text-grey-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                タグ名 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className={`form-input ${errors.name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: お客様の名前を入力, 注文番号を入力"
                  autoFocus
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-grey-500">
                タグは {'{タグ名}'} の形式で指定され、表示時にはタグ名または設定した値が表示されます
              </p>
            </div>
            
            <div>
              <label htmlFor="description" className="form-label">
                説明 (オプション)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="description"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このタグの用途や説明"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="value" className="form-label">
                デフォルト値 (オプション)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="value"
                  className="form-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="例: 田中太郎"
                />
              </div>
              <p className="mt-1 text-xs text-grey-500">
                デフォルト値を設定すると、タグはこの値に置き換えて表示されます
              </p>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="btn-secondary mr-2"
                onClick={onClose}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                {tag ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TagForm; 