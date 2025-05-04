import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, ClipboardList, BarChart2, CheckCircle, Activity, Smile, Package, Users, TrendingUp, Repeat, Star, ThumbsUp, Heart, UserCheck, Eye, ExternalLink, LayoutGrid, List } from 'lucide-react';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart as RechartPieChart, Pie, Cell, Line } from 'recharts';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ExportControls } from '../common/ExportControls';

// モックデータ
interface Survey {
  id: string;
  title: string;
  createdAt: string;
  responseCount: number;
  completionRate: number;
  isActive: boolean;
  type?: SurveyType;
  url?: string;
}

interface TimeSeriesData {
  surveyId: string;
  date: string;
  count: number;
}

interface SurveyQuestion {
  id: string;
  surveyId: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'rating';
  options?: string[];
  responses: any[];
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  createdAt: string;
  completed: boolean;
  answers: {
    questionId: string;
    answer: any;
  }[];
}

// アンケートタイプの定義
type SurveyType = 
  | 'customer_satisfaction'  // 顧客満足度調査
  | 'product_feedback'      // 商品フィードバック
  | 'event_feedback'        // イベントフィードバック
  | 'employee_survey'       // 従業員アンケート
  | 'market_research'       // 市場調査
  | 'general';              // 一般アンケート

// アンケートタイプに応じたカラースキーム（メッセージ分析の色に合わせて調整）
const surveyTypeColors: Record<SurveyType, { primary: string; secondary: string; accent: string }> = {
  customer_satisfaction: {
    primary: 'from-blue-50 to-indigo-50',
    secondary: 'from-indigo-50 to-blue-50',
    accent: '#3B82F6' // primary
  },
  product_feedback: {
    primary: 'from-green-50 to-emerald-50',
    secondary: 'from-emerald-50 to-green-50',
    accent: '#10B981' // success
  },
  event_feedback: {
    primary: 'from-purple-50 to-indigo-50',
    secondary: 'from-indigo-50 to-purple-50',
    accent: '#8B5CF6' // purple
  },
  employee_survey: {
    primary: 'from-orange-50 to-amber-50',
    secondary: 'from-amber-50 to-orange-50',
    accent: '#F59E0B' // warning
  },
  market_research: {
    primary: 'from-cyan-50 to-blue-50',
    secondary: 'from-blue-50 to-cyan-50',
    accent: '#0EA5E9' // sky
  },
  general: {
    primary: 'from-gray-50 to-slate-50',
    secondary: 'from-slate-50 to-gray-50',
    accent: '#6B7280' // gray
  }
};

// アンケートタイプに応じたアイコン（メッセージ分析の色に合わせて調整）
const surveyTypeIcons: Record<SurveyType, React.ReactNode> = {
  customer_satisfaction: <Smile className="h-5 w-5 text-blue-500" />,
  product_feedback: <Package className="h-5 w-5 text-green-500" />,
  event_feedback: <Calendar className="h-5 w-5 text-purple-500" />,
  employee_survey: <Users className="h-5 w-5 text-orange-500" />,
  market_research: <BarChart2 className="h-5 w-5 text-cyan-500" />,
  general: <ClipboardList className="h-5 w-5 text-gray-500" />
};

// アンケートタイプに応じた追加メトリクス（メッセージ分析の色に合わせて調整）
const getAdditionalMetrics = (surveyType: SurveyType, survey: any) => {
  switch (surveyType) {
    case 'customer_satisfaction':
      return [
        { label: 'NPS', value: '75', icon: <TrendingUp className="h-5 w-5 text-blue-500" /> },
        { label: '再購入意向', value: '82%', icon: <Repeat className="h-5 w-5 text-green-500" /> }
      ];
    case 'product_feedback':
      return [
        { label: '製品満足度', value: '4.5/5', icon: <Star className="h-5 w-5 text-yellow-500" /> },
        { label: '推奨意向', value: '88%', icon: <ThumbsUp className="h-5 w-5 text-green-500" /> }
      ];
    case 'event_feedback':
      return [
        { label: '参加満足度', value: '4.7/5', icon: <Star className="h-5 w-5 text-yellow-500" /> },
        { label: '次回参加意向', value: '91%', icon: <Calendar className="h-5 w-5 text-purple-500" /> }
      ];
    case 'employee_survey':
      return [
        { label: 'エンゲージメント', value: '78%', icon: <Heart className="h-5 w-5 text-red-500" /> },
        { label: '定着意向', value: '85%', icon: <UserCheck className="h-5 w-5 text-green-500" /> }
      ];
    case 'market_research':
      return [
        { label: '市場シェア', value: '32%', icon: <RechartPieChart className="h-5 w-5 text-blue-500" /> },
        { label: '認知度', value: '67%', icon: <Eye className="h-5 w-5 text-purple-500" /> }
      ];
    default:
      return [];
  }
};

const colors = {
  primary: '#3B82F6',    // 青
  secondary: '#10B981',  // 緑
  accent: '#7B61FF',     // 紫
  error: '#EF4444',      // 赤
  domestic: '#4285F4',  // 青
  international: '#FF4081' // ピンク
};

const SurveyAnalytics: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [exportPeriod, setExportPeriod] = useState<'today' | '7days' | '14days' | '30days' | '90days' | 'custom'>('30days');
  const navigate = useNavigate();
  
  // コンポーネントがマウントされたときに初期化
  useEffect(() => {
    // 初期化処理
    
    // クリーンアップ関数
    return () => {
      setSelectedSurveyId(null);
      setSelectedSurvey(null);
      setSurveyQuestions([]);
      setTimeSeriesData([]);
    };
  }, []);
  
  // モーダルを閉じる共通関数
  const closeModal = () => {
    setSelectedSurveyId(null);
    setSelectedSurvey(null);
  };
  
  // モックデータ作成（より充実したデータを生成）
  const surveys: Survey[] = React.useMemo(() => {
    return [
      {
        id: 'survey-1',
        title: 'お客様満足度調査',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 187,
        completionRate: 92.5,
        isActive: true,
        type: 'customer_satisfaction',
        url: 'https://example.com/survey-1',
      },
      {
        id: 'survey-2',
        title: '商品購入後アンケート',
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 143,
        completionRate: 88.2,
        isActive: true,
        type: 'product_feedback',
        url: 'https://example.com/survey-2',
      },
      {
        id: 'survey-3',
        title: 'サービス利用後アンケート',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 98,
        completionRate: 85.7,
        isActive: true,
        type: 'event_feedback',
        url: 'https://example.com/survey-3',
      },
      {
        id: 'survey-4',
        title: 'ウェブサイト使用感調査',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 76,
        completionRate: 79.3,
        isActive: true,
        type: 'customer_satisfaction',
        url: 'https://example.com/survey-4',
      },
      {
        id: 'survey-5',
        title: 'イベント参加後アンケート',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 42,
        completionRate: 94.1,
        isActive: true,
        type: 'event_feedback',
        url: 'https://example.com/survey-5',
      },
      {
        id: 'survey-6',
        title: '新機能フィードバック',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 21,
        completionRate: 81.0,
        isActive: true,
        type: 'customer_satisfaction',
        url: 'https://example.com/survey-6',
      },
      {
        id: 'survey-7',
        title: '年末顧客満足度調査',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 203,
        completionRate: 90.2,
        isActive: false,
        type: 'customer_satisfaction',
        url: 'https://example.com/survey-7',
      },
      {
        id: 'survey-8',
        title: '従業員満足度調査',
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 48,
        completionRate: 97.8,
        isActive: false,
        type: 'employee_survey',
        url: 'https://example.com/survey-8',
      }
    ];
  }, []);
  
  // フィルタリング
  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // エクスポートボタンの表示条件を修正
  const shouldShowExportButton = selectedSurveyId !== null && selectedSurvey !== null;

  // エクスポート期間変更ハンドラ
  const handleExportPeriodChange = (period: 'today' | '7days' | '14days' | '30days' | '90days' | 'custom') => {
    setExportPeriod(period);
  };
      
  // カスタム期間変更ハンドラ
  const handleCustomPeriodChange = (startDate: string, endDate: string) => {
    // カスタム期間の処理を実装
    console.log('カスタム期間:', startDate, endDate);
  };
  
  // アンケート選択時の処理を修正
  const handleSurveySelect = (surveyId: string) => {
    // 同じアンケートが選択された場合はモーダルを閉じる
    if (selectedSurveyId === surveyId) {
      closeModal();
      return;
    }
    
    // まず状態をリセット
    setSelectedSurveyId(null);
    setSelectedSurvey(null);
    setSurveyQuestions([]);
    setTimeSeriesData([]);
    
    // 少し遅らせて新しい状態をセット（レンダリングサイクルを分離）
    setTimeout(() => {
      const foundSurvey = surveys.find(s => s.id === surveyId);
      if (foundSurvey) {
        setSelectedSurveyId(surveyId);
        setSelectedSurvey(foundSurvey);
        
        // モックデータ: アンケートの質問とそれに対する回答データを生成
        const mockQuestions: SurveyQuestion[] = [
          {
            id: `${foundSurvey.id}-q1`,
            surveyId: foundSurvey.id,
            question: foundSurvey.title.includes('満足度') 
              ? '当社のサービスにどの程度満足していますか？' 
              : '商品・サービスの品質にどの程度満足していますか？',
            type: 'single',
            options: ['非常に満足', '満足', 'どちらでもない', '不満', '非常に不満'],
            responses: [
              { option: '非常に満足', count: Math.floor(Math.random() * 30) + 20 },
              { option: '満足', count: Math.floor(Math.random() * 40) + 30 },
              { option: 'どちらでもない', count: Math.floor(Math.random() * 20) + 10 },
              { option: '不満', count: Math.floor(Math.random() * 15) + 5 },
              { option: '非常に不満', count: Math.floor(Math.random() * 10) + 1 }
            ]
          },
          {
            id: `${foundSurvey.id}-q2`,
            surveyId: foundSurvey.id,
            question: '最も価値を感じた機能は何ですか？',
            type: 'multiple',
            options: ['SMS送信', '短縮URL', 'アンケート作成', '顧客管理', '分析機能'],
            responses: [
              { option: 'SMS送信', count: Math.floor(Math.random() * 50) + 30 },
              { option: '短縮URL', count: Math.floor(Math.random() * 40) + 20 },
              { option: 'アンケート作成', count: Math.floor(Math.random() * 30) + 15 },
              { option: '顧客管理', count: Math.floor(Math.random() * 35) + 25 },
              { option: '分析機能', count: Math.floor(Math.random() * 25) + 10 }
            ]
          },
          {
            id: `${foundSurvey.id}-q3`,
            surveyId: foundSurvey.id,
            question: '当社のサービスの総合評価を5段階でお答えください',
            type: 'rating',
            responses: [
              { rating: '1', count: Math.floor(Math.random() * 5) + 1 },
              { rating: '2', count: Math.floor(Math.random() * 10) + 3 },
              { rating: '3', count: Math.floor(Math.random() * 20) + 10 },
              { rating: '4', count: Math.floor(Math.random() * 30) + 25 },
              { rating: '5', count: Math.floor(Math.random() * 25) + 15 }
            ]
          },
          {
            id: `${foundSurvey.id}-q4`,
            surveyId: foundSurvey.id,
            question: '改善点やご要望があればお聞かせください',
            type: 'text',
            responses: [
              '使いやすいサービスですが、もう少し分析機能が充実するとよいと思います。',
              'SMSの送信速度がもう少し速くなるとありがたいです。',
              '全体的に満足していますが、UIがもう少し洗練されるとよいかもしれません。',
              'アンケート機能が非常に便利です。今後も期待しています。',
              '顧客データのインポート機能がもっと柔軟になるとよいです。'
            ]
          }
        ];
        setSurveyQuestions(mockQuestions);
        
        // 時系列データを生成
        const now = new Date();
        const mockTimeData: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (29 - i));
          return {
            surveyId: foundSurvey.id,
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 15) + (i < 5 ? 1 : (i < 15 ? 5 : 10))
          };
        });
        setTimeSeriesData(mockTimeData);
      }
    }, 0);
  };

  // エクスポート処理を修正
  const exportSurveyData = async () => {
    if (!selectedSurveyId || !selectedSurvey) {
      console.error('アンケートが選択されていません');
      return;
    }

    try {
    // CSV出力処理
    let csvContent = `アンケート: ${selectedSurvey.title}\n`;
    csvContent += `作成日: ${new Date(selectedSurvey.createdAt).toLocaleDateString('ja-JP')}\n`;
    csvContent += `回答数: ${selectedSurvey.responseCount}\n`;
    csvContent += `完了率: ${selectedSurvey.completionRate.toFixed(1)}%\n\n`;
    
      // 質問と回答のデータを追加
      if (surveyQuestions.length > 0) {
        csvContent += '質問と回答\n';
    surveyQuestions.forEach(question => {
          csvContent += `\n質問: ${question.question}\n`;
          if (question.responses && question.responses.length > 0) {
        question.responses.forEach(response => {
              csvContent += `回答: ${response}\n`;
        });
          }
        });
      }

      // 時系列データを追加
      if (timeSeriesData.length > 0) {
        csvContent += '\n時系列データ\n';
        csvContent += '日付,回答数\n';
        timeSeriesData.forEach(data => {
          csvContent += `${data.date},${data.count}\n`;
    });
      }

      // CSVファイルのダウンロード
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `survey_${selectedSurvey.id}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
    }
  };

  const handleUrlAnalytics = (survey: Survey) => {
    if (!survey.url) return;
    
    // URL分析の詳細画面に遷移
    navigate(`/dashboard/analytics/url/${encodeURIComponent(survey.url)}`);
  };

  // サーベイ詳細モーダルの型定義
  interface SurveyDetailsProps {
    survey: Survey;
    questions: SurveyQuestion[];
    timeSeriesData: TimeSeriesData[];
    onClose: () => void;
  }

  // 詳細モーダルコンポーネント
  const SurveyDetails: React.FC<SurveyDetailsProps> = ({ survey, questions, timeSeriesData, onClose }) => {
    if (!survey) return null;
    
    // アンケートタイプの判定
    const surveyType: SurveyType = survey.type || 'general';
    const colors = surveyTypeColors[surveyType];
    const icon = surveyTypeIcons[surveyType];
    const additionalMetrics = getAdditionalMetrics(surveyType, survey);
    
    // デモグラフィックデータを生成
    const demographicData = {
      genderData: [
        { gender: '男性', count: Math.floor(survey.responseCount * 0.55) },
        { gender: '女性', count: Math.floor(survey.responseCount * 0.43) },
        { gender: 'その他', count: Math.floor(survey.responseCount * 0.02) }
      ],
      ageGroups: [
        { group: '10代以下', count: Math.floor(survey.responseCount * 0.05) },
        { group: '20代', count: Math.floor(survey.responseCount * 0.25) },
        { group: '30代', count: Math.floor(survey.responseCount * 0.30) },
        { group: '40代', count: Math.floor(survey.responseCount * 0.20) },
        { group: '50代', count: Math.floor(survey.responseCount * 0.15) },
        { group: '60代以上', count: Math.floor(survey.responseCount * 0.05) }
      ]
    };

    // モーダルが閉じるときのハンドラ
    const handleCloseModal = () => {
      if (onClose) {
        onClose();
      }
    };
    
    return (
      <Transition appear show={!!survey} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  onClick={(e) => e.stopPropagation()} 
                  className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {icon}
                        <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                          {survey.title}
                        </Dialog.Title>
                      </div>
                      <p className="text-sm text-gray-500">
                        作成日: {new Date(survey.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm text-gray-600">回答数</span>
                          <span className="ml-2 font-semibold">{survey.responseCount}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm text-gray-600">完了率</span>
                          <span className="ml-2 font-semibold">{survey.completionRate}%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCloseModal();
                        }}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    {/* 左側のカラム - 概要と属性 */}
                    <div className="col-span-4 space-y-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">アンケート概要</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                              <span className="text-gray-600">作成日</span>
                            </div>
                            <span className="font-medium">{new Date(survey.createdAt).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                              <BarChart2 className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-gray-600">回答数</span>
                            </div>
                            <span className="font-medium">{survey.responseCount}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-indigo-500 mr-2" />
                              <span className="text-gray-600">完了率</span>
                            </div>
                            <span className="font-medium">{survey.completionRate}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                              <Activity className="h-5 w-5 text-purple-500 mr-2" />
                              <span className="text-gray-600">ステータス</span>
                            </div>
                            <span className={`font-medium ${survey.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                              {survey.isActive ? 'アクティブ' : '終了'}
                            </span>
                          </div>
                          
                          {/* アンケートタイプ固有のメトリクス */}
                          {additionalMetrics.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-600 mb-3">追加指標</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {additionalMetrics.map((metric, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                    <div className="flex items-center">
                                      {metric.icon}
                                      <span className="ml-2 text-sm text-gray-600">{metric.label}</span>
                                    </div>
                                    <span className="font-medium">{metric.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {demographicData && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">回答者属性</h3>
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-3">性別分布</h4>
                              <div className="space-y-2">
                                {demographicData.genderData.map((item: any) => (
                                  <div key={item.gender} className="flex items-center">
                                    <div className="w-24 text-sm text-gray-600">{item.gender}</div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary-600 rounded-full"
                                        style={{ width: `${Math.round(item.count / survey.responseCount * 100)}%` }}
                                      />
                                    </div>
                                    <div className="w-12 text-right text-sm font-medium">
                                      {Math.round(item.count / survey.responseCount * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-3">年代分布</h4>
                              <div className="space-y-2">
                                {demographicData.ageGroups.map((item: any) => (
                                  <div key={item.group} className="flex items-center">
                                    <div className="w-24 text-sm text-gray-600">{item.group}</div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-secondary-500 rounded-full"
                                        style={{ width: `${Math.round(item.count / survey.responseCount * 100)}%` }}
                                      />
                                    </div>
                                    <div className="w-12 text-right text-sm font-medium">
                                      {Math.round(item.count / survey.responseCount * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 右側のカラム - 質問と回答 */}
                    <div className="col-span-8 space-y-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">質問と回答</h3>
                        <div className="space-y-6">
                          {questions && questions.length > 0 ? (
                            questions.map((question: SurveyQuestion) => (
                              <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-4">{question.question}</h4>
                                
                                {question.type === 'rating' && (
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={question.responses}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="rating" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '0.5rem'
                                          }}
                                        />
                                        <Bar dataKey="count" fill={colors.accent} radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                                
                                {(question.type === 'single' || question.type === 'multiple') && (
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={question.responses} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis type="number" stroke="#6B7280" />
                                        <YAxis 
                                          dataKey="option" 
                                          type="category" 
                                          width={150} 
                                          stroke="#6B7280"
                                        />
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '0.5rem'
                                          }}
                                        />
                                        <Bar dataKey="count" fill={colors.accent} radius={[0, 0, 4, 4]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                                
                                {question.type === 'text' && (
                                  <div className="max-h-64 overflow-y-auto space-y-2">
                                    {question.responses.map((response, i) => (
                                      <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                                        {response}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">このアンケートの質問データがありません。</p>
                              <p className="text-sm text-gray-400 mt-2">または、データの読み込み中です...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-grey-900">アンケート分析</h2>
            <p className="mt-1 text-sm text-grey-500">
              SMSで送信したアンケートの回答状況を分析できます
            </p>
          </div>
        </div>
        
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-grey-400" />
            </div>
            <input
              type="search"
              className="form-input pl-10"
              placeholder="アンケート名を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-5 w-5 text-grey-700" />
              </button>
              <button
                type="button"
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-5 w-5 text-grey-700" />
              </button>
            </div>
          </div>
        </div>
        
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-md">
            <ClipboardList className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-grey-900">データがありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm ? '検索条件に一致するアンケートが見つかりませんでした。' : 'アンケートデータがありません。'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-grey-50 ${
                  selectedSurveyId === survey.id ? 'bg-primary-50' : ''
                }`}
                onClick={() => handleSurveySelect(survey.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-grey-900 line-clamp-2">
                      {survey.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-grey-500">
                      <span>{new Date(survey.createdAt).toLocaleDateString('ja-JP')}</span>
                      <span>{survey.responseCount} 回答</span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      survey.isActive ? 'bg-success-100 text-success-800' : 'bg-grey-100 text-grey-800'
                    }`}>
                      {survey.isActive ? '有効' : '終了'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-grey-200">
              <thead className="bg-grey-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    アンケート名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    回答数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    完了率
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-grey-200">
                {filteredSurveys.map((survey) => (
                  <tr 
                    key={survey.id}
                    className={`hover:bg-grey-50 cursor-pointer ${selectedSurveyId === survey.id ? 'bg-primary-50' : ''}`}
                    onClick={() => handleSurveySelect(survey.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm text-grey-900"
                      >
                        {survey.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-grey-900">{survey.responseCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-grey-900">{survey.completionRate.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                      {new Date(survey.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        survey.isActive ? 'bg-success-100 text-success-800' : 'bg-grey-100 text-grey-800'
                      }`}>
                        {survey.isActive ? '有効' : '終了'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {selectedSurvey && (
        <SurveyDetails 
          survey={selectedSurvey} 
          questions={surveyQuestions} 
          timeSeriesData={timeSeriesData}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default SurveyAnalytics; 