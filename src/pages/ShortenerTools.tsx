import React from 'react';
import { motion } from 'framer-motion';
import MultiUrlShortener from '../components/sms/MultiUrlShortener';

const ShortenerTools: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">URL短縮ツール</h1>
      
      <MultiUrlShortener />
    </motion.div>
  );
};

export default ShortenerTools;