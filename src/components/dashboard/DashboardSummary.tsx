import React from 'react';
import { motion } from 'framer-motion';
import { 
  SendHorizonal, Clock, Calendar, Activity, Signal
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface DashboardSummaryProps {
  stats: DashboardStats;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ stats }) => {
  // システム状態に応じたアイコン色を取得
  const getSystemStatusColor = () => {
    switch(stats.systemStatus) {
      case 'normal': return 'text-success-500';
      case 'maintenance': return 'text-warning-500';
      case 'degraded': return 'text-warning-500';
      case 'outage': return 'text-error-500';
      default: return 'text-grey-500';
    }
  };

  // システム状態に応じたカード背景色を取得
  const getSystemStatusBgColor = () => {
    switch(stats.systemStatus) {
      case 'normal': return 'bg-success-50 text-success-700 ring-success-600/20';
      case 'maintenance': return 'bg-warning-50 text-warning-700 ring-warning-600/20';
      case 'degraded': return 'bg-warning-50 text-warning-700 ring-warning-600/20';
      case 'outage': return 'bg-error-50 text-error-700 ring-error-600/20';
      default: return 'bg-grey-50 text-grey-700 ring-grey-600/20';
    }
  };

  const summaryItems = [
    {
      key: 'sending',
      title: '送信中メッセージ',
      value: stats.activeSending.toLocaleString(),
      icon: <SendHorizonal className="h-8 w-8 text-primary-500" />,
      color: 'bg-primary-50 text-primary-700 ring-primary-600/20',
    },
    {
      key: 'waiting',
      title: '送信待ちメッセージ',
      value: stats.waitingToSend.toLocaleString(),
      icon: <Clock className="h-8 w-8 text-warning-500" />,
      color: 'bg-warning-50 text-warning-700 ring-warning-600/20',
    },
    {
      key: 'scheduled',
      title: '予約送信',
      value: stats.scheduledMessages.toString(),
      icon: <Calendar className="h-8 w-8 text-info-500" />,
      color: 'bg-info-50 text-info-700 ring-info-600/20',
    },
    {
      key: 'rate',
      title: '現在の送信速度',
      value: `${stats.messageSendRate.toLocaleString()}件/分`,
      icon: <Activity className="h-8 w-8 text-success-500" />,
      color: 'bg-success-50 text-success-700 ring-success-600/20',
    },
    {
      key: 'system',
      title: 'システム状態',
      value: (() => {
        switch(stats.systemStatus) {
          case 'normal': return '正常';
          case 'maintenance': return 'メンテナンス中';
          case 'degraded': return '一部機能低下';
          case 'outage': return '障害発生中';
          default: return '不明';
        }
      })(),
      icon: <Signal className={`h-8 w-8 ${getSystemStatusColor()}`} />,
      color: getSystemStatusBgColor(),
    },
  ];

  // Animation variants for the container
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for each item
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {summaryItems.map((item) => (
        <motion.div
          key={item.key}
          className="card overflow-hidden"
          variants={item as any}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <div className="shrink-0">
              {item.icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-grey-500 break-words whitespace-normal min-h-[40px] flex items-center">
                {item.title}
              </dt>
              <dd className="flex items-baseline">
                <p className="text-2xl font-semibold text-grey-900">
                  {item.value}
                </p>
              </dd>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default DashboardSummary;