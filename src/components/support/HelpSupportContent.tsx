import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Grid, List, HelpCircle, 
  Mail, FileText, ExternalLink, ChevronLeft, ChevronRight,
  BookOpen, Info, Smartphone, Send, FileQuestion, Shield
} from 'lucide-react';
import { FAQItem } from '../../types';
import useFAQStore from '../../store/faqStore';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';

const HelpSupportContent: React.FC = () => {
  const { faqs, isLoading, error, fetchFAQs, getAllCategories } = useFAQStore();
  const { hasPermission } = useAuthStore();
  const isSystemAdmin = useAuthStore(state => state.user?.role === 'SYSTEM_ADMIN');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 初期データ取得
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);
  
  // 絞り込み
  useEffect(() => {
    let result = [...faqs];
    
    if (categoryFilter !== 'all') {
      result = result.filter(faq => faq.category === categoryFilter);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(lowerSearchTerm) ||
        faq.answer.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    setFilteredFAQs(result);
    setCurrentPage(1); // 検索条件変更時はページを1に戻す
  }, [faqs, searchTerm, categoryFilter]);
  
  const totalPages = Math.max(1, Math.ceil(filteredFAQs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFAQs.slice(indexOfFirstItem, indexOfLastItem);
  
  // カテゴリーの一覧を取得
  const categories = ['all', ...getAllCategories()];
  
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
        <p className="mt-2 text-grey-500">データを読み込み中...</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-4 border-b border-grey-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-grey-900">よくある質問</h2>
          
          {isSystemAdmin && (
            <Link to="/dashboard/faq-management" className="btn-secondary text-sm">
              FAQ管理
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-grey-400" />
            </div>
            <input
              type="search"
              placeholder="質問や回答を検索..."
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

          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            フィルター
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select min-w-[160px]"
            >
              <option value="all">すべてのカテゴリー</option>
              {categories.filter(c => c !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-4">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-grey-900">質問が見つかりません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm || categoryFilter !== 'all'
                ? '検索条件に一致する質問が見つかりませんでした。'
                : 'FAQが存在しません。'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg border hover:border-primary-500 transition-colors p-4"
              >
                <h4 className="font-medium text-grey-900 flex items-center">
                  <HelpCircle className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
                  <span>{faq.question}</span>
                </h4>
                <p className="text-grey-600 mt-2 text-sm">
                  {faq.answer}
                </p>
                <div className="mt-3 pt-2 border-t border-grey-100">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-grey-100 text-grey-800">
                    {faq.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg border hover:border-primary-500 transition-colors p-4"
              >
                <div className="flex items-start">
                  <HelpCircle className="w-4 h-4 text-primary-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-grey-900">{faq.question}</h4>
                    <p className="text-grey-600 mt-1 text-sm">{faq.answer}</p>
                    <div className="mt-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-grey-100 text-grey-800">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredFAQs.length > itemsPerPage && (
        <div className="px-4 py-3 border-t border-grey-200 flex items-center justify-between">
          <div className="text-sm text-grey-500">
            全 {filteredFAQs.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredFAQs.length)} 件を表示
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

      <div className="p-4 border-t border-grey-200">
        <h3 className="text-lg font-medium mb-4">サポート情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-grey-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-grey-900">メールサポート</h3>
                <p className="text-grey-600 text-sm mt-1">
                  平日9:00～18:00（土日祝日・年末年始を除く）
                </p>
                <a 
                  href="mailto:contact@topaz.jp" 
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block font-medium"
                >
                  contact@topaz.jp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpSupportContent; 