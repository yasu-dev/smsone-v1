import React from 'react';
import SettingCard from '../ui/SettingCard';

const ProfileSettings: React.FC = () => {
  return (
    <SettingCard>
      <SettingCard.Header>
        <SettingCard.Title>プロフィール設定</SettingCard.Title>
        <SettingCard.Description>
          プロフィール情報の編集や更新ができます
        </SettingCard.Description>
      </SettingCard.Header>
      <SettingCard.Content>
        <p>プロフィール設定の内容（実装予定）</p>
      </SettingCard.Content>
    </SettingCard>
  );
};

export default ProfileSettings; 