import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, BarChart, Eye, Calendar, 
  Users, FileText, EyeOff, ChevronLeft, ChevronRight,
  Filter, CheckCircle, AlertCircle, Clock, MoreVertical,
  Grid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSurveyStore from '../store/surveyStore';
import { Survey, SurveyStatus } from '../types';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Surveys: React.FC = () => {
  const { surveys, isLoading, fetchSurveys, deleteSurvey } = useSurveyStore();
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);
  
  useEffect(() => {
    let result = [...surveys];
    
    if (statusFilter !== 'all') {
      result = result.filter(survey => survey.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(survey => survey.type === typeFilter);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(survey => 
        survey.title.toLowerCase().includes(lowerSearchTerm) ||
        survey.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    setFilteredSurveys(result);
  }, [surveys, searchTerm, statusFilter, typeFilter]);
  
  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurveys.slice(indexOfFirstItem, indexOfLastItem);
  
  const handleDeleteSurvey = async (survey: Survey) => {
    if (!window.confirm('このアンケートを削除してもよろしいですか？')) return;
    
    try {
      await deleteSurvey(survey.id);
      toast.success('アンケートを削除しました');
    } catch (error) {
      toast.error('アンケートの削除に失敗しました');
    }
  };
  
  const handleToggleStatus = async (survey: Survey) => {
    try {
      await deleteSurvey(survey.id);
      toast.success('アンケートのステータスを変更しました');
    } catch (error) {
      toast.error('アンケートのステータス変更に失敗しました');
    }
  };
  
  const handleEditSurvey = (id: string) => {
    if (!hasPermission('surveysCreation')) {
      toast.error('アンケート編集の権限がありません');
      return;
    }
    navigate(`/dashboard/surveys/edit/${id}`);
  };
  
  const handleViewStats = (id: string) => {
    navigate(`/dashboard/surveys/${id}/stats`);
  };
  
  const getStatusIcon = (status: SurveyStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-grey-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-grey-500" />;
    }
  };
  
  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-grey-50 text-grey-700 border-grey-200';
      default:
        return 'bg-grey-50 text-grey-700 border-grey-200';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">アンケート管理</h1>

      <div className="bg-white rounded-lg shadow-sm border border-grey-200">
        <div className="p-4 border-b border-grey-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-grey-900">アンケート一覧</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-grey-400" />
              </div>
              <input
                type="search"
                placeholder="アンケート名、説明文で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-5 w-5 text-grey-700" />
              </button>
              <button
                type="button"
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-grey-200' : 'hover:bg-grey-100'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-5 w-5 text-grey-700" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                フィルター
              </button>
              <button
                onClick={() => navigate('/dashboard/surveys/create')}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                新規作成
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SurveyStatus | 'all')}
                className="form-select min-w-[160px]"
              >
                <option value="all">すべてのステータス</option>
                <option value="draft">下書き</option>
                <option value="active">公開中</option>
                <option value="completed">完了</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select min-w-[160px]"
              >
                <option value="all">すべてのタイプ</option>
                <option value="single">単一選択</option>
                <option value="multiple">複数選択</option>
                <option value="text">テキスト</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-grey-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-grey-900">アンケートが見つかりません</h3>
              <p className="mt-1 text-sm text-grey-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? '検索条件に一致するアンケートが見つかりませんでした。'
                  : 'アンケートが存在しません。'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-lg border hover:border-primary-500 transition-colors"
                >
                  <div className="p-4">
                    <div>
                      <h3 className="text-lg font-medium text-grey-900">{survey.title}</h3>
                      <p className="text-sm text-grey-500 mt-0.5">{survey.description || 'アンケートの説明がありません'}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-grey-500">
                        <Calendar className="h-4 w-4" />
                        <span>作成日: {new Date(survey.createdAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-grey-500">
                        <Users className="h-4 w-4" />
                        <span>回答数: {survey.responseCount || 0}件</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-4 flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      survey.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-grey-100 text-grey-800'
                    }`}>
                      {survey.status === 'active' ? '公開中' : '下書き'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewStats(survey.id)}
                        className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                      >
                        <BarChart className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditSurvey(survey.id)}
                        className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(survey)}
                        className={`p-1 rounded hover:bg-grey-100 ${
                          survey.status === 'active' ? 'text-error-600 hover:text-error-900' : 'text-primary-600 hover:text-primary-900'
                        }`}
                      >
                        {survey.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((survey) => (
                <div
                  key={survey.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-grey-900 truncate">{survey.title}</h3>
                    <p className="mt-1 text-sm text-grey-500 truncate">{survey.description || 'アンケートの説明がありません'}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-grey-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        作成日: {new Date(survey.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        回答数: {survey.responseCount || 0}件
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      survey.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-grey-100 text-grey-800'
                    }`}>
                      {survey.status === 'active' ? '公開中' : '下書き'}
                    </span>
                    <button
                      onClick={() => handleViewStats(survey.id)}
                      className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                    >
                      <BarChart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditSurvey(survey.id)}
                      className="p-1 text-grey-500 hover:text-primary-600 rounded hover:bg-grey-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(survey)}
                      className={`p-1 rounded hover:bg-grey-100 ${
                        survey.status === 'active' ? 'text-error-600 hover:text-error-900' : 'text-primary-600 hover:text-primary-900'
                      }`}
                    >
                      {survey.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredSurveys.length > 0 && (
          <div className="px-4 py-3 border-t border-grey-200 flex items-center justify-between">
            <div className="text-sm text-grey-500">
              全 {filteredSurveys.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSurveys.length)} 件を表示
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm disabled:opacity-50 px-3 py-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-sm disabled:opacity-50 px-3 py-1.5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Surveys;