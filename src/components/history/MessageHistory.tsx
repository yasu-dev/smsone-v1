import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Download, RefreshCw,
  MoreHorizontal, Check, X, Info, ClipboardList, Globe
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import useSMSStore from '../../store/smsStore';
import { SMSMessage } from '../../types';
import { ExportControls } from '../common/ExportControls';

const MessageHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SMSMessage | null>(null);
  const [showInternationalOnly, setShowInternationalOnly] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { messages, fetchMessages, isLoading } = useSMSStore();
  
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };
  
  // Filter messages based on search term and filters
  const filteredMessages = messages.filter((message) => {
    // Search term filter
    const matchesSearch = 
      message.recipient.includes(searchTerm) ||
      message.content.includes(searchTerm) ||
      (message.memo && message.memo.includes(searchTerm));
    
    // Status filter
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(message.status);
    
    // International filter
    const matchesInternational = !showInternationalOnly || message.isInternational;
    
    // Date range filter
    let matchesDateRange = true;
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const createdDate = new Date(message.createdAt);
      if (createdDate < fromDate) {
        matchesDateRange = false;
      }
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      const createdDate = new Date(message.createdAt);
      if (createdDate > toDate) {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesInternational;
  });
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMessages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  
  const toggleStatusFilter = (status: string) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter(s => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };
  
  const resetFilters = () => {
    setSelectedStatus([]);
    setDateFrom('');
    setDateTo('');
    setShowInternationalOnly(false);
  };
  
  const handleViewDetails = (message: SMSMessage) => {
    setSelectedMessage(message);
  };
  
  const closeDetails = () => {
    setSelectedMessage(null);
  };
  
  const exportToCsv = () => {
    // Generate CSV from filtered messages
    const headers = ['ID', '宛先', '送信元', '内容', 'ステータス', '作成日時', '送信日時', '配信日時', 'メモ', '国際送信'];
    
    const csvRows = [
      headers.join(','),
      ...filteredMessages.map(message => {
        return [
          message.id,
          message.recipient,
          message.sender,
          `"${message.content.replace(/"/g, '""')}"`, // Escape quotes
          message.status,
          message.createdAt,
          message.sentAt || '',
          message.deliveredAt || '',
          message.memo ? `"${message.memo.replace(/"/g, '""')}"` : '',
          message.isInternational ? '1' : '0'
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sms_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-grey-900">送信履歴一覧</h2>
            <p className="mt-1 text-sm text-grey-500">
              過去に送信したSMSの履歴と配信状況を確認できます。
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
              className="form-input pl-10 w-full"
              placeholder="宛先、内容、メモなどで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              フィルター
            </button>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={exportToCsv}
            >
              <Download className="h-4 w-4" />
              エクスポート
            </button>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-4 p-4 border border-grey-200 rounded-md bg-grey-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-grey-900">詳細検索</h3>
              <button
                type="button"
                className="text-grey-400 hover:text-grey-500"
                onClick={resetFilters}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">ステータス</label>
                <div className="mt-1 space-y-2">
                  {['sent', 'delivered', 'failed', 'pending', 'processing'].map((status) => (
                    <div key={status} className="flex items-center">
                      <input
                        id={`status-${status}`}
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedStatus.includes(status)}
                        onChange={() => toggleStatusFilter(status)}
                      />
                      <label htmlFor={`status-${status}`} className="ml-2 text-sm text-grey-700">
                        <div className="flex items-center">
                          <StatusBadge status={status as any} className="mr-1" />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center">
                    <input
                      id="international-only"
                      type="checkbox"
                      className="form-checkbox"
                      checked={showInternationalOnly}
                      onChange={() => setShowInternationalOnly(!showInternationalOnly)}
                    />
                    <label htmlFor="international-only" className="ml-2 text-sm text-grey-700 flex items-center">
                      <Globe className="h-4 w-4 text-primary-500 mr-1" />
                      国際送信のみ表示
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="date-from" className="form-label">期間（開始）</label>
                <input
                  type="date"
                  id="date-from"
                  className="form-input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="date-to" className="form-label">期間（終了）</label>
                <input
                  type="date"
                  id="date-to"
                  className="form-input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-grey-300 border-t-primary-600"></div>
            <p className="mt-2 text-grey-500">データを読み込み中...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-md">
            <ClipboardList className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-grey-900">データがありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm || selectedStatus.length > 0 || dateFrom || dateTo || showInternationalOnly
                ? '検索条件に一致するデータが見つかりませんでした。'
                : 'SMS送信履歴はまだありません。'}
            </p>
            {(searchTerm || selectedStatus.length > 0 || dateFrom || dateTo || showInternationalOnly) && (
              <button
                type="button"
                className="mt-4 bg-white border border-grey-200 text-grey-700 px-4 py-2 rounded-md hover:bg-grey-50"
                onClick={() => {
                  setSearchTerm('');
                  resetFilters();
                }}
              >
                検索条件をクリア
              </button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-grey-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      宛先
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider hidden md:table-cell">
                      内容
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      送信日時
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">アクション</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-200">
                  {currentItems.map((message) => (
                    <tr 
                      key={message.id}
                      className="hover:bg-grey-50 cursor-pointer"
                      onClick={() => handleViewDetails(message)}
                    >
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center">
                          {message.isInternational && (
                            <span className="mr-2 flex-shrink-0">
                              <Globe className="h-4 w-4 text-primary-500" />
                            </span>
                          )}
                          <span className="text-sm text-grey-900">{message.recipient}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal hidden md:table-cell">
                        <div className="text-sm text-grey-500">{message.content}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-grey-500">
                        {message.sentAt 
                          ? new Date(message.sentAt).toLocaleString('ja-JP')
                          : new Date(message.createdAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <StatusBadge status={message.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-right text-sm font-medium">
                        {/* 省略メニューアイコンを非表示にする */}
                        {/* <button className="text-grey-400 hover:text-grey-600">
                          <MoreHorizontal className="h-5 w-5" />
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-grey-700">
              {filteredMessages.length} 件中 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMessages.length)} 件を表示
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-grey-300 bg-white text-grey-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-grey-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-grey-300 bg-white text-grey-500 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Message details modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-grey-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-grey-900">メッセージ詳細</h2>
              <button
                type="button"
                className="bg-white border border-grey-200 text-grey-700 px-4 py-2 rounded-md hover:bg-grey-50"
                onClick={closeDetails}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <StatusBadge status={selectedMessage.status} className="text-sm px-3 py-1" />
                  {selectedMessage.isInternational && (
                    <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800">
                      <Globe className="h-3 w-3 mr-1" />
                      国際送信
                    </span>
                  )}
                </div>
                <span className="text-sm text-grey-500">
                  ID: {selectedMessage.id}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-grey-500">宛先</div>
                  <div className="mt-1 text-sm text-grey-900">{selectedMessage.recipient}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-grey-500">送信元</div>
                  <div className="mt-1 text-sm text-grey-900">{selectedMessage.sender}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-grey-500">本文</div>
                  <div className="mt-1 p-3 bg-grey-50 rounded-md text-sm text-grey-900 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-grey-500">作成日時</div>
                    <div className="mt-1 text-sm text-grey-900">
                      {new Date(selectedMessage.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-grey-500">送信日時</div>
                    <div className="mt-1 text-sm text-grey-900">
                      {selectedMessage.sentAt
                        ? new Date(selectedMessage.sentAt).toLocaleString('ja-JP')
                        : '-'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-grey-500">配信完了日時</div>
                    <div className="mt-1 text-sm text-grey-900">
                      {selectedMessage.deliveredAt
                        ? new Date(selectedMessage.deliveredAt).toLocaleString('ja-JP')
                        : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-grey-500">テンプレートID</div>
                    <div className="mt-1 text-sm text-grey-900">
                      {selectedMessage.templateId || '-'}
                    </div>
                  </div>
                </div>
                
                {selectedMessage.isInternational && selectedMessage.countryCode && (
                  <div>
                    <div className="text-sm font-medium text-grey-500">送信先国</div>
                    <div className="mt-1 text-sm text-grey-900">
                      {selectedMessage.countryCode}
                    </div>
                  </div>
                )}
                
                {selectedMessage.memo && (
                  <div>
                    <div className="text-sm font-medium text-grey-500">メモ</div>
                    <div className="mt-1 text-sm text-grey-900">{selectedMessage.memo}</div>
                  </div>
                )}
                
                <div className="mt-4 p-3 border border-grey-200 rounded-md bg-grey-50 flex items-start">
                  <Info className="h-5 w-5 text-grey-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-grey-600">
                    <p>配信ステータスが変更されないときは、更新ボタンをクリックして最新の状態を取得してください。</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 border-t border-grey-200 flex justify-end">
              <button
                type="button"
                className="bg-white border border-grey-200 text-grey-700 px-4 py-2 rounded-md hover:bg-grey-50 mr-3"
                onClick={closeDetails}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageHistory;