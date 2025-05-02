import React from 'react';
import { 
  Calendar, 
  Tag as TagIcon, 
  Trash2, 
  Edit, 
  Copy, 
  MoreHorizontal, 
  Share,
  ExternalLink
} from 'lucide-react';
import { Template } from '../../types';
import TagHighlighter from '../ui/TagHighlighter';
import { formatDate } from '../../utils/dateUtils';

interface TemplateItemProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ 
  template, 
  onEdit, 
  onDelete,
  onDuplicate
}) => {
  const handleEdit = () => {
    onEdit(template);
  };
  
  const handleDelete = () => {
    if (window.confirm('このテンプレートを削除してもよろしいですか？')) {
      onDelete(template.id);
    }
  };
  
  const handleDuplicate = () => {
    onDuplicate(template);
  };
  
  // テンプレート内容を省略表示（100文字まで）
  const truncatedContent = template.content.length > 100
    ? `${template.content.slice(0, 100)}...`
    : template.content;
  
  return (
    <div className="template-item p-4 mb-4 bg-white rounded-lg border border-grey-200 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-grey-900">{template.name}</h3>
        
        <div className="flex">
          <button onClick={handleEdit} className="p-1 text-grey-500 hover:text-primary-600 mr-1">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={handleDuplicate} className="p-1 text-grey-500 hover:text-primary-600 mr-1">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="p-1 text-grey-500 hover:text-error-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="text-sm text-grey-500 mt-2 whitespace-pre-wrap">
        <TagHighlighter text={truncatedContent} />
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {template.tags && template.tags.map(tag => (
          <span key={tag} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-grey-100 text-grey-800">
            <TagIcon className="h-3 w-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-4 flex items-center text-xs text-grey-500">
        <Calendar className="h-3 w-3 mr-1" />
        <span>更新日: {formatDate(template.updatedAt)}</span>
        {template.isShared && (
          <span className="ml-3 flex items-center text-primary-600">
            <Share className="h-3 w-3 mr-1" />
            共有
          </span>
        )}
        {template.originalUrl && (
          <span className="ml-3 flex items-center text-accent-600">
            <ExternalLink className="h-3 w-3 mr-1" />
            短縮URL設定あり
          </span>
        )}
      </div>
    </div>
  );
};

export default TemplateItem; 