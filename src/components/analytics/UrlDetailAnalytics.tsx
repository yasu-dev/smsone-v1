import React from 'react';
import { 
  BarChart2, Clock, ExternalLink, Smartphone, Tablet, Monitor, 
  MapPin, Calendar, Users, TrendingUp, AlertCircle, Share2, Copy, X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Dialog } from '@headlessui/react';

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

interface UrlDetailAnalyticsProps {
  data: UrlDetailData;
  onCopyUrl: (url: string) => void;
  onShareUrl: (url: string) => void;
  onClose: () => void;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  device: {
    smartphone: '#7B61FF',
    tablet: '#00BFA5',
    pc: '#FF9800',
    other: '#9CA3AF'
  },
  region: {
    tokyo: '#4285F4',
    osaka: '#FF4081',
    nagoya: '#00BFA5',
    fukuoka: '#FF9800',
    sapporo: '#7B61FF',
    other: '#9CA3AF'
  }
};

const UrlDetailAnalytics: React.FC<UrlDetailAnalyticsProps> = ({ data, onCopyUrl, onShareUrl, onClose }) => {
  const deviceColors = [COLORS.device.smartphone, COLORS.device.tablet, COLORS.device.pc, COLORS.device.other];
  const regionColors = [COLORS.region.tokyo, COLORS.region.osaka, COLORS.region.nagoya, 
                       COLORS.region.fukuoka, COLORS.region.sapporo, COLORS.region.other];

  return (
    <div className="mt-6 bg-white rounded-lg shadow">
      <div className="p-6">
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
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {data.url}
              </a>
              <span className="text-gray-500 text-sm truncate max-w-md">
                {data.originalUrl}
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
        {/* ヘッダーセクション */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">URL詳細分析</h2>
            <div className="mt-2 flex items-center space-x-4">
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {data.url}
              </a>
              <span className="text-gray-500 text-sm truncate max-w-md">
                {data.originalUrl}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onCopyUrl(data.url)}
              className="btn-secondary flex items-center"
            >
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </button>
            <button
              onClick={() => onShareUrl(data.url)}
              className="btn-primary flex items-center"
            >
              <Share2 className="h-4 w-4 mr-1" />
              共有
            </button>
          </div>
        </div>

        {/* 主要指標 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 text-primary-500 mr-2" />
              <span className="text-sm font-medium text-gray-500">総クリック数</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{data.totalClicks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-success-500 mr-2" />
              <span className="text-sm font-medium text-gray-500">ユニーククリック数</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{data.uniqueClicks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-warning-500 mr-2" />
              <span className="text-sm font-medium text-gray-500">クリック率</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{data.clickThroughRate}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-500">最終クリック</span>
            </div>
            <div className="mt-2 text-lg font-bold text-gray-900">
              {format(new Date(data.lastClick), 'yyyy/MM/dd HH:mm', { locale: ja })}
            </div>
          </div>
        </div>

        {/* グラフセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 時間帯別クリック数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">時間帯別クリック数</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyClicks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* デバイス別クリック数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">デバイス別クリック数</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.deviceClicks}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.deviceClicks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={deviceColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 地域別クリック数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">地域別クリック数</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.regionClicks}
                    dataKey="count"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.regionClicks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={regionColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 日別クリック数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">日別クリック数</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyClicks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* インサイトとアクション */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">インサイトとアクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">ピーク時間帯</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    最もクリックが多い時間帯は {data.hourlyClicks.reduce((max, curr) => 
                      curr.clicks > max.clicks ? curr : max
                    ).hour}時です。この時間帯に配信すると効果的です。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Smartphone className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">デバイス最適化</h4>
                  <p className="text-sm text-green-700 mt-1">
                    スマートフォンからのアクセスが{Math.round(data.deviceClicks[0].count / data.totalClicks * 100)}%を占めています。
                    モバイルファーストのコンテンツを提供しましょう。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">地域ターゲティング</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    東京からのアクセスが最も多いです。地域に特化したコンテンツの提供を検討しましょう。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">改善ポイント</h4>
                  <p className="text-sm text-red-700 mt-1">
                    クリック率が{data.clickThroughRate}%です。より魅力的なCTAやコンテンツの改善を検討しましょう。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlDetailAnalytics; 