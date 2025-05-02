import React, { useState } from 'react';
import SettingCard from '../ui/SettingCard';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

// 通知設定の型定義
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

// 通知カテゴリの型定義
interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  settings: NotificationSetting[];
}

const NotificationSettings: React.FC = () => {
  // 初期の通知設定
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'system',
      title: 'システム通知',
      description: 'システムに関する重要な通知',
      settings: [
        {
          id: 'system_maintenance',
          label: 'メンテナンス情報',
          description: 'システムメンテナンスの予定と完了の通知',
          checked: true
        },
        {
          id: 'system_update',
          label: 'アップデート情報',
          description: '新機能や改善に関する通知',
          checked: true
        },
        {
          id: 'system_alert',
          label: '重要なお知らせ',
          description: 'システムの障害や復旧に関する通知',
          checked: true
        }
      ]
    },
    {
      id: 'message',
      title: 'メッセージ通知',
      description: 'SMS送信に関する通知',
      settings: [
        {
          id: 'message_sent',
          label: '送信完了通知',
          description: 'SMSの送信が完了した時の通知',
          checked: true
        },
        {
          id: 'message_delivered',
          label: '配信完了通知',
          description: 'SMSが相手に届いた時の通知',
          checked: true
        },
        {
          id: 'message_failed',
          label: '送信失敗通知',
          description: 'SMSの送信に失敗した時の通知',
          checked: true
        },
        {
          id: 'scheduled_message',
          label: '予約送信通知',
          description: '予約したSMSが送信された時の通知',
          checked: true
        }
      ]
    },
    {
      id: 'account',
      title: 'アカウント通知',
      description: 'アカウントに関する通知',
      settings: [
        {
          id: 'account_login',
          label: 'ログイン通知',
          description: '新しいデバイスからのログインの通知',
          checked: true
        },
        {
          id: 'account_password',
          label: 'パスワード変更通知',
          description: 'パスワードが変更された時の通知',
          checked: true
        },
        {
          id: 'account_update',
          label: 'アカウント情報変更通知',
          description: 'アカウント情報が更新された時の通知',
          checked: false
        }
      ]
    },
    {
      id: 'survey',
      title: 'アンケート通知',
      description: 'アンケートに関する通知',
      settings: [
        {
          id: 'survey_response',
          label: '回答受信通知',
          description: 'アンケートの新しい回答を受け取った時の通知',
          checked: true
        },
        {
          id: 'survey_deadline',
          label: '回答期限通知',
          description: 'アンケートの回答期限が近づいた時の通知',
          checked: true
        },
        {
          id: 'survey_completion',
          label: 'アンケート完了通知',
          description: 'アンケートの回答が完了した時の通知',
          checked: true
        }
      ]
    },
    {
      id: 'campaign',
      title: 'キャンペーン通知',
      description: 'マーケティングキャンペーンに関する通知',
      settings: [
        {
          id: 'campaign_start',
          label: 'キャンペーン開始通知',
          description: 'キャンペーンが開始された時の通知',
          checked: true
        },
        {
          id: 'campaign_end',
          label: 'キャンペーン終了通知',
          description: 'キャンペーンが終了した時の通知',
          checked: true
        },
        {
          id: 'campaign_performance',
          label: 'キャンペーン成績通知',
          description: 'キャンペーンの成績レポートの通知',
          checked: false
        }
      ]
    }
  ]);

  // 通知設定の切り替え
  const handleToggle = (categoryId: string, settingId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            settings: category.settings.map(setting => 
              setting.id === settingId 
                ? { ...setting, checked: !setting.checked } 
                : setting
            )
          }
        : category
    ));
  };

  // カテゴリ内のすべての通知設定を切り替え
  const handleToggleAll = (categoryId: string, checked: boolean) => {
    setCategories(categories.map(category => 
      category.id === categoryId
        ? {
            ...category,
            settings: category.settings.map(setting => ({ ...setting, checked }))
          }
        : category
    ));
  };

  // 設定を保存
  const handleSave = () => {
    // APIに保存する処理（ここではconsole.logのみ）
    console.log('通知設定を保存:', categories);
    alert('通知設定を保存しました');
  };

  return (
    <SettingCard>
      <SettingCard.Header>
        <SettingCard.Title>通知設定</SettingCard.Title>
        <SettingCard.Description>
          サービスからどのような通知を受け取るかを選択してください
        </SettingCard.Description>
      </SettingCard.Header>
      <SettingCard.Content>
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="pb-6 border-b border-grey-200 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-md font-medium text-grey-900">{category.title}</h3>
                  <p className="text-sm text-grey-500">{category.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-700"
                    onClick={() => handleToggleAll(category.id, true)}
                  >
                    すべて選択
                  </button>
                  <span className="text-grey-300">|</span>
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-700"
                    onClick={() => handleToggleAll(category.id, false)}
                  >
                    すべて解除
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {category.settings.map((setting) => (
                  <div key={setting.id} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Checkbox 
                        id={setting.id}
                        checked={setting.checked}
                        onChange={() => handleToggle(category.id, setting.id)}
                      />
                    </div>
                    <div className="ml-3">
                      <label 
                        htmlFor={setting.id} 
                        className="text-sm font-medium text-grey-900 cursor-pointer"
                      >
                        {setting.label}
                      </label>
                      <p className="text-xs text-grey-500">{setting.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              設定を保存
            </Button>
          </div>
        </div>
      </SettingCard.Content>
    </SettingCard>
  );
};

export default NotificationSettings;
