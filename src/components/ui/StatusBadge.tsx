import React from 'react';
import { SMSStatus, CSVJobStatus } from '../../types';

interface StatusBadgeProps {
  status: SMSStatus | CSVJobStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: SMSStatus | CSVJobStatus) => {
    switch (status) {
      case 'delivered':
        return { 
          className: 'badge-success whitespace-nowrap',
          text: '配信完了'
        };
      case 'sent':
        return { 
          className: 'badge-info whitespace-nowrap',
          text: '送信済'
        };
      case 'pending':
        return { 
          className: 'badge bg-grey-100 text-grey-800 whitespace-nowrap',
          text: '送信待ち'
        };
      case 'processing':
        return { 
          className: 'badge bg-primary-100 text-primary-800 whitespace-nowrap',
          text: '処理中'
        };
      case 'failed':
        return { 
          className: 'badge-error whitespace-nowrap',
          text: '配信失敗'
        };
      case 'canceled':
        return { 
          className: 'badge bg-grey-100 text-grey-800 whitespace-nowrap',
          text: 'キャンセル済'
        };
      case 'queued':
        return { 
          className: 'badge bg-primary-100 text-primary-800 whitespace-nowrap',
          text: 'キュー登録済'
        };
      case 'expired':
        return { 
          className: 'badge bg-warning-100 text-warning-800 whitespace-nowrap',
          text: '期限切れ'
        };
      case 'rejected':
        return { 
          className: 'badge-error whitespace-nowrap',
          text: '拒否'
        };
      case 'completed':
        return { 
          className: 'badge-success whitespace-nowrap',
          text: '完了'
        };
      default:
        return { 
          className: 'badge bg-grey-100 text-grey-800 whitespace-nowrap',
          text: '不明'
        };
    }
  };

  const { className: badgeClass, text } = getStatusConfig(status);

  return (
    <span className={`${badgeClass} ${className}`}>
      {text}
    </span>
  );
};

export default StatusBadge;