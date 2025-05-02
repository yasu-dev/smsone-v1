import React, { useState } from 'react';
import { Survey, SurveyQuestion } from '../../types';

interface SurveyPreviewProps {
  survey: Survey;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({ survey }) => {
  const [currentResponses, setCurrentResponses] = useState<Record<string, string | string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const sortedQuestions = [...(survey.questions || [])].sort((a, b) => a.order - b.order);
  const totalSteps = sortedQuestions.length;
  
  // 回答処理
  const handleSingleSelect = (questionId: string, optionId: string) => {
    setCurrentResponses(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  const handleMultiSelect = (questionId: string, optionId: string) => {
    setCurrentResponses(prev => {
      const currentSelections = (prev[questionId] as string[]) || [];
      
      if (currentSelections.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentSelections.filter(id => id !== optionId)
        };
      } else {
        // 最大選択数チェック
        if (survey.maxSelections && currentSelections.length >= survey.maxSelections) {
          return prev;
        }
        
        return {
          ...prev,
          [questionId]: [...currentSelections, optionId]
        };
      }
    });
  };
  
  const handleFreeText = (questionId: string, text: string) => {
    setCurrentResponses(prev => ({
      ...prev,
      [questionId]: text
    }));
  };
  
  // ナビゲーション処理
  const handleNext = () => {
    const currentQuestion = sortedQuestions[currentStep];
    
    // 必須入力チェック
    if (!currentResponses[currentQuestion.id]) {
      // 実際のシステムではここでバリデーションエラーを表示する
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = () => {
    // 実際のシステムではここでAPIにデータを送信する
    setIsSubmitted(true);
  };
  
  if (isSubmitted) {
    return (
      <div className="card max-w-2xl mx-auto py-8 px-6 text-center">
        <h2 className="text-2xl font-bold text-grey-900 mb-6">{survey.completionText}</h2>
        <p className="text-grey-600 mb-6">
          回答が送信されました。ご協力ありがとうございました。
        </p>
        <button
          onClick={() => {
            setCurrentResponses({});
            setCurrentStep(0);
            setIsSubmitted(false);
          }}
          className="btn-primary"
        >
          もう一度回答する
        </button>
      </div>
    );
  }
  
  const currentQuestion = sortedQuestions[currentStep];
  
  if (!currentQuestion) {
    return (
      <div className="card max-w-2xl mx-auto py-8 px-6 text-center">
        <h2 className="text-xl font-bold text-grey-900 mb-4">質問が設定されていません</h2>
        <p className="text-grey-600">
          アンケートに質問を追加してください。
        </p>
      </div>
    );
  }
  
  return (
    <div className="card max-w-2xl mx-auto">
      <div className="py-6 px-6 border-b border-grey-200">
        <h2 className="text-xl font-bold text-grey-900">{survey.htmlTitle}</h2>
        {totalSteps > 1 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-grey-500 mb-1">
              <span>進捗状況</span>
              <span>{currentStep + 1} / {totalSteps}</span>
            </div>
            <div className="w-full bg-grey-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="py-6 px-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-grey-900 mb-2">
            {currentQuestion.questionText}
          </h3>
          
          {currentQuestion.questionType === 'single' && (
            <div className="space-y-3">
              {currentQuestion.options?.map(option => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={currentResponses[currentQuestion.id] === option.id}
                    onChange={() => handleSingleSelect(currentQuestion.id, option.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-grey-300"
                  />
                  <span className="ml-2 text-grey-700">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}
          
          {currentQuestion.questionType === 'multiple' && (
            <div className="space-y-3">
              {survey.maxSelections && (
                <p className="text-sm text-grey-500 mb-2">
                  最大{survey.maxSelections}つまで選択できます
                </p>
              )}
              {currentQuestion.options?.map(option => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(currentResponses[currentQuestion.id] as string[] || []).includes(option.id)}
                    onChange={() => handleMultiSelect(currentQuestion.id, option.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-grey-300 rounded"
                  />
                  <span className="ml-2 text-grey-700">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}
          
          {currentQuestion.questionType === 'free' && (
            <textarea
              value={(currentResponses[currentQuestion.id] as string) || ''}
              onChange={(e) => handleFreeText(currentQuestion.id, e.target.value)}
              rows={4}
              className="form-textarea w-full"
              placeholder="ここに回答を入力してください..."
            />
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className="btn-outline"
            disabled={currentStep === 0}
          >
            前へ
          </button>
          
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            {currentStep < totalSteps - 1 ? '次へ' : '送信'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPreview; 