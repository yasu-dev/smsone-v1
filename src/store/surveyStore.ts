import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Survey, SurveyQuestion, SurveyResponse, SurveyStatistics, SurveyStatus, ApiResponse } from '../types';
import toast from 'react-hot-toast';

// モック用の生成関数
const generateMockSurveys = (count: number = 10): Survey[] => {
  const surveyTitles = [
    '顧客満足度調査 2024年第1四半期',
    '新商品に関するアンケート',
    'サービス改善のためのフィードバック調査',
    'ウェブサイトユーザビリティ調査',
    '従業員満足度調査 2024',
    'オンラインショップ利用者アンケート',
    '製品品質に関する顧客調査',
    'アプリケーション改善アンケート',
    'カスタマーサポート評価調査',
    '新機能に関するフィードバック',
    'サービス利用実態調査',
    '市場ニーズ調査 2024'
  ];

  const surveys: Survey[] = [];
  
  for (let i = 0; i < count; i++) {
    const questions: SurveyQuestion[] = [];
    const questionCount = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < questionCount; j++) {
      const questionType = Math.random() > 0.3 ? 'single' : (Math.random() > 0.5 ? 'multiple' : 'free');
      const options = questionType !== 'free' ? Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, index) => ({
        id: `option-${uuidv4()}`,
        questionId: `question-${j + 1}`,
        optionText: `選択肢 ${index + 1}`,
        order: index + 1
      })) : undefined;
      
      questions.push({
        id: `question-${j + 1}`,
        surveyId: `survey-${i + 1}`,
        questionText: `質問 ${j + 1}`,
        questionType: questionType as any,
        branchingType: 'independent',
        isEnabled: true,
        order: j + 1,
        options,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const startDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);
    
    surveys.push({
      id: `survey-${i + 1}`,
      name: surveyTitles[i % surveyTitles.length],
      title: surveyTitles[i % surveyTitles.length],
      tagName: `SURVEY${i + 1}`,
      htmlTitle: surveyTitles[i % surveyTitles.length],
      userId: `user-${Math.floor(Math.random() * 5) + 1}`,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      questionType: questions[0].questionType,
      branchingType: 'independent',
      allowMultipleAnswers: questions[0].questionType === 'multiple',
      maxSelections: questions[0].questionType === 'multiple' ? Math.floor(Math.random() * 5) + 2 : undefined,
      completionText: 'アンケートにご回答いただき、ありがとうございました。',
      expirationText: 'このアンケートの回答期間は終了しました。',
      status: ['active', 'inactive', 'draft', 'expired'][Math.floor(Math.random() * 4)] as SurveyStatus,
      questions,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return surveys;
};

// モック用の回答生成関数
const generateMockResponses = (surveys: Survey[]): SurveyResponse[] => {
  const responses: SurveyResponse[] = [];
  
  surveys.forEach(survey => {
    const responseCount = Math.floor(Math.random() * 50) + 5;
    
    for (let i = 0; i < responseCount; i++) {
      const answers = survey.questions.map(question => {
        if (question.questionType === 'free') {
          return {
            id: uuidv4(),
            responseId: `response-${i}-${survey.id}`,
            questionId: question.id,
            freeText: `自由回答テキスト${Math.floor(Math.random() * 100)}`,
            answeredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
          };
        } else {
          // 単一選択または複数選択
          const options = question.options || [];
          const selectedOptions = question.questionType === 'single'
            ? [options[Math.floor(Math.random() * options.length)]]
            : options.filter(() => Math.random() > 0.5).slice(0, Math.floor(Math.random() * options.length) + 1);
          
          return selectedOptions.map(option => ({
            id: uuidv4(),
            responseId: `response-${i}-${survey.id}`,
            questionId: question.id,
            optionId: option.id,
            answeredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
          }))[0]; // 一時的に一つだけ返す（正しくは全て返すべき）
        }
      });
      
      responses.push({
        id: `response-${i}-${survey.id}`,
        surveyId: survey.id,
        recipientPhoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
        senderPhoneNumber: `0120${Math.floor(100000 + Math.random() * 900000)}`,
        messageId: uuidv4(),
        completedAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
        answers
      });
    }
  });
  
  return responses;
};

// モック用の統計生成関数
const generateMockStatistics = (survey: Survey, responses: SurveyResponse[]): SurveyStatistics => {
  const surveyResponses = responses.filter(r => r.surveyId === survey.id);
  const totalResponses = surveyResponses.length;
  const completedResponses = surveyResponses.filter(r => r.completedAt).length;
  
  const questionStats = survey.questions.map(question => {
    const answers = surveyResponses.flatMap(r => r.answers.filter(a => a.questionId === question.id));
    
    if (question.questionType === 'free') {
      return {
        questionId: question.id,
        questionText: question.questionText,
        totalAnswers: answers.length,
        freeTextAnswers: answers.filter(a => a.freeText).map(a => a.freeText as string)
      };
    } else {
      const optionCounts = new Map<string, number>();
      
      answers.forEach(answer => {
        if (answer.optionId) {
          const count = optionCounts.get(answer.optionId) || 0;
          optionCounts.set(answer.optionId, count + 1);
        }
      });
      
      const options = question.options || [];
      const optionStats = options.map(option => {
        const count = optionCounts.get(option.id) || 0;
        return {
          optionId: option.id,
          optionText: option.optionText,
          count,
          percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0
        };
      });
      
      return {
        questionId: question.id,
        questionText: question.questionText,
        totalAnswers: answers.length,
        optionStats
      };
    }
  });
  
  return {
    totalResponses,
    completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
    averageTimeToComplete: Math.floor(Math.random() * 300) + 60, // 60-360秒
    questionStats
  };
};

interface SurveyState {
  surveys: Survey[];
  responses: SurveyResponse[];
  currentSurvey: Survey | null;
  isLoading: boolean;
  error: string | null;
  // API関数
  fetchSurveys: () => Promise<void>;
  fetchSurveyById: (id: string) => Promise<Survey | null>;
  createSurvey: (survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Survey>;
  updateSurvey: (id: string, updates: Partial<Survey>) => Promise<Survey>;
  deleteSurvey: (id: string) => Promise<boolean>;
  // レスポンス
  fetchResponses: (surveyId: string) => Promise<SurveyResponse[]>;
  fetchStatistics: (surveyId: string) => Promise<SurveyStatistics>;
  // CSV
  exportResponsesCSV: (surveyId: string) => Promise<string>;
}

const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  responses: [],
  currentSurvey: null,
  isLoading: false,
  error: null,
  
  // API関数の実装
  fetchSurveys: async () => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch('/api/surveys');
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockSurveys = generateMockSurveys(10);
      
      set({
        surveys: mockSurveys,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({
        isLoading: false,
        error: 'アンケートの取得に失敗しました'
      });
      toast.error('アンケートの取得に失敗しました');
    }
  },
  
  fetchSurveyById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${id}`);
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 500));
      const { surveys } = get();
      const survey = surveys.find(s => s.id === id) || null;
      
      if (!survey) {
        console.log('アンケートが見つからないため、デフォルトのモックデータを使用します');
        // アンケートが見つからない場合でもダミーデータを返す
        const dummySurvey: Survey = {
          id: id,
          name: `デモアンケート`,
          tagName: 'DEMO',
          htmlTitle: '顧客満足度調査（デモ）',
          userId: 'demo-user',
          startDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          questionType: 'single',
          branchingType: 'independent',
          allowMultipleAnswers: false,
          maxSelections: undefined,
          completionText: 'アンケートにご回答いただき、ありがとうございました。',
          expirationText: 'このアンケートの回答期間は終了しました。',
          status: 'active',
          questions: [
            {
              id: 'q1',
              surveyId: id,
              questionText: '当社のサービスにどの程度満足していますか？',
              questionType: 'single',
              branchingType: 'independent',
              isEnabled: true,
              order: 1,
              options: [
                { id: 'o1', questionId: 'q1', optionText: '非常に満足', order: 1 },
                { id: 'o2', questionId: 'q1', optionText: '満足', order: 2 },
                { id: 'o3', questionId: 'q1', optionText: 'どちらとも言えない', order: 3 },
                { id: 'o4', questionId: 'q1', optionText: '不満', order: 4 },
                { id: 'o5', questionId: 'q1', optionText: '非常に不満', order: 5 }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'q2',
              surveyId: id,
              questionText: '最も利用頻度の高い機能は何ですか？',
              questionType: 'single',
              branchingType: 'independent',
              isEnabled: true,
              order: 2,
              options: [
                { id: 'o6', questionId: 'q2', optionText: 'SMS送信', order: 1 },
                { id: 'o7', questionId: 'q2', optionText: '短縮URL', order: 2 },
                { id: 'o8', questionId: 'q2', optionText: 'アンケート機能', order: 3 },
                { id: 'o9', questionId: 'q2', optionText: '送信予約', order: 4 },
                { id: 'o10', questionId: 'q2', optionText: '統計分析', order: 5 }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'q3',
              surveyId: id,
              questionText: '当社のサービスについてご意見・ご要望があればお聞かせください',
              questionType: 'free',
              branchingType: 'independent',
              isEnabled: true,
              order: 3,
              options: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set({
          currentSurvey: dummySurvey,
          isLoading: false
        });
        
        return dummySurvey;
      }
      
      set({
        currentSurvey: survey,
        isLoading: false
      });
      
      return survey;
    } catch (error) {
      console.error('Error fetching survey:', error);
      
      // エラー時でもデモデータを返す
      const demoSurvey: Survey = {
        id: id,
        name: 'エラー時デモアンケート',
        tagName: 'DEMO',
        htmlTitle: '顧客満足度調査（デモ）',
        userId: 'demo-user',
        startDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        questionType: 'single',
        branchingType: 'independent',
        allowMultipleAnswers: false,
        maxSelections: undefined,
        completionText: 'アンケートにご回答いただき、ありがとうございました。',
        expirationText: 'このアンケートの回答期間は終了しました。',
        status: 'active',
        questions: [
          {
            id: 'q1',
            surveyId: id,
            questionText: 'エラー時: 当社のサービスにどの程度満足していますか？',
            questionType: 'single',
            branchingType: 'independent',
            isEnabled: true,
            order: 1,
            options: [
              { id: 'o1', questionId: 'q1', optionText: '非常に満足', order: 1 },
              { id: 'o2', questionId: 'q1', optionText: '満足', order: 2 }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set({
        isLoading: false,
        error: 'アンケートの取得に失敗しました',
        currentSurvey: demoSurvey
      });
      
      toast.error('アンケートの取得に失敗しました');
      return demoSurvey;
    }
  },
  
  createSurvey: async (surveyData) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch('/api/surveys', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(surveyData)
      // });
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 800));
      const newSurvey: Survey = {
        ...surveyData,
        id: `survey-${uuidv4()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        surveys: [...state.surveys, newSurvey],
        isLoading: false
      }));
      
      toast.success('アンケートを作成しました');
      return newSurvey;
    } catch (error) {
      console.error('Error creating survey:', error);
      set({
        isLoading: false,
        error: 'アンケートの作成に失敗しました'
      });
      toast.error('アンケートの作成に失敗しました');
      throw error;
    }
  },
  
  updateSurvey: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 500));
      const { surveys } = get();
      const surveyIndex = surveys.findIndex(s => s.id === id);
      
      if (surveyIndex === -1) {
        throw new Error('アンケートが見つかりませんでした');
      }
      
      const updatedSurvey = {
        ...surveys[surveyIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const updatedSurveys = [...surveys];
      updatedSurveys[surveyIndex] = updatedSurvey;
      
      set({
        surveys: updatedSurveys,
        currentSurvey: updatedSurvey,
        isLoading: false
      });
      
      toast.success('アンケートを更新しました');
      return updatedSurvey;
    } catch (error) {
      console.error('Error updating survey:', error);
      set({
        isLoading: false,
        error: 'アンケートの更新に失敗しました'
      });
      toast.error('アンケートの更新に失敗しました');
      throw error;
    }
  },
  
  deleteSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${id}`, {
      //   method: 'DELETE'
      // });
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 500));
      const { surveys } = get();
      const updatedSurveys = surveys.filter(s => s.id !== id);
      
      set({
        surveys: updatedSurveys,
        isLoading: false
      });
      
      toast.success('アンケートを削除しました');
      return true;
    } catch (error) {
      console.error('Error deleting survey:', error);
      set({
        isLoading: false,
        error: 'アンケートの削除に失敗しました'
      });
      toast.error('アンケートの削除に失敗しました');
      return false;
    }
  },
  
  fetchResponses: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${surveyId}/responses`);
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 800));
      const { surveys } = get();
      const survey = surveys.find(s => s.id === surveyId);
      
      if (!survey) {
        console.log('アンケートが見つからないため、デフォルトのモックデータを使用します');
        // アンケートが見つからない場合でもダミーデータを返す
        const dummySurvey: Survey = {
          id: surveyId,
          name: `テストアンケート`,
          tagName: 'TEST',
          htmlTitle: 'テスト用アンケート',
          userId: 'testuser',
          startDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          questionType: 'single',
          branchingType: 'independent',
          allowMultipleAnswers: false,
          completionText: 'ご回答ありがとうございました',
          expirationText: 'このアンケートは終了しました',
          status: 'active',
          questions: [
            {
              id: 'q1',
              surveyId: surveyId,
              questionText: 'サンプル質問1',
              questionType: 'single',
              branchingType: 'independent',
              isEnabled: true,
              order: 1,
              options: [
                { id: 'o1', questionId: 'q1', optionText: '選択肢1', order: 1 },
                { id: 'o2', questionId: 'q1', optionText: '選択肢2', order: 2 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockResponses = generateMockResponses([dummySurvey]);
        set({ responses: mockResponses, isLoading: false });
        return mockResponses;
      }
      
      const mockResponses = generateMockResponses([survey]);
      set({ responses: mockResponses, isLoading: false });
      
      return mockResponses;
    } catch (error) {
      console.error('Error fetching responses:', error);
      
      // エラー時にもダミーデータを返す
      const dummyResponses = Array.from({ length: 10 }, (_, i) => ({
        id: `dummy-response-${i}`,
        surveyId: surveyId,
        recipientPhoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
        senderPhoneNumber: `8150${Math.floor(1000 + Math.random() * 9000)}`,
        messageId: `msg-${Date.now()}-${i}`,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        answers: []
      }));
      
      set({
        responses: dummyResponses,
        isLoading: false,
        error: 'アンケート回答の取得に失敗しました'
      });
      
      toast.error('アンケート回答の取得に失敗しました');
      return dummyResponses;
    }
  },
  
  fetchStatistics: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${surveyId}/statistics`);
      // const data = await response.json();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { surveys } = get();
      const survey = surveys.find(s => s.id === surveyId);
      
      if (!survey) {
        console.log('アンケートが見つからないため、デフォルトのモックデータを使用します');
        // アンケートが見つからない場合でも統計データを生成
        const dummySurvey: Survey = {
          id: surveyId,
          name: `テストアンケート`,
          tagName: 'TEST',
          htmlTitle: 'テスト用アンケート',
          userId: 'testuser',
          startDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          questionType: 'single',
          branchingType: 'independent',
          allowMultipleAnswers: false,
          completionText: 'ご回答ありがとうございました',
          expirationText: 'このアンケートは終了しました',
          status: 'active',
          questions: [
            {
              id: 'q1',
              surveyId: surveyId,
              questionText: 'サンプル質問1',
              questionType: 'single',
              branchingType: 'independent',
              isEnabled: true,
              order: 1,
              options: [
                { id: 'o1', questionId: 'q1', optionText: '選択肢1', order: 1 },
                { id: 'o2', questionId: 'q1', optionText: '選択肢2', order: 2 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockResponses = generateMockResponses([dummySurvey]);
        const statistics = generateMockStatistics(dummySurvey, mockResponses);
        
        set({ isLoading: false });
        return statistics;
      }
      
      const mockResponses = generateMockResponses([survey]);
      const statistics = generateMockStatistics(survey, mockResponses);
      
      set({ isLoading: false });
      
      return statistics;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // エラー時でもダミーの統計データを返す
      const dummyStats: SurveyStatistics = {
        totalResponses: Math.floor(Math.random() * 100) + 50,
        completionRate: Math.random() * 85 + 15,
        averageTimeToComplete: Math.floor(Math.random() * 300) + 60,
        questionStats: [
          {
            questionId: 'q1',
            questionText: 'サンプル質問',
            totalAnswers: Math.floor(Math.random() * 80) + 20,
            optionStats: [
              {
                optionId: 'o1',
                optionText: '選択肢1',
                count: Math.floor(Math.random() * 50) + 10,
                percentage: 60
              },
              {
                optionId: 'o2',
                optionText: '選択肢2',
                count: Math.floor(Math.random() * 30) + 5,
                percentage: 40
              }
            ]
          }
        ]
      };
      
      set({
        isLoading: false,
        error: 'アンケート統計の取得に失敗しました'
      });
      toast.error('アンケート統計の取得に失敗しました');
      return dummyStats;
    }
  },
  
  exportResponsesCSV: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      // 本番ではAPIリクエストを行う
      // const response = await fetch(`/api/surveys/${surveyId}/export-csv`);
      // const data = await response.blob();
      
      // モックデータ
      await new Promise(resolve => setTimeout(resolve, 1200));
      const { surveys, responses } = get();
      const survey = surveys.find(s => s.id === surveyId);
      
      if (!survey) {
        throw new Error('アンケートが見つかりませんでした');
      }
      
      // モックのCSVデータ生成
      const surveyResponses = responses.filter(r => r.surveyId === survey.id) || [];
      
      // CSVヘッダー
      const headers = ['回答ID', '回答者', '回答日時', '完了状態'];
      survey.questions.forEach(q => {
        headers.push(`質問${q.order}: ${q.questionText}`);
      });
      
      // CSVデータ行
      const rows = surveyResponses.map(response => {
        const row = [
          response.id,
          response.recipientPhoneNumber,
          new Date(response.createdAt).toLocaleString('ja-JP'),
          response.completedAt ? '完了' : '未完了'
        ];
        
        // 各質問への回答を追加
        survey.questions.forEach(question => {
          const answer = response.answers.find(a => a.questionId === question.id);
          if (!answer) {
            row.push(''); // 回答なし
          } else if (answer.freeText) {
            row.push(answer.freeText); // 自由回答
          } else if (answer.optionId) {
            // 選択肢回答
            const option = question.options?.find(o => o.id === answer.optionId);
            row.push(option?.optionText || '');
          } else {
            row.push('');
          }
        });
        
        return row;
      });
      
      // CSV文字列生成
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Blobオブジェクト生成
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // CSVファイルをダウンロード
      if (window.navigator && 'msSaveOrOpenBlob' in window.navigator) {
        // IEとEdge用
        (window.navigator as any).msSaveBlob(blob, `survey-${surveyId}-responses.csv`);
      } else {
        // その他のブラウザ
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `survey-${surveyId}-responses.csv`);
        document.body.appendChild(link);
        link.click();
        
        // クリーンアップ
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      
      set({ isLoading: false });
      return csvContent;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      set({
        isLoading: false,
        error: 'CSVエクスポートに失敗しました'
      });
      throw error;
    }
  }
}));

export default useSurveyStore; 