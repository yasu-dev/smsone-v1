import React, { useState, useEffect } from 'react';
import { 
  Calendar, BarChart3, ArrowUpRight, Search, Download,
  BarChart2, Clock, ExternalLink, Calendar as CalendarIcon, LayoutGrid, List,
  Smartphone, Tablet, Monitor, MapPin, Users, TrendingUp, AlertCircle, Share2, Copy, X
} from 'lucide-react';
import useSMSStore from '../../store/smsStore';
import { SMSMessage } from '../../types';
import { ExportControls } from '../common/ExportControls';
import UrlDetailAnalytics from './UrlDetailAnalytics';
import { useParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface UrlClickData {
  url: string;
  clicks: number;
  lastClickedAt: string;
  originalUrl: string;
  messageId: string;
}

interface UrlDetailData {
  url: string;
  originalUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  firstClick: string;
  lastClick: string;
  clickThroughRate: number;
  hourlyClicks: Array<{ hour: number; clicks: number }>;
  dailyClicks: Array<{ date: string; clicks: number; day: string }>;
  deviceClicks: Array<{ device: string; count: number }>;
  regionClicks: Array<{ region: string; count: number }>;
}

interface UrlAnalyticsProps {
  selectedUrl?: string | null;
}

const UrlAnalytics: React.FC<UrlAnalyticsProps> = ({ selectedUrl }) => {
  const { url } = useParams<{ url: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const { messages } = useSMSStore();
  
  const urlsWithClicks: UrlClickData[] = React.useMemo(() => {
    // より現実的なデモデータを生成
    const mockUrls: UrlClickData[] = [];
    
    // 人気の高いURLパターン
    const popularDomains = [
      'example.com/products',
      'example.com/campaign',
      'example.com/events',
      'example.com/limited',
      'example.com/special',
      'example.shop/items',
      'example.store/discount'
    ];
    
    // 現実的なクリック数分布を生成
    const generateClicks = (popular: boolean) => {
      if (popular) {
        // 人気の高いURL（20%の確率）
        return Math.floor(Math.random() * 80) + 40;
      } else {
        // 通常のURL
        return Math.floor(Math.random() * 30) + 5;
      }
    };
    
    // URLのクリック時間分布を現実的に生成
    const generateClickTime = () => {
      const now = new Date();
      // 過去7日間のランダムな時間を生成、最近の方がクリック確率が高くなるよう調整
      const hoursAgo = Math.floor(Math.pow(Math.random(), 2) * 168); // 7日 = 168時間
      now.setHours(now.getHours() - hoursAgo);
      return now.toISOString();
    };
    
    messages.forEach(message => {
      // URLが含まれているメッセージを対象とする
      if (message.shortenedUrl) {
        const isPopular = Math.random() < 0.2;
        const domainIndex = Math.floor(Math.random() * popularDomains.length);
        const productId = Math.floor(1000 + Math.random() * 9000);
        
        const originalUrl = message.originalUrl || 
                          `https://${popularDomains[domainIndex]}/${productId}?ref=sms&campaign=summer_sale`;
        
        mockUrls.push({
          url: message.shortenedUrl,
          clicks: generateClicks(isPopular),
          lastClickedAt: generateClickTime(),
          originalUrl: originalUrl,
          messageId: message.id
        });
      }
      
      if (message.shortenedUrl2) {
        const isPopular = Math.random() < 0.15;
        const domainIndex = Math.floor(Math.random() * popularDomains.length);
        const productId = Math.floor(1000 + Math.random() * 9000);
        
        const originalUrl = message.originalUrl2 || 
                          `https://${popularDomains[domainIndex]}/${productId}?ref=sms&campaign=new_arrival`;
        
        mockUrls.push({
          url: message.shortenedUrl2,
          clicks: generateClicks(isPopular),
          lastClickedAt: generateClickTime(),
          originalUrl: originalUrl,
          messageId: message.id
        });
      }
    });
    
    // クリック数の多い順にソート
    return mockUrls.sort((a, b) => b.clicks - a.clicks);
  }, [messages]);
  
  // 検索とフィルタリング
  const filteredUrls = urlsWithClicks.filter(item => {
    const matchesSearch = 
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.originalUrl && item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 日付範囲のフィルタリングはここに実装します
    
    return matchesSearch;
  });
  
  const selectedUrlData = selectedUrlId 
    ? urlsWithClicks.find(item => item.url === selectedUrlId) 
    : null;
  
  // URL詳細データを生成（より詳細なデモデータ）
  const urlDetailData = React.useMemo(() => {
    if (!selectedUrlData) return null;
    
    // より現実的な時間帯別クリック数分布
    const hourlyClicks = Array.from({ length: 24 }, (_, i) => {
      let clicks;
      if (i >= 9 && i <= 13) {
        // 午前のピーク時間帯
        clicks = Math.floor(Math.random() * 6) + 2;
      } else if (i >= 18 && i <= 22) {
        // 夕方から夜のピーク時間帯
        clicks = Math.floor(Math.random() * 8) + 3;
      } else if (i >= 0 && i <= 6) {
        // 深夜から早朝
        clicks = Math.floor(Math.random() * 2);
      } else {
        // その他の時間帯
        clicks = Math.floor(Math.random() * 4) + 1;
      }
      
      return {
        hour: i,
        clicks
      };
    });
    
    // 曜日別のクリック傾向を反映した日別データ
    const now = new Date();
    const dailyClicks = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - (13 - i));
      const dayOfWeek = date.getDay(); // 0: 日曜, 6: 土曜
      
      let clickFactor;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // 週末
        clickFactor = 0.7 + Math.random() * 0.6;
      } else if (dayOfWeek === 1 || dayOfWeek === 5) {
        // 月曜と金曜
        clickFactor = 1.0 + Math.random() * 0.8;
      } else {
        // 火・水・木
        clickFactor = 0.8 + Math.random() * 0.7;
      }
      
      // 直近の日付ほどクリック数が多い傾向を加味
      const recencyFactor = 0.6 + (i / 14) * 0.8;
      
      return {
        date: date.toISOString().split('T')[0],
        clicks: Math.floor(selectedUrlData.clicks / 14 * clickFactor * recencyFactor),
        day: ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]
      };
    });
    
    // デバイス別クリック比率
    const deviceClicks = [
      { device: 'スマートフォン', count: Math.floor(selectedUrlData.clicks * (0.65 + Math.random() * 0.15)) },
      { device: 'タブレット', count: Math.floor(selectedUrlData.clicks * (0.1 + Math.random() * 0.1)) },
      { device: 'PC', count: Math.floor(selectedUrlData.clicks * (0.1 + Math.random() * 0.1)) }
    ];
    
    // 残りをその他に設定
    const otherCount = selectedUrlData.clicks - deviceClicks.reduce((sum, item) => sum + item.count, 0);
    deviceClicks.push({ device: 'その他', count: Math.max(0, otherCount) });
    
    // 地域別クリック分布
    const regionClicks = [
      { region: '東京', count: Math.floor(selectedUrlData.clicks * (0.25 + Math.random() * 0.1)) },
      { region: '大阪', count: Math.floor(selectedUrlData.clicks * (0.15 + Math.random() * 0.1)) },
      { region: '名古屋', count: Math.floor(selectedUrlData.clicks * (0.1 + Math.random() * 0.05)) },
      { region: '福岡', count: Math.floor(selectedUrlData.clicks * (0.08 + Math.random() * 0.05)) },
      { region: '札幌', count: Math.floor(selectedUrlData.clicks * (0.06 + Math.random() * 0.04)) },
      { region: 'その他', count: 0 }
    ];
    
    // その他の地域を計算
    regionClicks[5].count = selectedUrlData.clicks - regionClicks.slice(0, 5).reduce((sum, item) => sum + item.count, 0);
    
    return {
      url: selectedUrlData.url,
      originalUrl: selectedUrlData.originalUrl || '',
      totalClicks: selectedUrlData.clicks,
      hourlyClicks,
      dailyClicks,
      deviceClicks,
      regionClicks,
      uniqueClicks: Math.floor(selectedUrlData.clicks * (0.7 + Math.random() * 0.2)), // ユニーククリック数
      firstClick: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString(),
      lastClick: selectedUrlData.lastClickedAt || new Date().toISOString(),
      clickThroughRate: Math.floor(40 + Math.random() * 40) // 40%〜80%のCTR
    };
  }, [selectedUrlData]);
  
  const exportUrlData = () => {
    // CSV出力処理
    const headers = ['短縮URL', '元URL', 'クリック数', '最終クリック日時'];
    
    const csvRows = [
      headers.join(','),
      ...filteredUrls.map(item => {
        return [
          item.url,
          item.originalUrl || '-',
          item.clicks,
          item.lastClickedAt ? new Date(item.lastClickedAt).toLocaleString('ja-JP') : '-'
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `url_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDateRange('custom');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // トースト通知などを表示する場合はここに追加
  };

  const handleShareUrl = (url: string) => {
    // 共有機能の実装
    if (navigator.share) {
      navigator.share({
        title: 'SMS URL',
        text: 'このURLを共有します',
        url: url,
      });
    } else {
      // 共有APIが利用できない場合のフォールバック
      navigator.clipboard.writeText(url);
      // トースト通知などを表示
    }
  };

  const handleUrlSelect = (item: UrlClickData) => {
    setSelectedUrlId(item.url);
    setShowDetail(true);
  };

  useEffect(() => {
    if (url) {
      const decodedUrl = decodeURIComponent(url);
      setSelectedUrlId(decodedUrl);
      setShowDetail(true);
    } else if (selectedUrl) {
      setSelectedUrlId(selectedUrl);
      setShowDetail(true);
    }
  }, [url, selectedUrl]);

  const UrlDetails = ({ urlData, onClose }: { urlData: UrlDetailData | null, onClose: () => void }) => {
    if (!urlData) return null;

    return (
      <Transition appear show={true} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <BarChart2 className="h-6 w-6 text-primary-500" />
                        <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                          URL分析詳細
                        </Dialog.Title>
                      </div>
                      <div className="flex items-center space-x-4">
                        <a 
                          href={urlData.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {urlData.url}
                        </a>
                        <span className="text-gray-500 text-sm truncate max-w-md">
                          {urlData.originalUrl}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={onClose}
                        className="text-grey-500 hover:text-grey-700"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* 主要指標 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="text-sm text-grey-500">総クリック数</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold">{urlData.totalClicks}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="text-sm text-grey-500">ユニーククリック数</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold">{urlData.uniqueClicks}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="text-sm text-grey-500">クリック率</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold">{urlData.clickThroughRate}%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="text-sm text-grey-500">最終クリック</span>
                      </div>
                      <div className="mt-2 text-sm">
                        {format(new Date(urlData.lastClick), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </div>
                    </div>
                  </div>

                  {/* グラフセクション */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 時間帯別クリック数 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">時間帯別クリック数</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={urlData.hourlyClicks}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="clicks" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* デバイス別クリック数 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">デバイス別クリック数</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={urlData.deviceClicks}
                              dataKey="count"
                              nameKey="device"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {urlData.deviceClicks.map((entry: { device: string; count: number }, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 地域別クリック数 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">地域別クリック数</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={urlData.regionClicks}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="region" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 日別クリック数 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">日別クリック数</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={urlData.dailyClicks}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="clicks" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
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
            <h2 className="text-lg font-medium text-grey-900">URL分析</h2>
            <p className="mt-1 text-sm text-grey-500">
              送信したSMS内の短縮URLのクリック状況を分析できます
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
              placeholder="URLを検索..."
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
        
        {filteredUrls.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-md">
            <BarChart3 className="h-12 w-12 text-grey-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-grey-900">データがありません</h3>
            <p className="mt-1 text-sm text-grey-500">
              {searchTerm ? '検索条件に一致するURLが見つかりませんでした。' : 'クリックデータがありません。'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUrls.map((item) => (
              <div
                key={item.url}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-grey-50 ${
                  selectedUrlId === item.url ? 'bg-primary-50' : ''
                }`}
                onClick={() => handleUrlSelect(item)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <BarChart2 className="h-4 w-4 text-primary-500 mr-2" />
                      <span className="text-sm font-medium text-grey-900">{item.clicks}</span>
                    </div>
                    <button 
                      className="text-primary-600 hover:text-primary-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-grey-900 font-medium mb-1">{item.url}</div>
                    <div className="text-xs text-grey-500 truncate">{item.originalUrl}</div>
                  </div>
                  <div className="mt-2 text-xs text-grey-500">
                    {item.lastClickedAt ? (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 text-grey-400 mr-1" />
                        <span>{new Date(item.lastClickedAt).toLocaleString('ja-JP')}</span>
                      </div>
                    ) : (
                      '-'
                    )}
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
                    短縮URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    クリック数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                    最終クリック
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">詳細</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-grey-200">
                {filteredUrls.map((item) => (
                  <tr 
                    key={item.url}
                    className="hover:bg-grey-50 cursor-pointer"
                    onClick={() => handleUrlSelect(item)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-grey-900 font-medium">{item.url}</span>
                        <span className="text-xs text-grey-500 mt-1 truncate max-w-xs">{item.originalUrl}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BarChart2 className="h-4 w-4 text-primary-500 mr-2" />
                        <span className="text-sm text-grey-900">{item.clicks}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                      {item.lastClickedAt ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-grey-400 mr-2" />
                          <span>{new Date(item.lastClickedAt).toLocaleString('ja-JP')}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showDetail && urlDetailData && (
        <UrlDetails 
          urlData={urlDetailData} 
          onClose={() => {
            setShowDetail(false);
            setSelectedUrlId(null);
          }} 
        />
      )}
    </div>
  );
};

export default UrlAnalytics; 