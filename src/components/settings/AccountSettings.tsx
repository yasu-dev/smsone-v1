import React from 'react';
import SettingCard from '../ui/SettingCard';

const AccountSettings: React.FC = () => {
  return (
    <SettingCard>
      <SettingCard.Header>
        <SettingCard.Title>アカウント設定</SettingCard.Title>
        <SettingCard.Description>
          アカウント情報やパスワードの管理ができます
        </SettingCard.Description>
      </SettingCard.Header>
      <SettingCard.Content>
        <p>アカウント設定の内容（実装予定）</p>
      </SettingCard.Content>
    </SettingCard>
  );
};

export default AccountSettings; 