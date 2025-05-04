import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, 
  ChevronLeft, ChevronRight, Grid, List, ArrowUp, ArrowDown 
} from 'lucide-react';
import { FAQItem } from '../types';
import useFAQStore from '../store/faqStore';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';
import FAQFormModal from '../components/support/FAQFormModal';

const FAQManagement: React.FC = () => {
  const { faqs, isLoading, error, fetchFAQs, deleteFAQ, getAllCategories } = useFAQStore();
  const hasPermission = useAuthStore(state => state.hasPermission);
  const user = useAuthStore(state => state.user);
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';
  
  // ステート
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: keyof FAQItem, direction: 'asc' | 'desc'}>({
    key: 'updatedAt',
    direction: 'desc'
  });
  
  // 初期データ取得
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);
  
  // 絞り込みとソート
  useEffect(() => {
    let result = [...faqs];
    
    // フィルタリング
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
    
    // ソート
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
    
    setFilteredFAQs(result);
    setCurrentPage(1); // 検索条件変更時はページを1に戻す
  }, [faqs, searchTerm, categoryFilter, sortConfig]);
  
  // ページネーション計算
  const totalPages = Math.max(1, Math.ceil(filteredFAQs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFAQs.slice(indexOfFirstItem, indexOfLastItem);
  
  // カテゴリーの一覧を取得
  const categories = ['all', ...getAllCategories()];
  
  // ソート変更ハンドラ
  const handleSort = (key: keyof FAQItem) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // FAQ削除ハンドラ
  const handleDeleteFAQ = async (faq: FAQItem) => {
    if (!isSystemAdmin) {
      toast.error('FAQの削除権限がありません');
      return;
    }
    
    if (!window.confirm(`この質問を削除してもよろしいですか？\n"${faq.question}"`)) {
      return;
    }
    
    try {
      await deleteFAQ(faq.id);
      toast.success('FAQを削除しました');
    } catch (error) {
      toast.error('FAQの削除に失敗しました');
    }
  };
  
  // 編集モーダル表示ハンドラ
  const handleEditFAQ = (faq: FAQItem) => {
    if (!isSystemAdmin) {
      toast.error('FAQの編集権限がありません');
      return;
    }
    
    setEditingFAQ(faq);
    setModalOpen(true);
  };
  
  // 新規作成モーダル表示ハンドラ
  const handleCreateFAQ = () => {
    if (!isSystemAdmin) {
      toast.error('FAQの作成権限がありません');
      return;
    }
    
    setEditingFAQ(null);
    setModalOpen(true);
  };
  
  // モーダルを閉じるハンドラ
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFAQ(null);
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
        <p className="mt-2 text-grey-500">データを読み込み中...</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">よくある質問管理</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-grey-200">
        <div className="p-4 border-b border-grey-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-grey-900">FAQ一覧</h2>
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

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                フィルター
              </button>
              
              {isSystemAdmin && (
                <button 
                  type="button"
                  className="btn-secondary flex items-center gap-2"
                  onClick={handleCreateFAQ}
                >
                  <Plus className="h-4 w-4" />
                  新規作成
                </button>
              )}
            </div>
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
              <svg 
                className="h-12 w-12 text-grey-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M12 16v-4M12 8h.01" />
              </svg>
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
                  <h4 className="font-medium text-grey-900">
                    {faq.question}
                  </h4>
                  <p className="text-grey-600 mt-2 text-sm line-clamp-3">
                    {faq.answer}
                  </p>
                  <div className="mt-3 pt-2 border-t border-grey-100 flex items-center justify-between">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-grey-100 text-grey-800">
                      {faq.category}
                    </span>
                    
                    {isSystemAdmin && (
                      <div className="flex gap-2">
                        <button
                          className="p-1 text-grey-600 hover:text-primary-600"
                          onClick={() => handleEditFAQ(faq)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-grey-600 hover:text-error-600"
                          onClick={() => handleDeleteFAQ(faq)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-grey-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('question')}
                    >
                      <div className="flex items-center">
                        質問
                        {sortConfig.key === 'question' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4 ml-1" /> : 
                            <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        カテゴリー
                        {sortConfig.key === 'category' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4 ml-1" /> : 
                            <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('updatedAt')}
                    >
                      <div className="flex items-center">
                        更新日
                        {sortConfig.key === 'updatedAt' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4 ml-1" /> : 
                            <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">アクション</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-200">
                  {currentItems.map((faq) => (
                    <tr key={faq.id} className="hover:bg-grey-50">
                      <td className="px-6 py-4 text-sm text-grey-900">
                        {faq.question}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-grey-100 text-grey-800">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                        {new Date(faq.updatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isSystemAdmin && (
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-primary-600 hover:text-primary-900"
                              onClick={() => handleEditFAQ(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-error-600 hover:text-error-900"
                              onClick={() => handleDeleteFAQ(faq)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>
      
      {modalOpen && (
        <FAQFormModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          faq={editingFAQ}
        />
      )}
    </motion.div>
  );
};

export default FAQManagement; 