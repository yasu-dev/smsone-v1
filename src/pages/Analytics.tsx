import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import useSMSStore from '../store/smsStore';

const Analytics: React.FC = () => {
  const { fetchMessages } = useSMSStore();

  // コンポーネントがマウントされたらデータを読み込む
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">分析</h1>
      
      <AnalyticsDashboard />
    </motion.div>
  );
};

export default Analytics; 