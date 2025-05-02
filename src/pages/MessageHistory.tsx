import React from 'react';
import { motion } from 'framer-motion';
import MessageHistoryComponent from '../components/history/MessageHistory';

const MessageHistory: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">送信履歴管理</h1>
      
      <MessageHistoryComponent />
    </motion.div>
  );
};

export default MessageHistory;