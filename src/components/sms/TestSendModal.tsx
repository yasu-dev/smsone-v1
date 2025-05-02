import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useSMSStore from '../../store/smsStore';
import TagHighlighter from '../ui/TagHighlighter';

interface TestSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  senderNumber: string;
  originalUrl?: string;
}

const TestSendModal: React.FC<TestSendModalProps> = ({
  isOpen,
  onClose,
  content,
  senderNumber,
  originalUrl
}) => {
  const [testRecipient, setTestRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendTestMessage } = useSMSStore();

  if (!isOpen) return null;

  const handleTestSend = async () => {
    if (!testRecipient) {
      toast.error('テスト送信用携帯番号を入力してください');
      return;
    }

    // 電話番号の簡易バリデーション
    const phoneRegex = /^0[0-9]{9,10}$/;
    if (!phoneRegex.test(testRecipient)) {
      toast.error('有効な電話番号を入力してください（例: 09012345678）');
      return;
    }

    setIsSending(true);

    try {
      await sendTestMessage({
        recipient: testRecipient,
        content,
        sender: senderNumber,
        originalUrl
      });

      toast.success(`${testRecipient}へテスト送信しました`);
      onClose();
    } catch (error) {
      toast.error('テスト送信に失敗しました');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-grey-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-grey-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-grey-900 flex items-center">
            <ShieldCheck className="h-5 w-5 text-primary-500 mr-2" />
            テスト送信
          </h2>
          <button
            type="button"
            className="text-grey-400 hover:text-grey-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-grey-600 mb-4">
            実際の送信前に内容を確認するため、テスト用の携帯電話番号へSMSを送信します。
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="test-recipient" className="form-label flex items-center">
                テスト送信用携帯番号 <span className="text-error-500 ml-1">*</span>
              </label>
              <input
                type="tel"
                id="test-recipient"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="例: 09012345678"
                className="form-input"
                required
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-grey-700">送信内容</h3>
              </div>
              <div className="p-3 bg-grey-50 rounded-md text-sm text-grey-800 whitespace-pre-wrap border border-grey-200">
                <TagHighlighter text={content} />
              </div>
            </div>

            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-warning-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-700">
                テスト送信も通常のSMS配信と同様に課金対象となります。
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-grey-200 bg-grey-50 flex justify-end">
          <button
            type="button"
            className="btn-secondary mr-3"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleTestSend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                送信中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                テスト送信
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TestSendModal;