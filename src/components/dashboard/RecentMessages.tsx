import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Clock, Search } from 'lucide-react';
import { SMSMessage } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface RecentMessagesProps {
  messages: SMSMessage[];
}

const RecentMessages: React.FC<RecentMessagesProps> = ({ messages }) => {
  // 状態に応じたアクションボタンを表示
  const renderActionButton = (message: SMSMessage) => {
    switch (message.status) {
      case 'pending':
      case 'queued':
      case 'processing':
        return (
          <button className="text-warning-600 hover:text-warning-800">
            <Clock className="h-4 w-4" />
          </button>
        );
      case 'failed':
      case 'rejected':
      case 'expired':
        return (
          <button className="text-error-600 hover:text-error-800">
            <AlertCircle className="h-4 w-4" />
          </button>
        );
      default:
        return (
          <button className="text-primary-600 hover:text-primary-800">
            <Search className="h-4 w-4" />
          </button>
        );
    }
  };

  return (
    <div className="card mt-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-grey-900">最近のメッセージ</h3>
        <Link 
          to="/dashboard/history" 
          className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
          onClick={(e) => {
            e.preventDefault();
            const confirmed = window.confirm('メッセージ履歴画面に移動しますか？');
            if (confirmed) {
              window.location.href = '/dashboard/history';
            }
          }}
        >
          すべて表示
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="overflow-hidden border border-grey-200 rounded-lg">
        <table className="min-w-full divide-y divide-grey-200">
          <thead className="bg-grey-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                宛先
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                内容
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                送信日時
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                ステータス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-grey-200">
            {messages.map((message) => (
              <tr key={message.id} className="hover:bg-grey-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                  {message.recipient}
                </td>
                <td className="px-6 py-4 text-sm text-grey-900 max-w-xs truncate">
                  {message.content}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                  {new Date(message.createdAt).toLocaleString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={message.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                  {renderActionButton(message)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentMessages;