import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Clock, Calendar, BarChart2, TrendingUp, ChevronLeft, ChevronRight, Calendar as CalendarIcon, SendHorizonal } from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SendingTrendChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

interface HourlyData {
  hour: number;
  count: number;
}

// この関数は指定された日数分の日付配列を生成します
const generateDateArray = (days: number, startDate?: Date): string[] => {
  const dates: string[] = [];
  const start = startDate || new Date();
  
  // 指定された日数だけ過去の日付を生成
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(start);
    date.setDate(start.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

// デモデータを生成する関数
const generateDemoData = (dates: string[]): {date: string; count: number}[] => {
  return dates.map(date => {
    // 日付によって値を変動させる（週末は少なめ、平日は多めに）
    const dayOfWeek = new Date(date).getDay();
    let baseCount: number;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 土日は少なめ
      baseCount = Math.floor(Math.random() * 200) + 100;
    } else if (dayOfWeek === 1 || dayOfWeek === 5) {
      // 月曜と金曜は多め
      baseCount = Math.floor(Math.random() * 400) + 300;
    } else {
      // 火水木は普通
      baseCount = Math.floor(Math.random() * 300) + 200;
    }
    
    return {
      date,
      count: baseCount
    };
  });
};

const SendingTrendChart: React.FC<SendingTrendChartProps> = ({ data: initialData }) => {
  const [selectedTab, setSelectedTab] = useState<'trend' | 'hourly'>('trend');
  const [chartAnimation, setChartAnimation] = useState(false);
  const chartRef = useRef<any>(null);
  const stats = useDashboardStore(state => state.stats);
  
  // 日付範囲の選択用の状態
  const [dateRange, setDateRange] = useState<'7days' | '14days' | '30days' | '90days'>('14days');
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const [trendData, setTrendData] = useState<{date: string; count: number}[]>(initialData);

  // 日付範囲に基づいてデータを更新
  useEffect(() => {
    const days = dateRange === '7days' ? 7 : 
                dateRange === '14days' ? 14 : 
                dateRange === '30days' ? 30 : 90;
    
    const dates = generateDateArray(days, currentStartDate);
    // データを再生成（実際のアプリでは、APIからデータ取得するロジックになる）
    const newData = generateDemoData(dates);
    setTrendData(newData);
    
    // アニメーション効果
    setChartAnimation(true);
    const timer = setTimeout(() => setChartAnimation(false), 800);
    return () => clearTimeout(timer);
  }, [dateRange, currentStartDate]);

  // 期間移動処理
  const moveDateRange = (direction: 'prev' | 'next') => {
    const days = dateRange === '7days' ? 7 : 
                dateRange === '14days' ? 14 : 
                dateRange === '30days' ? 30 : 90;
    
    const newDate = new Date(currentStartDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - days);
    } else {
      newDate.setDate(newDate.getDate() + days);
    }
    
    // 未来の日付は選択できないようにする
    if (direction === 'next' && newDate > new Date()) {
      return;
    }
    
    setCurrentStartDate(newDate);
  };

  // ダッシュボードストアから時間帯別データを取得
  const hourlyData: HourlyData[] = stats?.hourlySendingData || Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Math.floor(Math.random() * 100) + 50
  }));

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  };

  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };

  // 表示期間のフォーマット
  const formatDateRangeLabel = () => {
    if (!trendData.length) return '';
    
    const startDate = new Date(trendData[0].date);
    const endDate = new Date(trendData[trendData.length - 1].date);
    
    return `${startDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })} 〜 ${endDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}`;
  };

  // 日別送信トレンドチャートデータ
  const dailyChartData = {
    labels: trendData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: '送信数',
        data: trendData.map(item => item.count),
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(37, 99, 235, 1)',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  // 時間帯別送信数チャートデータ
  const hourlyChartData = {
    labels: hourlyData.map((item: HourlyData) => formatHour(item.hour)),
    datasets: [
      {
        label: '送信数',
        data: hourlyData.map((item: HourlyData) => item.count),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.8)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');
          return gradient;
        },
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(30, 64, 175, 0.9)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          title: (items: any) => {
            return selectedTab === 'trend' 
              ? `${items[0].label} の送信数`
              : `${items[0].label} の時間帯`;
          },
          label: (context: any) => {
            return `送信数: ${context.raw.toLocaleString()} 件`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: dateRange === '90days' ? 12 : dateRange === '30days' ? 10 : 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (tickValue: number | string) => {
            // 数値の場合だけカンマ区切りの文字列に変換
            if (typeof tickValue === 'number') {
              return tickValue.toLocaleString();
            }
            return tickValue;
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 1000,
    },
  };

  // グラフ表示切り替え時にアニメーション効果を付ける
  useEffect(() => {
    setChartAnimation(true);
    const timer = setTimeout(() => setChartAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [selectedTab]);

  // 日時と総送信数の計算
  const totalSent = trendData.reduce((sum: number, item) => sum + item.count, 0);
  const hourlyTotalSent = hourlyData.reduce((sum: number, item: HourlyData) => sum + item.count, 0);
  const avgPerDay = Math.round(totalSent / trendData.length);
  const peakHour = [...hourlyData].sort((a: HourlyData, b: HourlyData) => b.count - a.count)[0]?.hour;

  return (
    <motion.div 
      className="card mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-grey-900">時間帯別送信数</h3>
        <div className="flex space-x-2">
          <motion.div
            className="bg-white shadow-sm rounded-lg border border-grey-200 flex overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className={`px-3 py-1.5 text-sm font-medium flex items-center ${
                selectedTab === 'trend' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-white text-grey-700 hover:bg-grey-50'
              }`}
              onClick={() => setSelectedTab('trend')}
            >
              <TrendingUp className="h-4 w-4 mr-1.5" />
              日別トレンド
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium flex items-center ${
                selectedTab === 'hourly' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-white text-grey-700 hover:bg-grey-50'
              }`}
              onClick={() => setSelectedTab('hourly')}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              時間帯分析
            </button>
          </motion.div>
        </div>
      </div>
      
      {selectedTab === 'trend' && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <button 
              className="p-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              onClick={() => moveDateRange('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5 text-blue-700" />
              {formatDateRangeLabel()}
            </span>
            <button 
              className="p-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              onClick={() => moveDateRange('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-1 bg-blue-50 p-0.5 rounded-lg">
            <button 
              className={`px-2 py-1 text-xs rounded-md transition-colors ${dateRange === '7days' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              onClick={() => setDateRange('7days')}
            >
              7日間
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded-md transition-colors ${dateRange === '14days' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              onClick={() => setDateRange('14days')}
            >
              14日間
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded-md transition-colors ${dateRange === '30days' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              onClick={() => setDateRange('30days')}
            >
              30日間
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded-md transition-colors ${dateRange === '90days' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}
              onClick={() => setDateRange('90days')}
            >
              90日間
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          className="bg-primary-50 text-primary-700 ring-primary-600/20 p-4 rounded-lg"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">総送信数</h3>
            <SendHorizonal className="h-6 w-6 text-primary-500" />
          </div>
          <div className="text-2xl font-bold mt-2">{selectedTab === 'trend' ? totalSent.toLocaleString() : hourlyTotalSent.toLocaleString()}</div>
          <div className="mt-2">
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {selectedTab === 'trend' ? `${trendData.length}日間の合計` : '24時間の合計'}
            </span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-grey-500 text-sm font-medium">
                {selectedTab === 'trend' ? '1日あたりの平均' : 'ピーク時間帯'}
              </p>
              <h4 className="text-2xl font-bold text-grey-900 mt-1">
                {selectedTab === 'trend' 
                  ? `${avgPerDay.toLocaleString()} 件` 
                  : `${peakHour}:00〜${peakHour+1}:00`}
              </h4>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              {selectedTab === 'trend' 
                ? <Calendar className="h-5 w-5 text-blue-600" />
                : <Clock className="h-5 w-5 text-blue-600" />
              }
            </div>
          </div>
          <div className="mt-3 text-grey-500 text-xs">
            {selectedTab === 'trend' 
              ? '日別の平均送信数' 
              : '送信数が最も多い時間帯'}
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-grey-500 text-sm font-medium">傾向分析</p>
              <h4 className="text-lg font-bold text-grey-900 mt-1">
                {selectedTab === 'trend' 
                  ? trendData[trendData.length - 1]?.count > trendData[0]?.count 
                    ? '増加傾向' 
                    : '減少傾向'
                  : '業務時間帯に集中'
                }
              </h4>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-700">
              {selectedTab === 'trend' 
                ? '前期間比 +12.5%' 
                : '9時〜18時が全体の68%'}
            </span>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedTab}-${dateRange}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="h-72 relative"
        >
          {selectedTab === 'trend' ? (
            <Line ref={chartRef} data={dailyChartData} options={chartOptions} />
          ) : (
            <Bar ref={chartRef} data={hourlyChartData} options={chartOptions} />
          )}
          
          {chartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-md z-10">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 text-sm text-grey-500 border-t border-grey-100 pt-4">
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          {selectedTab === 'trend' 
            ? `※ グラフは${trendData.length}日間の送信数の推移を表示しています。送信量の変動パターンを把握し、リソース計画に活用してください。` 
            : '※ 時間帯別の送信数分布です。ピーク時間を把握し、効果的な配信スケジュールを検討してください。'}
        </p>
      </div>
    </motion.div>
  );
};

export default SendingTrendChart;