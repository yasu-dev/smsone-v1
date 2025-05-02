import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { SurveyQuestion, SurveyQuestionOption } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface SurveyQuestionFormProps {
  question: SurveyQuestion;
  onChange: (question: SurveyQuestion) => void;
}

const SurveyQuestionForm: React.FC<SurveyQuestionFormProps> = ({ question, onChange }) => {
  const [newOptionText, setNewOptionText] = useState('');
  
  // 質問テキスト変更ハンドラ
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      questionText: e.target.value
    });
  };
  
  // 質問タイプ変更ハンドラ
  const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SurveyQuestion['questionType'];
    onChange({
      ...question,
      questionType: newType
    });
  };
  
  // 選択肢追加ハンドラ
  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption: SurveyQuestionOption = {
      id: uuidv4(),
      questionId: question.id,
      optionText: newOptionText,
      order: (question.options?.length || 0) + 1
    };
    
    onChange({
      ...question,
      options: [...(question.options || []), newOption]
    });
    
    setNewOptionText('');
  };
  
  // 選択肢テキスト変更ハンドラ
  const handleOptionTextChange = (index: number, text: string) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionText: text
    };
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };
  
  // 選択肢削除ハンドラ
  const handleDeleteOption = (index: number) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions.splice(index, 1);
    
    // 順番の再計算
    updatedOptions.forEach((option, i) => {
      option.order = i + 1;
    });
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };
  
  // 選択肢並べ替えハンドラ
  const handleMoveOption = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (question.options?.length || 0)) return;
    
    const updatedOptions = [...(question.options || [])];
    const [movedOption] = updatedOptions.splice(fromIndex, 1);
    updatedOptions.splice(toIndex, 0, movedOption);
    
    // 順番の再計算
    updatedOptions.forEach((option, i) => {
      option.order = i + 1;
    });
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          質問文 <span className="text-error-600">*</span>
        </label>
        <textarea
          value={question.questionText}
          onChange={handleQuestionTextChange}
          className="form-textarea"
          placeholder="質問文を入力してください"
          rows={2}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-grey-700 mb-1">
          質問タイプ
        </label>
        <select
          value={question.questionType}
          onChange={handleQuestionTypeChange}
          className="form-select"
        >
          <option value="single">単一選択式</option>
          <option value="multiple">複数選択式</option>
          <option value="free">自由記述式</option>
        </select>
      </div>
      
      {question.questionType !== 'free' && (
        <div>
          <label className="block text-sm font-medium text-grey-700 mb-2">
            選択肢 <span className="text-error-600">*</span>
          </label>
          
          {question.options && question.options.length > 0 ? (
            <div className="space-y-2 mb-3">
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center">
                  <div className="mr-2 cursor-move text-grey-400">
                    <GripVertical size={16} />
                  </div>
                  
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      className="form-input pr-8"
                      placeholder={`選択肢 ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-grey-400 hover:text-error-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      onClick={() => handleMoveOption(index, index - 1)}
                      disabled={index === 0}
                      className={`p-1 text-grey-500 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-grey-700'}`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOption(index, index + 1)}
                      disabled={index === (question.options?.length || 0) - 1}
                      className={`p-1 text-grey-500 ${index === (question.options?.length || 0) - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-grey-700'}`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 bg-grey-50 rounded-lg mb-3">
              <p className="text-grey-500 text-sm">選択肢がありません</p>
            </div>
          )}
          
          <div className="flex">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              className="form-input flex-grow"
              placeholder="新しい選択肢を入力"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="btn-outline ml-2"
              disabled={!newOptionText.trim()}
            >
              <Plus size={16} className="mr-1" />
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyQuestionForm; 