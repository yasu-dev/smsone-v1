import React from 'react';
import { motion } from 'framer-motion';
import HelpSupportContent from '../components/support/HelpSupportContent';

const Support: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">ヘルプ＆サポート</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-grey-200">
        <HelpSupportContent />
      </div>
    </motion.div>
  );
};

export default Support; 