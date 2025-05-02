import React from 'react';
import SettingCard from '../ui/SettingCard';

const SecuritySettings: React.FC = () => {
  return (
    <SettingCard>
      <SettingCard.Header>
        <SettingCard.Title>セキュリティ設定</SettingCard.Title>
        <SettingCard.Description>
          アカウントのセキュリティに関する設定を管理できます
        </SettingCard.Description>
      </SettingCard.Header>
      <SettingCard.Content>
        <p>セキュリティ設定の内容（実装予定）</p>
      </SettingCard.Content>
    </SettingCard>
  );
};

export default SecuritySettings; 