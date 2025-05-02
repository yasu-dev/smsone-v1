import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Grid, List, HelpCircle, 
  Mail, FileText, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'SMSの送信に失敗する場合はどうすればよいですか？',
    answer: '送信エラーが発生した場合は、電話番号の形式が正しいか（国際形式の場合は国コードから始まるか）、送信可能な時間帯か（22:00～8:00は配信制限がある場合があります）、アカウントの残高が十分かを確認してください。エラーコードが表示されている場合は、そのコードをメールサポートにお知らせいただくとスムーズに対応できます。',
    category: '送信',
  },
  {
    id: '2',
    question: 'CSVで一括送信する際の正しいフォーマットを教えてください',
    answer: 'CSVファイルの1行目には必ずヘッダー（電話番号、メッセージ内容など）を入れてください。電話番号列は「phone」または「tel」、メッセージ内容列は「message」または「text」というヘッダー名を使用すると自動認識されます。電話番号は「09012345678」のようにハイフンなしの形式が推奨です。文字コードはUTF-8を使用してください。サンプルCSVは「送信履歴」画面からダウンロードできます。',
    category: '送信',
  },
  {
    id: '3',
    question: 'Excelファイルで一括送信する方法を教えてください',
    answer: 'Excel形式（.xlsx）の一括送信にも対応しています。CSVと同様に1行目にヘッダーを設定してください。「電話番号」「メッセージ」という列名が推奨されますが、英語の「phone」「message」なども自動認識されます。複数のシートがある場合は、最初のシート（Sheet1）のみが読み込まれます。日本語や絵文字を含む場合もExcel形式であれば文字化けの心配はありません。送信前には必ずプレビュー機能で内容を確認してください。',
    category: '送信',
  },
  {
    id: '4',
    question: '送信予約したSMSをキャンセルする方法は？',
    answer: '送信予約したSMSは「送信履歴」画面から確認できます。ステータスが「予約済」のメッセージを選択し、「予約キャンセル」ボタンをクリックすることでキャンセルできます。ただし、予約時刻の10分前を過ぎるとキャンセルできなくなりますのでご注意ください。',
    category: '送信',
  },
  {
    id: '5',
    question: 'メッセージテンプレートで変数を使用する方法は？',
    answer: 'メッセージテンプレートでは、「{{名前}}」のように二重波括弧で囲んだ文字を変数として使用できます。一括送信時にCSVの列名と変数名が一致すると、自動的に置換されます。例えば、CSVに「名前」という列があれば、メッセージ内の「{{名前}}」がその値に置き換わります。日時や番号などの書式設定も可能です。詳細はマニュアルをご参照ください。',
    category: 'テンプレート',
  },
  {
    id: '6',
    question: '送信したSMSの配信状況を確認するには？',
    answer: '送信したSMSの配信状況は「送信履歴」画面で確認できます。各メッセージには「送信済」「配信済」「不達」などのステータスが表示されます。詳細な配信レポートが必要な場合は、送信履歴の「レポート出力」ボタンからCSVまたはPDF形式でダウンロードできます。なお、キャリアからの配信状況の反映には数分から最大24時間かかる場合があります。',
    category: '履歴',
  },
];

const HelpSupportContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqs);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
  }, [searchTerm, categoryFilter]);
  
  const totalPages = Math.max(1, Math.ceil(filteredFAQs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFAQs.slice(indexOfFirstItem, indexOfLastItem);
  
  // カテゴリーの一覧を取得
  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  
  return (
    <>
      <div className="p-4 border-b border-grey-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-grey-900">よくある質問</h2>
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
          
          <a 
            href="https://topaz.jp/smsone/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-start p-4 bg-white rounded-lg border border-grey-200 shadow-sm hover:shadow transition-shadow"
          >
            <FileText className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-grey-900">マニュアル・ガイド</h4>
              <p className="text-grey-600 text-sm mt-1">
                SMSOneの詳細な使用方法や機能説明
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-grey-400" />
          </a>
        </div>
      </div>
    </>
  );
};

export default HelpSupportContent; 