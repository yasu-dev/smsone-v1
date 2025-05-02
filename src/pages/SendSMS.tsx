import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Tab } from '@headlessui/react';
import IndividualSendForm from '../components/sms/IndividualSendForm';
import BulkSendForm from '../components/sms/BulkSendForm';
import useAuthStore from '../store/authStore';

const LoadingFallback = () => (
  <div className="py-4">
    <div className="flex justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
    <p className="text-center mt-2 text-grey-600">読み込み中...</p>
  </div>
);

const SendSMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const hasPermission = useAuthStore(state => state.hasPermission);
  // bulkSendingの権限がなくても一括送信画面を表示できるようにする
  const canUseBulkSending = true; // 常にtrueにして表示するように変更
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">SMS送信</h1>
      
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-grey-100 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-grey-700 hover:bg-white/[0.12] hover:text-grey-900'
              }
              `
            }
          >
            個別送信
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-grey-700 hover:bg-white/[0.12] hover:text-grey-900'
              }
              `
            }
          >
            一斉送信
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <Suspense fallback={<LoadingFallback />}>
              <IndividualSendForm />
            </Suspense>
          </Tab.Panel>
          <Tab.Panel>
            <Suspense fallback={<LoadingFallback />}>
              <BulkSendForm />
            </Suspense>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </motion.div>
  );
};

export default SendSMS; 