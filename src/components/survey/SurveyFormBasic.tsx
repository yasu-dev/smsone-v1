import React from 'react';
import { Survey, SurveyStatus } from '../../types';

interface SurveyFormBasicProps {
  formData: Partial<Survey>;
  onChange: (data: Partial<Survey>) => void;
}

const SurveyFormBasic: React.FC<SurveyFormBasicProps> = ({ formData, onChange }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({ [name]: checked });
    } else {
      onChange({ [name]: value });
    }
  };
  
  // 日付フォーマット（入力用）
  const formatDateForInput = (isoString: string | undefined) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            アンケート名 <span className="text-error-600">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="顧客満足度調査"
            required
          />
          <p className="mt-1 text-sm text-grey-500">
            管理画面に表示される名前です
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            タグ名 <span className="text-error-600">*</span>
          </label>
          <input
            type="text"
            name="tagName"
            value={formData.tagName || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="SURVEY1"
            required
          />
          <p className="mt-1 text-sm text-grey-500">
            SMS本文内で使用するタグ名です（例: [[SURVEY1]]）
          </p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          ページタイトル <span className="text-error-600">*</span>
        </label>
        <input
          type="text"
          name="htmlTitle"
          value={formData.htmlTitle || ''}
          onChange={handleChange}
          className="form-input"
          placeholder="顧客満足度調査"
          required
        />
        <p className="mt-1 text-sm text-grey-500">
          アンケートページのブラウザタイトルに表示されます
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            回答受付開始日時 <span className="text-error-600">*</span>
          </label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={formatDateForInput(formData.startDateTime)}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            回答受付終了日時 <span className="text-error-600">*</span>
          </label>
          <input
            type="datetime-local"
            name="endDateTime"
            value={formatDateForInput(formData.endDateTime)}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            回答形式 <span className="text-error-600">*</span>
          </label>
          <select
            name="questionType"
            value={formData.questionType || 'single'}
            onChange={handleChange}
            className="form-select"
          >
            <option value="single">単一選択式</option>
            <option value="multiple">複数選択式</option>
            <option value="free">自由記述式</option>
          </select>
          <p className="mt-1 text-sm text-grey-500">
            主となる質問の回答タイプです
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-1">
            分岐タイプ
          </label>
          <select
            name="branchingType"
            value={formData.branchingType || 'independent'}
            onChange={handleChange}
            className="form-select"
          >
            <option value="independent">独立質問（分岐なし）</option>
            <option value="branched">回答による分岐あり</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowMultipleAnswers"
              name="allowMultipleAnswers"
              checked={formData.allowMultipleAnswers || false}
              onChange={(e) => onChange({ allowMultipleAnswers: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-grey-300 rounded"
            />
            <label 
              htmlFor="allowMultipleAnswers" 
              className="ml-2 block text-sm text-grey-700"
            >
              複数回答を許可する
            </label>
          </div>
          <p className="mt-1 text-sm text-grey-500">
            同じ人が複数回答答できるようにします
          </p>
        </div>
        
        {formData.questionType === 'multiple' && (
          <div>
            <label className="block text-sm font-medium text-grey-700 mb-1">
              最大選択数
            </label>
            <input
              type="number"
              name="maxSelections"
              value={formData.maxSelections || ''}
              onChange={handleChange}
              min="1"
              className="form-input"
              placeholder="無制限"
            />
            <p className="mt-1 text-sm text-grey-500">
              空欄の場合は無制限になります
            </p>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          回答完了メッセージ
        </label>
        <textarea
          name="completionText"
          value={formData.completionText || ''}
          onChange={handleChange}
          rows={3}
          className="form-textarea"
          placeholder="アンケートにご回答いただき、ありがとうございました。"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          回答期間終了メッセージ
        </label>
        <textarea
          name="expirationText"
          value={formData.expirationText || ''}
          onChange={handleChange}
          rows={3}
          className="form-textarea"
          placeholder="このアンケートの回答期間は終了しました。"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          公開ステータス
        </label>
        <select
          name="status"
          value={formData.status || 'draft'}
          onChange={handleChange}
          className="form-select"
        >
          <option value="draft">下書き</option>
          <option value="active">公開</option>
          <option value="inactive">非公開</option>
        </select>
      </div>
    </div>
  );
};

export default SurveyFormBasic; 