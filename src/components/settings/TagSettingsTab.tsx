import React from 'react';
import { Tag } from 'lucide-react';
import TagManager from '../tags/TagManager';

/**
 * 設定画面のタグ管理タブコンポーネント
 */
const TagSettingsTab: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-grey-900 mb-6">タグ管理</h1>
      
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-grey-900">タグ一覧</h2>
        </div>
        
        <TagManager />
      </div>
    </div>
  );
};

export default TagSettingsTab; 