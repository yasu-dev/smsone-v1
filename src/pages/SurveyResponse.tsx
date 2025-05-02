import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useSurveyStore from '../store/surveyStore';
import { Survey, SurveyQuestion } from '../types';
import { v4 as uuidv4 } from 'uuid';

const SurveyResponse: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const messageId = queryParams.get('messageId');
  const recipientPhone = queryParams.get('phone');
  const senderPhone = queryParams.get('sender');
  
  const { fetchSurveyById } = useSurveyStore();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  // アンケートデータの取得
  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) {
        setError('アンケートIDが指定されていません');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('アンケート取得開始:', surveyId);
        console.log('クエリパラメータ:', { messageId, recipientPhone, senderPhone });
        
        const surveyData = await fetchSurveyById(surveyId);
        console.log('アンケート取得結果:', surveyData);
        
        if (!surveyData) {
          console.error('アンケートが見つかりませんでした：', surveyId);
          setError('アンケートが見つかりませんでした');
          setIsLoading(false);
          return;
        }
        
        setSurvey(surveyData);
        
        // アンケート期間のチェック
        const now = new Date();
        const startDate = new Date(surveyData.startDateTime);
        const endDate = new Date(surveyData.endDateTime);
        
        if (now < startDate || now > endDate) {
          console.log('アンケート期間外:', { now, startDate, endDate });
          setIsExpired(true);
        }
        
        // 質問の順番でソート
        surveyData.questions.sort((a, b) => a.order - b.order);
        
      } catch (error) {
        console.error('アンケート読み込みエラー:', error);
        setError('アンケートの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSurvey();
  }, [surveyId, fetchSurveyById, messageId, recipientPhone, senderPhone]);
  
  // 回答処理
  const handleSingleSelect = (questionId: string, optionId: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  const handleMultiSelect = (questionId: string, optionId: string) => {
    setResponses(prev => {
      const currentSelections = (prev[questionId] as string[]) || [];
      
      if (currentSelections.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentSelections.filter(id => id !== optionId)
        };
      } else {
        // 最大選択数チェック
        if (survey?.maxSelections && currentSelections.length >= survey.maxSelections) {
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
    setResponses(prev => ({
      ...prev,
      [questionId]: text
    }));
  };
  
  // ナビゲーション処理
  const handleNext = () => {
    if (!survey || !survey.questions) return;
    
    const currentQuestion = survey.questions[currentStep];
    
    // 入力チェック
    if (!responses[currentQuestion.id]) {
      // 実際のシステムではここでバリデーションエラーを表示する
      alert('質問に回答してください');
      return;
    }
    
    if (currentStep < survey.questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // 送信処理
  const handleSubmit = async () => {
    if (!survey || !surveyId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // ここで回答データを作成
      const responseData = {
        id: uuidv4(),
        surveyId,
        recipientPhoneNumber: recipientPhone || 'unknown',
        senderPhoneNumber: senderPhone || 'unknown',
        messageId: messageId || uuidv4(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        answers: Object.entries(responses).flatMap(([questionId, value]) => {
          const question = survey.questions.find(q => q.id === questionId);
          
          if (!question) return [];
          
          if (question.questionType === 'free') {
            return [{
              id: uuidv4(),
              responseId: uuidv4(),
              questionId,
              freeText: value as string,
              answeredAt: new Date().toISOString()
            }];
          } else if (question.questionType === 'single') {
            return [{
              id: uuidv4(),
              responseId: uuidv4(),
              questionId,
              optionId: value as string,
              answeredAt: new Date().toISOString()
            }];
          } else if (question.questionType === 'multiple') {
            return (value as string[]).map(optionId => ({
              id: uuidv4(),
              responseId: uuidv4(),
              questionId,
              optionId,
              answeredAt: new Date().toISOString()
            }));
          }
          
          return [];
        })
      };
      
      // 実際のシステムではここでAPIに送信する
      console.log('送信データ:', responseData);
      
      // 送信成功
      await new Promise(resolve => setTimeout(resolve, 800)); // 送信中の表示のため
      setIsSubmitted(true);
      
    } catch (error) {
      alert('回答の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
          <p className="mt-2 text-grey-500">アンケートを読み込み中...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center py-8 px-6">
          <h2 className="text-xl font-bold text-error-600 mb-2">エラーが発生しました</h2>
          <p className="text-grey-600 mb-6">{error}</p>
          <a href="/" className="btn-primary">トップページに戻る</a>
        </div>
      </div>
    );
  }
  
  if (isExpired || !survey) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center py-8 px-6">
          <h2 className="text-xl font-bold text-grey-900 mb-2">
            {survey ? survey.expirationText : 'アンケートが期限切れです'}
          </h2>
          <p className="text-grey-600 mb-6">
            このアンケートの回答受付期間は終了しました。
          </p>
          <a href="/" className="btn-primary">トップページに戻る</a>
        </div>
      </div>
    );
  }
  
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center py-8 px-6">
          <h2 className="text-xl font-bold text-grey-900 mb-4">{survey.completionText}</h2>
          <p className="text-grey-600 mb-6">
            回答が送信されました。ご協力ありがとうございました。
          </p>
          {survey.allowMultipleAnswers && (
            <button
              onClick={() => {
                setResponses({});
                setCurrentStep(0);
                setIsSubmitted(false);
              }}
              className="btn-primary"
            >
              もう一度回答する
            </button>
          )}
        </div>
      </div>
    );
  }
  
  const currentQuestion = survey.questions[currentStep];
  
  return (
    <div className="min-h-screen bg-grey-50 flex flex-col">
      <header className="bg-white border-b border-grey-200 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-lg font-bold text-grey-900">{survey.htmlTitle}</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {survey.questions.length > 1 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-grey-500 mb-1">
                <span>進捗状況</span>
                <span>{currentStep + 1} / {survey.questions.length}</span>
              </div>
              <div className="w-full bg-grey-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${((currentStep + 1) / survey.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="card mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-grey-900 mb-4">
                {currentQuestion.questionText}
              </h2>
              
              {currentQuestion.questionType === 'single' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map(option => (
                    <label key={option.id} className="flex items-center p-3 border rounded-lg hover:bg-grey-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={responses[currentQuestion.id] === option.id}
                        onChange={() => handleSingleSelect(currentQuestion.id, option.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-grey-300"
                      />
                      <span className="ml-3 text-grey-700">{option.optionText}</span>
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
                    <label key={option.id} className="flex items-center p-3 border rounded-lg hover:bg-grey-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(responses[currentQuestion.id] as string[] || []).includes(option.id)}
                        onChange={() => handleMultiSelect(currentQuestion.id, option.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-grey-300 rounded"
                      />
                      <span className="ml-3 text-grey-700">{option.optionText}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {currentQuestion.questionType === 'free' && (
                <textarea
                  value={(responses[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleFreeText(currentQuestion.id, e.target.value)}
                  rows={5}
                  className="form-textarea w-full"
                  placeholder="ここに回答を入力してください..."
                />
              )}
            </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
              )}
              {currentStep < survey.questions.length - 1 ? '次へ' : '送信'}
            </button>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-grey-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-grey-600">
          &copy; {new Date().getFullYear()} SMSOne アンケートシステム
        </div>
      </footer>
    </div>
  );
};

export default SurveyResponse; 