import React from 'react';
import { Edit, Trash2, Info, Tag as TagIcon } from 'lucide-react';
import { Tag } from '../../utils/tagUtils';
import './TagManagerItem.css';

interface TagManagerItemProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Tag>) => void;
  viewMode: 'grid' | 'list';
}

const TagManagerItem: React.FC<TagManagerItemProps> = ({ 
  tag, 
  onEdit, 
  onDelete,
  onUpdate,
  viewMode
}) => {
  const handleEdit = () => {
    onEdit(tag);
  };
  
  const handleDelete = () => {
    if (window.confirm(`"${tag.name}"タグを削除してもよろしいですか？`)) {
      onDelete(tag.id);
    }
  };

  // 表示用のデフォルトテキストを決定
  const getDefaultDisplayText = () => {
    // サンプル表示テキストをタグの種類に応じて返す
    if (tag.name.startsWith('info')) {
      return 'お知らせ内容を入力';
    } else if (tag.name.startsWith('URL')) {
      return 'URLを入力';
    } else if (tag.name.includes('name') || tag.name.includes('名前') || tag.name.includes('氏名')) {
      return 'お客様の名前を入力';
    } else if (tag.name.includes('company') || tag.name.includes('会社')) {
      return '会社名を入力';
    } else if (tag.name.includes('date') || tag.name.includes('日付')) {
      return '日付を入力';
    } else if (tag.name.includes('time') || tag.name.includes('時間')) {
      return '時間を入力';
    } else if (tag.name.includes('place') || tag.name.includes('場所')) {
      return '場所を入力';
    } else if (tag.name.includes('invoice') || tag.name.includes('receipt') || tag.name.includes('伝票')) {
      return '伝票番号を入力';
    } else {
      return `${tag.name}`;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="tag-item-grid border rounded-lg p-4 mb-3 hover:shadow-card transition-shadow duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-grey-900">{`{${tag.name}}`}</span>
          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-grey-100 rounded-full text-grey-600"
              onClick={handleEdit}
              title="タグを編集"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="p-1 hover:bg-grey-100 rounded-full text-red-600"
              onClick={handleDelete}
              title="タグを削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <TagIcon className="h-4 w-4 text-grey-500" />
          <span className="tag-badge-common">
            {tag.value || getDefaultDisplayText()}
          </span>
        </div>
        
        {tag.description && (
          <div className="text-xs text-grey-500 mt-2 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5" />
            <span>{tag.description}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tag-item">
      <div className="flex items-center flex-1">
        <span className="tag-badge-common">
          {tag.value || getDefaultDisplayText()}
        </span>
        <span className="text-xs text-grey-500 ml-2">
          {`{${tag.name}}`}
        </span>
        {tag.description && (
          <span 
            className="ml-2 text-grey-400 cursor-help"
            title={tag.description}
          >
            <Info className="h-4 w-4" />
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          className="p-1 hover:bg-grey-100 rounded-full text-grey-600"
          onClick={handleEdit}
          title="タグを編集"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="p-1 hover:bg-grey-100 rounded-full text-red-600"
          onClick={handleDelete}
          title="タグを削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TagManagerItem; 