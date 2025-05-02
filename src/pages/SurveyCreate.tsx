import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Save, Plus, Trash2, Eye } from 'lucide-react';
import { Survey, SurveyQuestion, QuestionType } from '../types';
import useSurveyStore from '../store/surveyStore';
import toast from 'react-hot-toast';
import SurveyFormBasic from '../components/survey/SurveyFormBasic';
import SurveyQuestionForm from '../components/survey/SurveyQuestionForm';
import SurveyPreview from '../components/survey/SurveyPreview';

const SurveyCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchSurveyById, createSurvey, updateSurvey } = useSurveyStore();
  const isEditMode = !!id;
  
  // ステート
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'questions'>('basic');
  
  // フォームデータ
  const [formData, setFormData] = useState<Partial<Survey>>({
    name: '',
    tagName: '',
    htmlTitle: '',
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
    questionType: 'single',
    branchingType: 'independent',
    allowMultipleAnswers: false,
    completionText: 'アンケートにご回答いただき、ありがとうございました。',
    expirationText: 'このアンケートの回答期間は終了しました。',
    questions: []
  });
  
  // 編集モードの場合、既存データの取得
  useEffect(() => {
    if (isEditMode && id) {
      const loadSurvey = async () => {
        setIsLoading(true);
        try {
          const survey = await fetchSurveyById(id);
          if (survey) {
            setFormData(survey);
          } else {
            toast.error('アンケートの読み込みに失敗しました');
            navigate('/surveys');
          }
        } catch (error) {
          toast.error('アンケートの読み込みに失敗しました');
          navigate('/surveys');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSurvey();
    }
  }, [id, isEditMode, fetchSurveyById, navigate]);
  
  // 基本情報更新ハンドラ
  const handleBasicInfoChange = (basicInfo: Partial<Survey>) => {
    setFormData(prev => ({
      ...prev,
      ...basicInfo
    }));
  };
  
  // 質問追加ハンドラ
  const handleAddQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `temp-${Date.now()}`, // 保存時に正式なIDに置き換える
      surveyId: id || 'new',
      questionText: '',
      questionType: formData.questionType as QuestionType || 'single',
      branchingType: 'independent',
      isEnabled: true,
      order: (formData.questions?.length || 0) + 1,
      options: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };
  
  // 質問更新ハンドラ
  const handleUpdateQuestion = (index: number, updatedQuestion: SurveyQuestion) => {
    setFormData(prev => {
      const updatedQuestions = [...(prev.questions || [])];
      updatedQuestions[index] = updatedQuestion;
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
  };
  
  // 質問削除ハンドラ
  const handleDeleteQuestion = (index: number) => {
    setFormData(prev => {
      const updatedQuestions = [...(prev.questions || [])];
      updatedQuestions.splice(index, 1);
      // 順番の再計算
      updatedQuestions.forEach((q, i) => {
        q.order = i + 1;
      });
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
  };
  
  // 保存ハンドラ
  const handleSave = async (status: 'draft' | 'active' | 'inactive' = 'draft') => {
    // バリデーション
    if (!formData.name?.trim()) {
      toast.error('アンケート名を入力してください');
      return;
    }
    
    if (!formData.tagName?.trim()) {
      toast.error('タグ名を入力してください');
      return;
    }
    
    if (!(formData.questions?.length || 0)) {
      toast.error('質問を1つ以上追加してください');
      return;
    }
    
    // 質問内容のバリデーション
    for (const [index, question] of (formData.questions || []).entries()) {
      if (!question.questionText.trim()) {
        toast.error(`質問${index + 1}のテキストを入力してください`);
        return;
      }
      
      if (question.questionType !== 'free' && !(question.options?.length || 0)) {
        toast.error(`質問${index + 1}の選択肢を追加してください`);
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      const currentFormData = {
        ...formData,
        status
      };
      
      let result;
      
      if (isEditMode && id) {
        result = await updateSurvey(id, currentFormData);
      } else {
        result = await createSurvey(currentFormData as Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      toast.success(`アンケートを${isEditMode ? '更新' : '作成'}しました`);
      navigate('/surveys');
    } catch (error) {
      toast.error(`アンケートの${isEditMode ? '更新' : '作成'}に失敗しました`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
        <p className="mt-2 text-grey-500">データを読み込み中...</p>
      </div>
    );
  }
  
  if (showPreview) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowPreview(false)}
            className="mr-2 btn-outline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            編集に戻る
          </button>
          <h1 className="text-2xl font-bold text-grey-900">プレビュー: {formData.name}</h1>
        </div>
        
        <SurveyPreview survey={formData as Survey} />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/surveys')}
            className="mr-2 btn-outline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            一覧に戻る
          </button>
          <h1 className="text-2xl font-bold text-grey-900">
            {isEditMode ? 'アンケート編集' : 'アンケート作成'}
          </h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPreview(true)}
            className="btn-secondary"
          >
            <Eye className="h-4 w-4 mr-1" />
            プレビュー
          </button>
          
          <button
            onClick={() => handleSave('draft')}
            className="btn-secondary"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            下書き保存
          </button>
          
          <button
            onClick={() => handleSave('active')}
            className="btn-primary"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isEditMode ? '更新して公開' : '作成して公開'}
          </button>
        </div>
      </div>
      
      <div className="card mb-6">
        <div className="mb-6 border-b border-grey-200">
          <div className="flex space-x-4">
            <button
              className={`pb-3 px-1 ${
                activeTab === 'basic'
                  ? 'border-b-2 border-primary-600 text-primary-600 font-medium'
                  : 'text-grey-500 hover:text-grey-700'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              基本情報
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === 'questions'
                  ? 'border-b-2 border-primary-600 text-primary-600 font-medium'
                  : 'text-grey-500 hover:text-grey-700'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              質問管理
            </button>
          </div>
        </div>
        
        {activeTab === 'basic' ? (
          <SurveyFormBasic
            formData={formData}
            onChange={handleBasicInfoChange}
          />
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-grey-900">質問一覧</h3>
              <button
                onClick={handleAddQuestion}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4 mr-1" />
                質問を追加
              </button>
            </div>
            
            {formData.questions?.length ? (
              <div className="space-y-6">
                {formData.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">質問 {index + 1}</h4>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-error-600 hover:text-error-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <SurveyQuestionForm
                      question={question}
                      onChange={(updatedQuestion) => handleUpdateQuestion(index, updatedQuestion)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-grey-50 rounded-lg">
                <p className="text-grey-500 mb-4">質問がありません</p>
                <button
                  onClick={handleAddQuestion}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  質問を追加
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SurveyCreate; 