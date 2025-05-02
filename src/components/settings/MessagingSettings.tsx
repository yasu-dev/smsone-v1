import React from 'react';
import { SenderNumberSettings } from './SenderNumberSettings';
import SettingCard from '../ui/SettingCard';

interface MessagingSettingsProps {
  userId?: string;
}

export const MessagingSettings: React.FC<MessagingSettingsProps> = ({ userId }) => {
  return (
    <SettingCard title="送信者名設定">
      <SenderNumberSettings userId={userId} hideSharing={true} />
    </SettingCard>
  );
};

export default MessagingSettings; 