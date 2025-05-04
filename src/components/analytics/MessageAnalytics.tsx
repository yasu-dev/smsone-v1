import React, { useState, useEffect } from 'react';
import { PieChart, BarChart2, Search, Download, Calendar, FileType, CreditCard, DollarSign, SendHorizonal, Filter, Clock, ArrowUpRight } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart as RechartPieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ExportControls } from '../common/ExportControls';

type DateRangeType = 'today' | '7days' | '14days' | '30days' | '90days' | 'custom';

type SMSStatus = 
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'pending'
  | 'processing'
  | 'queued'
  | 'canceled'
  | 'expired'
  | 'rejected'
  | 'unknown';

type StatusCount = {
  status: SMSStatus;
  count: number;
};

type CarrierCount = {
  carrier: string;
  count: number;
};

// デモデータ
const demoSummaryData = {
  '7days': {
    total: 2100,
    avg: 300,
    trend: '増加傾向',
    trendRate: '+8.2%',
    label: '7日間の合計',
    avgLabel: '日別の平均送信数',
    chart: [300, 320, 310, 290, 305, 320, 255],
    chartLabels: ['4/24', '4/25', '4/26', '4/27', '4/28', '4/29', '4/30'],
  },
  '14days': {
    total: 5471,
    avg: 391,
    trend: '減少傾向',
    trendRate: '+12.5%',
    label: '14日間の合計',
    avgLabel: '日別の平均送信数',
    chart: [500, 600, 400, 300, 350, 400, 450, 500, 600, 400, 300, 350, 400, 450],
    chartLabels: ['4/17','4/18','4/19','4/20','4/21','4/22','4/23','4/24','4/25','4/26','4/27','4/28','4/29','4/30'],
  },
  '30days': {
    total: 12000,
    avg: 400,
    trend: '横ばい',
    trendRate: '+0.0%',
    label: '30日間の合計',
    avgLabel: '日別の平均送信数',
    chart: Array(30).fill(0).map((_,i)=>350+Math.round(Math.sin(i/3)*50)),
    chartLabels: Array(30).fill(0).map((_,i)=>`4/${i+1}`),
  },
  '90days': {
    total: 35000,
    avg: 389,
    trend: '増加傾向',
    trendRate: '+18.7%',
    label: '90日間の合計',
    avgLabel: '日別の平均送信数',
    chart: Array(90).fill(0).map((_,i)=>300+Math.round(Math.cos(i/7)*60)),
    chartLabels: Array(90).fill(0).map((_,i)=>`2/${i+1}`),
  },
};

// 日別送信料金のデータを生成
const generateDailyPriceData = (startDate: Date, endDate: Date) => {
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const data = [];

  // 乱数シード値として日付を固定
  const seed = new Date('2023-10-01').getTime();
  
  // 一貫した乱数生成のための関数
  const pseudoRandom = (n: number) => {
    return ((Math.sin(n * seed) + 1) / 2);
  };

  // 基準となる1日あたりの送信数（平日）
  const baseWeekdayCount = 500;
  // 曜日ごとの係数
  const dayFactors: { [key: number]: number } = {
    0: 0.3,  // 日曜日
    1: 1.2,  // 月曜日
    2: 1.0,  // 火曜日
    3: 1.1,  // 水曜日
    4: 1.0,  // 木曜日
    5: 1.3,  // 金曜日
    6: 0.4   // 土曜日
  };

  // 時期による変動係数（月初・月末は多い）
  const getDateFactor = (date: Date) => {
    const dayOfMonth = date.getDate();
    if (dayOfMonth <= 5) return 1.4;  // 月初
    if (dayOfMonth >= 25) return 1.3;  // 月末
    return 1.0;
  };

  // 祝日・イベント日の影響
  const isSpecialDay = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 主要な祝日やイベント日
    const specialDays: { [key: string]: number } = {
      '1-1': 0.1,   // 元日
      '12-31': 0.2, // 大晦日
      '12-25': 1.5, // クリスマス
      '2-14': 1.4,  // バレンタイン
      '4-1': 1.3,   // 年度始め
      '3-31': 1.4,  // 年度末
    };

    const dateKey = `${month}-${day}`;
    return specialDays[dateKey] || 1.0;
  };

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayOfWeek = date.getDay();
    const dayIndex = i + 1;
    
    // 基本送信数の計算
    const baseDayCount = baseWeekdayCount * 
      dayFactors[dayOfWeek] * 
      getDateFactor(date) * 
      isSpecialDay(date) *
      (0.9 + pseudoRandom(dayIndex) * 0.2); // ±10%のランダム変動

    // 国内・国際送信の比率計算
    // 平日の日中は国際送信が多い
    let domesticRatio = 0.9; // 基本は90%が国内
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const businessHoursFactor = 0.85; // ビジネスアワーは国内比率が下がる
      domesticRatio = businessHoursFactor + (pseudoRandom(dayIndex) * 0.1);
    } else {
      domesticRatio = 0.95 + (pseudoRandom(dayIndex) * 0.03); // 休日は国内比率が高い
    }

    // 送信数の計算
    const count = Math.round(baseDayCount);
    const domesticCount = Math.round(count * domesticRatio);
    const internationalCount = count - domesticCount;

    // 料金計算（より現実的な料金設定）
    const perDomesticPrice = 3.7;  // 国内送信単価
    const perIntlPrices = {
      asia: 15.0,      // アジア圏
      america: 35.0,   // 米国圏
      europe: 45.0,    // 欧州圏
      others: 60.0     // その他
    };

    // 国際送信の地域分布
    const intlDistribution = {
      asia: 0.5,     // 50% アジア
      america: 0.3,  // 30% 米国圏
      europe: 0.15,  // 15% 欧州圏
      others: 0.05   // 5% その他
    };

    // 国際送信料金の計算
    const internationalPrice = Math.round(
      internationalCount * (
        perIntlPrices.asia * intlDistribution.asia +
        perIntlPrices.america * intlDistribution.america +
        perIntlPrices.europe * intlDistribution.europe +
        perIntlPrices.others * intlDistribution.others
      ) * 10
    ) / 10;

    // 国内送信料金の計算
    const domesticPrice = Math.round(domesticCount * perDomesticPrice * 10) / 10;

    data.push({
      date: date.toISOString().split('T')[0],
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
      domesticCount,
      internationalCount,
      domesticPrice,
      internationalPrice,
      totalPrice: domesticPrice + internationalPrice
    });
  }
  
  return data;
};

// 時間別データを生成
const generateHourlyData = (date: Date) => {
  // 乱数シード値として固定
  const seed = new Date('2023-10-01').getTime();
  
  // 一貫した乱数生成のための関数
  const pseudoRandom = (n: number) => {
    return ((Math.sin(n * seed) + 1) / 2);
  };

  // 時間帯別の基準送信数
  const hourlyBaseCount = {
    night: 5,      // 深夜（0-5時）
    morning: 30,   // 朝（6-9時）
    peak: 100,     // ピーク（10-17時）
    evening: 50,   // 夕方（18-20時）
    night2: 20     // 夜（21-23時）
  };

  return Array.from({ length: 24 }, (_, hour) => {
    let baseCount;
    let variationRange;

    // 時間帯に応じた基準値と変動幅を設定
    if (hour >= 0 && hour < 6) {
      baseCount = hourlyBaseCount.night;
      variationRange = 0.3;  // 深夜は変動小
    } else if (hour >= 6 && hour < 9) {
      baseCount = hourlyBaseCount.morning;
      variationRange = 0.4;  // 朝は中程度の変動
    } else if (hour >= 10 && hour < 17) {
      baseCount = hourlyBaseCount.peak;
      variationRange = 0.5;  // ピーク時は大きな変動
    } else if (hour >= 18 && hour < 21) {
      baseCount = hourlyBaseCount.evening;
      variationRange = 0.4;  // 夕方は中程度の変動
    } else {
      baseCount = hourlyBaseCount.night2;
      variationRange = 0.3;  // 夜は小さな変動
    }

    // 時間帯による国内・国際比率の調整
    let domesticRatio;
    if (hour >= 9 && hour < 18) {
      // 営業時間内は国際送信が増加
      domesticRatio = 0.8 + (pseudoRandom(hour) * 0.1);
    } else {
      // 営業時間外は国内送信が主
      domesticRatio = 0.95 + (pseudoRandom(hour) * 0.03);
    }

    // 最終的な送信数の計算
    const variation = 1 + (pseudoRandom(hour) * variationRange * 2 - variationRange);
    const count = Math.round(baseCount * variation);
    const domesticCount = Math.round(count * domesticRatio);
    const internationalCount = count - domesticCount;

    // 料金計算
    const perDomesticPrice = 3.7;
    const avgIntlPrice = 35.0;  // 平均国際送信単価

    const domesticPrice = Math.round(domesticCount * perDomesticPrice * 10) / 10;
    const internationalPrice = Math.round(internationalCount * avgIntlPrice * 10) / 10;

    return {
      hour,
      label: `${hour}時`,
      count,
      domesticCount,
      internationalCount,
      domesticPrice,
      internationalPrice,
      totalPrice: domesticPrice + internationalPrice
    };
  });
};

const statusColors: Record<SMSStatus, string> = {
  sent: '#3B82F6', // primary
  delivered: '#10B981', // success
  failed: '#EF4444', // error
  pending: '#F59E0B', // warning
  processing: '#6366F1', // indigo
  queued: '#8B5CF6', // purple
  canceled: '#6B7280', // grey
  expired: '#9CA3AF', // grey-400
  rejected: '#EF4444', // error
  unknown: '#D1D5DB', // grey-300
};

const carrierColors: { [key: string]: string } = {
  docomo: '#7B61FF',    // 紫
  au: '#00BFA5',        // ターコイズ
  softbank: '#FF9800',  // オレンジ
  rakuten: '#FF4444'    // 赤
};

const domesticColor = '#4285F4';  // 青
const internationalColor = '#FF4081';  // ピンク

export const MessageAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<DateRangeType>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPriceAll, setTotalPriceAll] = useState(0);
  const [domesticCount, setDomesticCount] = useState(0);
  const [internationalCount, setInternationalCount] = useState(0);
  const [domesticPrice, setDomesticPrice] = useState(0);
  const [internationalPrice, setInternationalPrice] = useState(0);
  const [deliveryRatioData, setDeliveryRatioData] = useState<any[]>([]);
  const [carrierData, setCarrierData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyPriceData, setDailyPriceData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // キャリア別の送信数データを生成
  const generateCarrierData = (totalCount: number) => {
    // シード値を固定して一貫した値を生成
    const seed = new Date('2023-10-01').getTime();
    const pseudoRandom = (n: number) => ((Math.sin(n * seed) + 1) / 2);
    
    // 現実的なキャリアシェアを反映
    const carriers = [
      { name: 'docomo', baseShare: 0.42, variation: 0.02 },
      { name: 'au', baseShare: 0.29, variation: 0.02 },
      { name: 'softbank', baseShare: 0.24, variation: 0.02 },
      { name: 'rakuten', baseShare: 0.05, variation: 0.01 }
    ];

    // シェアの計算（変動を加味）
    let remainingShare = 1.0;
    const result = carriers.map((carrier, index) => {
      if (index === carriers.length - 1) {
        // 最後のキャリアは残りのシェアを割り当て
        return {
          name: carrier.name,
          value: Math.round(totalCount * remainingShare),
          ratio: remainingShare * 100
        };
      }

      const variation = (pseudoRandom(index) * 2 - 1) * carrier.variation;
      const share = Math.max(0, Math.min(remainingShare, carrier.baseShare + variation));
      remainingShare -= share;

      return {
        name: carrier.name,
        value: Math.round(totalCount * share),
        ratio: share * 100
      };
    });

    return result;
  };

  useEffect(() => {
    const generateDemoData = () => {
      // 選択された期間に基づいてデータを生成
      const end = new Date();
      const start = new Date();

      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        // カスタム期間の場合
        start.setTime(new Date(customStartDate).getTime());
        end.setTime(new Date(customEndDate).getTime());
      } else {
        // プリセット期間の場合
        const days = selectedPeriod === '7days' ? 7 
                  : selectedPeriod === '14days' ? 14
                  : selectedPeriod === '30days' ? 30
                  : 90;
        start.setDate(end.getDate() - days);
      }

      // 日別データの生成
      const dailyData = generateDailyPriceData(start, end);
      setDailyPriceData(dailyData);

      // 合計値の計算
      const totalMessages = dailyData.reduce((sum, day) => sum + day.count, 0);
      setTotalCount(totalMessages);

      // 国内/国際送信数の設定
      const domestic = dailyData.reduce((sum, day) => sum + day.domesticCount, 0);
      const international = dailyData.reduce((sum, day) => sum + day.internationalCount, 0);
      setDomesticCount(domestic);
      setInternationalCount(international);

      // 料金の設定
      const domesticTotal = dailyData.reduce((sum, day) => sum + day.domesticPrice, 0);
      const internationalTotal = dailyData.reduce((sum, day) => sum + day.internationalPrice, 0);
      setDomesticPrice(domesticTotal);
      setInternationalPrice(internationalTotal);
      setTotalPriceAll(domesticTotal + internationalTotal);

      // キャリアデータの生成
      const carriers = generateCarrierData(totalMessages);
      setCarrierData(carriers);

      // 時間別データの生成
      const hourly = generateHourlyData(new Date());
      setHourlyData(hourly);

      // 送信数内訳データの設定
      const sendingStats = [
        { name: '国内送信', value: domestic, price: domesticTotal },
        { name: '国際送信', value: international, price: internationalTotal }
      ];
      setDeliveryRatioData(sendingStats);
    };

    generateDemoData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        ['項目', '値'],
        ['総送信数', totalCount],
        ['総送信料金', totalPriceAll],
        ['国内送信数', domesticCount],
        ['国際送信数', internationalCount],
        ['国内送信料金', domesticPrice],
        ['国際送信料金', internationalPrice],
        [''],
        ['キャリア別送信数'],
        ...carrierData.map(item => [item.name, item.value]),
        [''],
        ['送信数内訳'],
        ...deliveryRatioData.map(item => [item.name, item.value])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `message_analytics_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePeriodChange = (period: DateRangeType) => {
    setSelectedPeriod(period);
    // 期間に応じたデータの更新処理を追加
  };

  const handleCustomPeriodChange = (startDate: string, endDate: string) => {
    // カスタム期間のデータ更新処理を追加
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 p-4 rounded-lg">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-grey-900">メッセージ分析</h2>
          <p className="text-sm text-gray-500">送信したSMSの配信状況やステータスを分析できます</p>
        </div>
        <div className="flex items-center space-x-4">
          <ExportControls 
            onExport={handleExport}
            onPeriodChange={handlePeriodChange}
            onCustomPeriodChange={handleCustomPeriodChange}
            selectedPeriod={selectedPeriod}
            isLoading={isExporting}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center">
            <SendHorizonal className="h-8 w-8 text-blue-500" />
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-grey-500">送信数</dt>
              <dd className="flex items-baseline">
                <p className="text-2xl font-semibold text-grey-900">{totalCount.toLocaleString()}</p>
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-grey-500">国内送信数</dt>
              <dd className="flex items-baseline">
                <p className="text-2xl font-semibold text-grey-900">{domesticCount.toLocaleString()}</p>
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center">
            <BarChart2 className="h-8 w-8 text-green-500" />
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-grey-500">国際送信数</dt>
              <dd className="flex items-baseline">
                <p className="text-2xl font-semibold text-grey-900">{internationalCount.toLocaleString()}</p>
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-grey-500">送信料金</dt>
              <dd className="flex items-baseline">
                <p className="text-2xl font-semibold text-grey-900">{Math.floor(totalPriceAll).toLocaleString()}円</p>
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">キャリア別送信数</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPieChart>
                <Pie
                  data={carrierData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}通`}
                >
                  {carrierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={carrierColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">送信数内訳</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPieChart>
                <Pie
                  data={deliveryRatioData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}通`}
                >
                  {deliveryRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? domesticColor : internationalColor} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">送信料金分析</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPriceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalPrice" name="送信料金" fill={domesticColor} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">送信数分析</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPriceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="送信数" fill="#00BFA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MessageAnalytics; 