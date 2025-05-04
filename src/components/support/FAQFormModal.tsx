import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FAQItem, FAQCategory } from '../../types';
import useFAQStore from '../../store/faqStore';
import { toast } from 'react-hot-toast';

interface FAQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq: FAQItem | null;
}

const FAQFormModal: React.FC<FAQFormModalProps> = ({ 
  isOpen, 
  onClose, 
  faq 
}) => {
  const { createFAQ, updateFAQ } = useFAQStore();
  const isEditMode = !!faq;
  
  // フォームの状態
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: ''
  });
  
  // エラー状態
  const [errors, setErrors] = useState({
    question: '',
    answer: '',
    category: ''
  });
  
  // フォーム送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 編集時のデータ初期化
  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category
      });
    } else {
      // 新規作成時はフォームをリセット
      setFormData({
        question: '',
        answer: '',
        category: ''
      });
    }
  }, [faq]);
  
  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 入力時にエラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // バリデーション
  const validateForm = () => {
    const newErrors = {
      question: '',
      answer: '',
      category: ''
    };
    
    if (!formData.question.trim()) {
      newErrors.question = '質問を入力してください';
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = '回答を入力してください';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'カテゴリーを選択してください';
    }
    
    setErrors(newErrors);
    
    // エラーがない場合はtrue、ある場合はfalseを返す
    return !Object.values(newErrors).some(error => error);
  };
  
  // 送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && faq) {
        await updateFAQ(faq.id, formData);
        toast.success('FAQを更新しました');
      } else {
        await createFAQ(formData);
        toast.success('FAQを作成しました');
      }
      
      onClose();
    } catch (error) {
      toast.error(isEditMode ? 'FAQの更新に失敗しました' : 'FAQの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  const categories: FAQCategory[] = [
    '送信', 
    'テンプレート', 
    '履歴', 
    'アカウント', 
    'セキュリティ',
    'アンケート',
    'その他'
  ];
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景オーバーレイ */}
        <div className="fixed inset-0 bg-grey-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

        {/* モーダルの中央配置 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* モーダルコンテンツ */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-3 border-b border-grey-200 mb-4">
              <h3 className="text-lg leading-6 font-medium text-grey-900" id="modal-title">
                {isEditMode ? 'FAQを編集' : 'FAQを追加'}
              </h3>
              <button
                type="button"
                className="bg-white rounded-md text-grey-400 hover:text-grey-500"
                onClick={onClose}
              >
                <span className="sr-only">閉じる</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="question" className="block text-sm font-medium text-grey-700 mb-1">
                  質問 <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  className={`form-input w-full ${errors.question ? 'border-error-500' : ''}`}
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="例: SMSの送信に失敗する場合はどうすればよいですか？"
                />
                {errors.question && (
                  <p className="mt-1 text-sm text-error-600">{errors.question}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="answer" className="block text-sm font-medium text-grey-700 mb-1">
                  回答 <span className="text-error-600">*</span>
                </label>
                <textarea
                  id="answer"
                  name="answer"
                  rows={5}
                  className={`form-textarea w-full ${errors.answer ? 'border-error-500' : ''}`}
                  value={formData.answer}
                  onChange={handleChange}
                  placeholder="例: 送信エラーが発生した場合は、電話番号の形式が正しいか確認してください..."
                />
                {errors.answer && (
                  <p className="mt-1 text-sm text-error-600">{errors.answer}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-grey-700 mb-1">
                  カテゴリー <span className="text-error-600">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  className={`form-select w-full ${errors.category ? 'border-error-500' : ''}`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">カテゴリーを選択</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-error-600">{errors.category}</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      処理中...
                    </span>
                  ) : isEditMode ? '更新する' : '作成する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQFormModal; 