import React, { useState, useEffect } from 'react';
import { FileText, FileQuestion, ChevronDown, X } from 'lucide-react';
import useSurveyStore from '../../store/surveyStore';
import { Survey } from '../../types';
import useAuthStore from '../../store/authStore';

interface SurveyTagInputProps {
  onInsertTag: (tag: string) => void;
  disabled?: boolean;
}

const SurveyTagInput: React.FC<SurveyTagInputProps> = ({ onInsertTag, disabled = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const { surveys, fetchSurveys, isLoading } = useSurveyStore();
  const { hasPermission } = useAuthStore();
  
  // 有効なアンケートのみをフィルタリング
  const availableSurveys = surveys.filter(survey => {
    const now = new Date();
    const startDate = new Date(survey.startDateTime);
    const endDate = new Date(survey.endDateTime);
    return survey.status === 'active' && startDate <= now && endDate >= now;
  });
  
  useEffect(() => {
    if (isDropdownOpen && surveys.length === 0) {
      fetchSurveys();
    }
  }, [isDropdownOpen, surveys.length, fetchSurveys]);
  
  const handleSelectSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsDropdownOpen(false);
    onInsertTag(`{${survey.tagName}}`);
  };
  
  const toggleDropdown = () => {
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };
  
  const buttonClasses = `flex items-center space-x-1 px-3 py-2 text-sm border ${
    disabled
      ? 'border-grey-200 bg-grey-50 text-grey-400 cursor-not-allowed'
      : hasPermission('surveysCreation') || availableSurveys.length > 0
        ? 'border-primary-200 text-primary-700 hover:bg-primary-50'
        : 'border-grey-200 text-grey-400 cursor-not-allowed'
  } rounded-md transition-colors`;
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className={buttonClasses}
        disabled={disabled || (!hasPermission('surveysCreation') && availableSurveys.length === 0)}
      >
        <FileQuestion className="h-4 w-4" />
        <span>アンケート用タグ</span>
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-72 bg-white rounded-md shadow-lg border border-grey-200">
          <div className="px-4 py-2 border-b border-grey-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-grey-900">アンケート選択</h3>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="text-grey-400 hover:text-grey-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-grey-500">
                読み込み中...
              </div>
            ) : availableSurveys.length === 0 ? (
              <div className="p-4 text-center text-sm text-grey-500">
                利用可能なアンケートがありません
              </div>
            ) : (
              <ul className="py-1">
                {availableSurveys.map(survey => (
                  <li key={survey.id}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-grey-100 focus:outline-none focus:bg-grey-100"
                      onClick={() => handleSelectSurvey(survey)}
                    >
                      <div className="font-medium text-grey-900">{survey.name}</div>
                      <div className="text-xs text-grey-500 flex items-center mt-1">
                        <FileText className="h-3 w-3 mr-1" />
                        タグ: <span className="font-mono bg-grey-100 px-1 ml-1">{`{${survey.tagName}}`}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyTagInput; 