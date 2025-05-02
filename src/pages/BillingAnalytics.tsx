import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, AlertTriangle, CreditCard, Calendar, Download,
  DollarSign, Users, PieChart, Clock, ArrowUpRight, ArrowDownRight,
  Filter, Search, RefreshCw, ChevronDown, Bell, FileText, Wallet,
  ArrowRight, AlertCircle, CheckCircle, ChevronRight, HelpCircle, Plus,
  Edit
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useBillingStore } from '../store/billingStore';
import useAuthStore from '../store/authStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { ExportControls } from '../components/common/ExportControls';

// ダッシュボードアニメーションの設定
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

type TabType = 'overview' | 'revenue' | 'accounts' | 'usage' | 'cashflow' | 'customers' | 'reports';
type DateRangeType = 'today' | '7days' | '14days' | '30days' | '90days' | 'custom';

interface BillingAnalyticsProps {}

const BillingAnalytics: React.FC<BillingAnalyticsProps> = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const { exportCSV } = useBillingStore();

  // 状態管理
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<DateRangeType>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [alertThreshold, setAlertThreshold] = useState<number>(75); // デフォルト閾値

  // データの日付範囲
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    // データ読み込みシミュレーション
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    loadData();
    
    // 日付範囲を設定
    const now = new Date();
    switch(dateRange) {
      case 'today':
        setStartDate(now);
        setEndDate(now);
        break;
      case '7days':
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case '14days':
        setStartDate(subMonths(now, 2));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case '90days':
        setStartDate(subMonths(now, 3));
        setEndDate(now);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          setStartDate(new Date(customStartDate));
          setEndDate(new Date(customEndDate));
        }
        break;
    }
  }, [dateRange, customStartDate, customEndDate]);

  // モックデータ生成
  const generateMockData = () => {
    // 財務KPIデータ
    const kpi = {
      totalRevenue: 46500000,
      unpaidAmount: 5580000,
      unpaidRate: 12.0,
      arTurnover: 8.5,
      avgPaymentTerms: 32.4,
      overdueRate: 7.8,
      cashflowPrediction: 42300000,
      activeContracts: 178,
      newCustomers: 12,
      churnRate: 1.2,
    };

    // 日付生成ヘルパー
    const generateMonthlyDates = () => {
      const dates = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM'));
        currentDate = addMonths(currentDate, 1);
      }
      
      return dates;
    };

    // 月次売上データ
    const revenueData = generateMonthlyDates().map(month => {
      // 毎月5-15%の成長を模擬
      const growth = 1 + (Math.random() * 0.1 + 0.05);
      const baseRevenue = 4000000 * growth;
      const receivedAmount = baseRevenue * (Math.random() * 0.2 + 0.7); // 70-90%が回収済み
      
      return {
        month,
        revenue: Math.round(baseRevenue),
        received: Math.round(receivedAmount),
        pending: Math.round(baseRevenue - receivedAmount),
        growth: parseFloat((growth - 1).toFixed(2))
      };
    });

    // 顧客別売上データ
    const customerRevenueData = [
      { name: '株式会社テクノ', value: 12500000 },
      { name: 'グローバル商事', value: 8700000 },
      { name: '明光産業', value: 6400000 },
      { name: '東京システム', value: 5800000 },
      { name: 'サイバーテクノロジー', value: 4900000 },
      { name: 'その他', value: 8200000 }
    ];

    // 商品カテゴリ別売上データ
    const categoryRevenueData = [
      { name: 'エンタープライズプラン', value: 24300000 },
      { name: 'スモールビジネスプラン', value: 12700000 },
      { name: 'スタートアッププラン', value: 5800000 },
      { name: 'カスタムソリューション', value: 3700000 }
    ];

    // 未回収金の経過期間分析
    const arAgingData = [
      { name: '0-30日', value: 2100000 },
      { name: '31-60日', value: 1450000 },
      { name: '61-90日', value: 980000 },
      { name: '91-120日', value: 650000 },
      { name: '120日以上', value: 400000 }
    ];

    // キャッシュフロー予測データ (今後6ヶ月)
    const cashflowData = [];
    let currentMonth = new Date();
    let predictedCashflow = 4000000;
    
    for (let i = 0; i < 6; i++) {
      const month = format(currentMonth, 'yyyy-MM');
      // 毎月の変動 (-5%〜+15%)
      const fluctuation = 1 + (Math.random() * 0.2 - 0.05);
      predictedCashflow = predictedCashflow * fluctuation;
      
      cashflowData.push({
        month,
        predicted: Math.round(predictedCashflow),
        expenses: Math.round(predictedCashflow * (Math.random() * 0.3 + 0.4)) // 支出は40-70%
      });
      
      currentMonth = addMonths(currentMonth, 1);
    }

    // 取引先与信状態データ
    const customerCreditData = [
      { name: 'グローバル商事', limit: 15000000, used: 8700000, status: 'good' },
      { name: '株式会社テクノ', limit: 20000000, used: 12500000, status: 'good' },
      { name: '明光産業', limit: 8000000, used: 6400000, status: 'warning' },
      { name: '東京システム', limit: 10000000, used: 5800000, status: 'good' },
      { name: 'サイバーテクノロジー', limit: 7000000, used: 6100000, status: 'warning' }
    ].sort((a, b) => (b.used / b.limit) - (a.used / a.limit));

    // 請求書支払い状況データ
    const invoiceStatusData = [
      { name: '支払済', value: 78 },
      { name: '支払期限内', value: 15 },
      { name: '支払遅延', value: 7 },
    ];
    
    // アラートデータ
    const alerts = [
      { 
        id: 'alert1', 
        type: 'warning', 
        title: '与信枠超過リスク', 
        message: '明光産業の与信枠使用率が80%を超えています。', 
        date: '2024-07-01' 
      },
      { 
        id: 'alert2', 
        type: 'critical', 
        title: '請求書の支払い遅延', 
        message: 'サイバーテクノロジーの請求書INV-2024-42が30日以上遅延しています。', 
        date: '2024-06-28' 
      },
      { 
        id: 'alert3', 
        type: 'info', 
        title: '新規契約', 
        message: '新規契約が12件追加されました。', 
        date: '2024-06-25' 
      },
      { 
        id: 'alert4', 
        type: 'warning', 
        title: '解約率上昇', 
        message: '今月の解約率が先月と比較して25%増加しています。', 
        date: '2024-06-20' 
      },
      { 
        id: 'alert5', 
        type: 'info', 
        title: '四半期決算レポート', 
        message: '2024年Q2の決算レポートが生成されました。', 
        date: '2024-06-15' 
      }
    ];
    
    // セグメント別収益成長率
    const segmentGrowthData = [
      { name: 'エンタープライズ', current: 24300000, previous: 21500000, growth: 13.0 },
      { name: 'スモールビジネス', current: 12700000, previous: 10800000, growth: 17.6 },
      { name: 'スタートアップ', current: 5800000, previous: 5400000, growth: 7.4 },
      { name: 'カスタムソリューション', current: 3700000, previous: 3900000, growth: -5.1 }
    ];

    // 月額利用料とSMS送信単価のデータを追加
    const monthlyUsageData = generateMonthlyDates().map(month => {
      const baseUsage = 50000; // 基本料金
      const domesticSmsCount = Math.floor(Math.random() * 10000) + 5000;
      const internationalSmsCount = Math.floor(Math.random() * 2000) + 1000;
      const domesticPrice = 3.7; // 国内SMS単価
      const internationalPrice = 35.0; // 国際SMS単価
      
      return {
        month,
        baseFee: baseUsage,
        domesticSmsFee: domesticSmsCount * domesticPrice,
        internationalSmsFee: internationalSmsCount * internationalPrice,
        totalFee: baseUsage + (domesticSmsCount * domesticPrice) + (internationalSmsCount * internationalPrice),
        domesticSmsCount,
        internationalSmsCount
      };
    });

    return {
      kpi,
      revenueData,
      customerRevenueData,
      categoryRevenueData,
      arAgingData,
      cashflowData,
      customerCreditData,
      invoiceStatusData,
      alerts,
      segmentGrowthData,
      monthlyUsageData
    };
  };

  // モックデータを生成
  const mockData = generateMockData();
  
  // 金額のフォーマット
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // パーセントのフォーマット
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // KPI値の傾向表示
  const getTrendIcon = (value: number, threshold: number, inverse: boolean = false) => {
    const isPositive = inverse ? value < threshold : value > threshold;
    return isPositive ? (
      <ArrowUpRight className="text-emerald-500 h-4 w-4 mr-1" />
    ) : (
      <ArrowDownRight className="text-red-500 h-4 w-4 mr-1" />
    );
  };
  
  // グラフカラー設定
  const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];
  
  // データをエクスポート
  const handleExportData = (dataType: 'users' | 'invoices') => {
    exportCSV(dataType);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDateRange('custom');
  };

  const handlePeriodChange = (period: 'today' | '7days' | '14days' | '30days' | '90days' | 'custom') => {
    setDateRange(period);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs<TabType>
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full border-b border-gray-200 overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger
            value="overview" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            概要
          </TabsTrigger>
          <TabsTrigger
            value="revenue" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'revenue' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            売上分析
          </TabsTrigger>
          <TabsTrigger
            value="accounts" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'accounts' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            売掛金分析
          </TabsTrigger>
          <TabsTrigger
            value="usage" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'usage' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <PieChart className="h-4 w-4 mr-2" />
            利用状況分析
          </TabsTrigger>
          <TabsTrigger
            value="cashflow" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cashflow' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <Wallet className="h-4 w-4 mr-2" />
            キャッシュフロー
          </TabsTrigger>
          <TabsTrigger
            value="customers" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'customers' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            取引先分析
          </TabsTrigger>
          <TabsTrigger
            value="reports" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports' 
                ? 'bg-white border-primary-200 text-primary-700 shadow' 
                : 'bg-white border-grey-200 text-grey-600 hover:bg-grey-50'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            レポート
          </TabsTrigger>
        </TabsList>
        
        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIカード */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-white p-5 rounded-lg shadow"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">総売上（当期）</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(mockData.kpi.totalRevenue)}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-full">
                  <BarChart2 className="h-5 w-5 text-primary-700" />
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm">
                <ArrowUpRight className="text-emerald-500 h-4 w-4 mr-1" />
                <span className="text-emerald-600 font-medium">12.5%</span>
                <span className="text-gray-500 ml-1">前期比</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-5 rounded-lg shadow"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">未回収金額</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(mockData.kpi.unpaidAmount)}</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">未回収率:</span>
                <span className="text-amber-600 font-medium ml-1">{mockData.kpi.unpaidRate.toFixed(1)}%</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-5 rounded-lg shadow"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">売掛金回転率</h3>
                  <p className="text-2xl font-bold mt-1">{mockData.kpi.arTurnover.toFixed(1)}回</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <RefreshCw className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm">
                <ArrowUpRight className="text-emerald-500 h-4 w-4 mr-1" />
                <span className="text-emerald-600 font-medium">0.5回</span>
                <span className="text-gray-500 ml-1">前期比</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-5 rounded-lg shadow"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">有効契約数</h3>
                  <p className="text-2xl font-bold mt-1">{mockData.kpi.activeContracts}件</p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-full">
                  <Users className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                  +{mockData.kpi.newCustomers}件 新規
                </span>
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                  -{mockData.kpi.churnRate}% 解約率
                </span>
              </div>
            </motion.div>
          </motion.div>
        </TabsContent>
        
        {/* 利用状況分析タブ */}
        <TabsContent value="usage" className="space-y-6">
          {/* 月額利用料分析セクション */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow"
            variants={itemVariants}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">月額利用料分析</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    tickFormatter={(value) => value.split('-')[1] + '月'}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${Math.floor(value / 10000)}万円`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '金額']}
                    labelFormatter={(label) => `${label.split('-')[0]}年${label.split('-')[1]}月`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="基本料金"
                    stroke="#4F46E5"
                    fill="#4F46E520"
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    name="国内SMS料金"
                    stroke="#10B981"
                    fill="#10B98120"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="国際SMS料金"
                    stroke="#F59E0B"
                    fill="#F59E0B20"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default BillingAnalytics;