import React from 'react';
import TagManager from '../components/tags/TagManager';
import { motion } from 'framer-motion';
import './TagManagement.css';

const TagManagement: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="tag-management-page"
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">タグ管理</h1>
      
      <TagManager />
    </motion.div>
  );
};

export default TagManagement; 