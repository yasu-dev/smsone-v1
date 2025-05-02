import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import SendingTrendChart from '../components/dashboard/SendingTrendChart';
import RecentMessages from '../components/dashboard/RecentMessages';
import useDashboardStore from '../store/dashboardStore';

const Dashboard: React.FC = () => {
  const { stats, fetchStats, isLoading, error } = useDashboardStore();
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-error-600">
        エラーが発生しました: {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">ダッシュボード</h1>
      
      {stats && (
        <>
          <DashboardSummary stats={stats} />
          <SendingTrendChart data={stats.dailySendingTrend} />
          <RecentMessages messages={stats.recentMessages} />
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;