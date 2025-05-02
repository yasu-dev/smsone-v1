import { create } from 'zustand';
import { SMSMessage, SMSStatus } from '../types';
import { calculateSMSPrice, calculateSMSLength } from '../utils/smsUtils';

// Generate random SMS messages for demo
const generateMockMessages = (count: number): SMSMessage[] => {
  const statuses: SMSStatus[] = ['sent', 'delivered', 'failed', 'pending', 'processing'];
  
  // より現実的なデータ分布を設定
  const statusDistribution = {
    delivered: 0.65,  // 65% が配信済み
    sent: 0.20,       // 20% が送信済み
    pending: 0.08,    // 8% が保留中
    processing: 0.04, // 4% が処理中
    failed: 0.03      // 3% が失敗
  };
  
  // 企業や店舗の名前のリスト
  const businessNames = [
    'エース商事', 'ヤマダストア', '東京マート', '大阪ショップ', 'ファッションワールド',
    'テクノショップ', '九州物産', '北海道市場', 'グリーンマーケット', 'メディカルケア',
    'サウンドハウス', 'フラワーギフト', 'スマイルデンタル', 'カフェモーニング', 'スポーツクラブMAX'
  ];
  
  // メッセージのテンプレート
  const messageTemplates = [
    '{{name}}様、本日のご注文 #{{orderNum}} をご確認ください。{{url}}',
    '{{name}}様、商品の発送が完了しました。配送状況はこちら: {{url}}',
    '{{name}}様、明日の予約を承りました。詳細はこちら: {{url}}',
    '{{name}}様、キャンペーン実施中！詳細はこちら: {{url}}',
    '{{name}}様、ポイントが{{points}}pt付与されました。マイページ: {{url}}',
    '{{name}}様、会員特典のお知らせです。{{url}}',
    '{{name}}様、ご意見をお聞かせください。アンケート: {{url}}',
    '{{name}}様、お誕生日特典が届きました！詳細: {{url}}',
    '{{name}}様、{{date}}の予約が確定しました。{{url}}',
    '{{name}}様、お支払いが完了しました。領収書はこちら: {{url}}'
  ];
  
  // 顧客名のリスト
  const customerNames = [
    '田中', '鈴木', '佐藤', '高橋', '渡辺',
    '伊藤', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本',
    '井上', '木村', '斎藤', '清水', '近藤'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    // 日時の設定（過去3ヶ月以内でランダム）
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));
    
    const sentAt = new Date(createdAt);
    sentAt.setMinutes(sentAt.getMinutes() + Math.floor(Math.random() * 5));
    
    const deliveredAt = new Date(sentAt);
    deliveredAt.setMinutes(deliveredAt.getMinutes() + Math.floor(Math.random() * 5));
    
    // ステータスを確率分布に従って決定
    let status: SMSStatus;
    const rand = Math.random();
    if (rand < statusDistribution.delivered) {
      status = 'delivered';
    } else if (rand < statusDistribution.delivered + statusDistribution.sent) {
      status = 'sent';
    } else if (rand < statusDistribution.delivered + statusDistribution.sent + statusDistribution.pending) {
      status = 'pending';
    } else if (rand < statusDistribution.delivered + statusDistribution.sent + statusDistribution.pending + statusDistribution.processing) {
      status = 'processing';
    } else {
      status = 'failed';
    }
    
    // 7%の確率で国際送信とする
    const isInternational = Math.random() < 0.07;
    const recipient = isInternational
      ? `+${Math.floor(1 + Math.random() * 98)}${Math.floor(10000000 + Math.random() * 90000000)}`
      : `0${[7, 8, 9][Math.floor(Math.random() * 3)]}0${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const countryCode = isInternational 
      ? ['US', 'GB', 'CN', 'KR', 'TH', 'AU', 'SG', 'MY', 'ID', 'PH', 'DE', 'FR', 'IT', 'ES', 'CA'][Math.floor(Math.random() * 15)] 
      : undefined;
    
    // 送信元の設定
    const senderIndex = Math.floor(Math.random() * businessNames.length);
    const sender = businessNames[senderIndex];
    
    // 顧客名の生成
    const nameIndex = Math.floor(Math.random() * customerNames.length);
    const customerName = customerNames[nameIndex];
    
    // メッセージテンプレートの選択
    const templateIndex = Math.floor(Math.random() * messageTemplates.length);
    const messageTemplate = messageTemplates[templateIndex];
    
    // メッセージ内容の作成
    let content = messageTemplate
      .replace('{{name}}', customerName)
      .replace('{{orderNum}}', Math.floor(10000 + Math.random() * 90000).toString())
      .replace('{{points}}', Math.floor(100 + Math.random() * 900).toString())
      .replace('{{date}}', `${Math.floor(1 + Math.random() * 12)}月${Math.floor(1 + Math.random() * 28)}日`);
    
    // 短縮URL関連データをランダムに追加
    const hasUrl = messageTemplate.includes('{{url}}');
    const originalUrl = hasUrl 
      ? `https://example.com/${['products', 'orders', 'reservation', 'campaign', 'survey', 'coupon', 'member', 'event'][Math.floor(Math.random() * 8)]}/${Math.floor(1000 + Math.random() * 9000)}` 
      : undefined;
    const shortenedUrl = hasUrl 
      ? `https://sms1.jp/${Math.random().toString(36).substring(2, 8)}` 
      : undefined;
    
    // URLをコンテンツに追加
    if (hasUrl && shortenedUrl) {
      content = content.replace('{{url}}', shortenedUrl);
    } else {
      content = content.replace('{{url}}', '');
    }
    
    // 2つ目のURLを20%の確率で追加
    const hasSecondUrl = hasUrl && Math.random() > 0.8;
    const originalUrl2 = hasSecondUrl 
      ? `https://example.com/${['tracking', 'support', 'feedback', 'special', 'bonus'][Math.floor(Math.random() * 5)]}/${Math.floor(1000 + Math.random() * 9000)}` 
      : undefined;
    const shortenedUrl2 = hasSecondUrl 
      ? `https://sms1.jp/${Math.random().toString(36).substring(2, 8)}` 
      : undefined;
    
    // 2つ目のURLがある場合はコンテンツに追加
    if (hasSecondUrl && shortenedUrl2) {
      content += ` 詳細情報: ${shortenedUrl2}`;
    }
    
    // 文字数を計算
    const characterCount = content.length;
    
    // メモの生成（30%の確率）
    const hasMemo = Math.random() < 0.3;
    const memoOptions = [
      `担当: ${['佐藤', '鈴木', '田中', '渡辺', '高橋'][Math.floor(Math.random() * 5)]}`,
      `部署: ${['営業', 'マーケティング', 'カスタマーサポート', '商品管理', '広報'][Math.floor(Math.random() * 5)]}`,
      `キャンペーンID: ${Math.floor(1000 + Math.random() * 9000)}`,
      `優先度: ${['高', '中', '低'][Math.floor(Math.random() * 3)]}`,
      `フォローアップ: ${Math.floor(1 + Math.random() * 7)}日後`
    ];
    const memo = hasMemo ? memoOptions[Math.floor(Math.random() * memoOptions.length)] : undefined;
    
    // メッセージオブジェクト
    const message: SMSMessage = {
      id: `sms-${i + 1}`,
      recipient,
      sender,
      content,
      status,
      createdAt: createdAt.toISOString(),
      sentAt: status !== 'pending' ? sentAt.toISOString() : undefined,
      deliveredAt: status === 'delivered' ? deliveredAt.toISOString() : undefined,
      userId: '1',
      templateId: Math.random() > 0.5 ? `template-${Math.floor(Math.random() * 5) + 1}` : undefined,
      memo,
      isInternational,
      countryCode,
      characterCount,
      originalUrl,
      shortenedUrl,
      originalUrl2,
      shortenedUrl2,
    };
    
    // 料金を計算して追加
    message.price = calculateSMSPrice(message);
    
    return message;
  });
};

// FileRowの型をここに追加
interface FileRow {
  [key: string]: string;
}

interface BulkSendOptions {
  sender: string;
  messageTemplate?: string;
  originalUrl?: string;
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  isInternational?: boolean;
}

interface SMSStore {
  messages: SMSMessage[];
  isLoading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  sendMessage: (message: Partial<SMSMessage>) => Promise<void>;
  sendTestMessage: (message: Partial<SMSMessage>) => Promise<void>;
  sendBulkMessages: (data: FileRow[], options: BulkSendOptions) => Promise<void>;
}

const useSMSStore = create<SMSStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data for demo
      const mockMessages = generateMockMessages(200);
      
      set({ 
        messages: mockMessages, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages', 
        isLoading: false 
      });
    }
  },

  sendMessage: async (message: Partial<SMSMessage>) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 文字数を計算
      const content = message.content || '';
      const characterCount = content.length;
      
      // Create a new message with mock data
      const newMessage: SMSMessage = {
        id: `sms-${Date.now()}`,
        recipient: message.recipient || '',
        sender: message.sender || 'SMSOne',
        content: content,
        status: 'sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        userId: '1',
        templateId: message.templateId,
        originalUrl: message.originalUrl,
        isInternational: message.isInternational,
        countryCode: message.countryCode,
        characterCount,
      };
      
      // 料金を計算
      newMessage.price = calculateSMSPrice(newMessage);
      
      // Add to the messages list
      set({ 
        messages: [newMessage, ...get().messages], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message', 
        isLoading: false 
      });
    }
  },

  sendTestMessage: async (message: Partial<SMSMessage>) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 文字数を計算
      const content = message.content || '';
      const characterCount = content.length;
      
      // Create a new test message with mock data
      const newMessage: SMSMessage = {
        id: `test-sms-${Date.now()}`,
        recipient: message.recipient || '',
        sender: message.sender || 'SMSOne',
        content: content,
        status: 'sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        userId: '1',
        templateId: message.templateId,
        originalUrl: message.originalUrl,
        memo: '[テスト送信]',
        isInternational: message.isInternational,
        countryCode: message.countryCode,
        characterCount,
      };
      
      // 料金を計算
      newMessage.price = calculateSMSPrice(newMessage);
      
      // Add to the messages list
      set({ 
        messages: [newMessage, ...get().messages], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send test message', 
        isLoading: false 
      });
    }
  },

  sendBulkMessages: async (data: FileRow[], options: BulkSendOptions) => {
    set({ isLoading: true, error: null });
    try {
      // 実際のAPIはここで呼び出し
      // Mock API call - プロダクション環境では実際のAPIエンドポイントにリクエスト
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 各行のデータをSMSMessage形式に変換
      const bulkMessages: SMSMessage[] = data.map((row, index) => {
        // ファイルの行からデータを取得
        const recipient = row.tel || row.A || '';
        const customerName = row.customerName || row.B || '';
        
        // メッセージテンプレートをパーソナライズ
        let content = options.messageTemplate || '';
        
        // 顧客名タグの置換
        content = content.replace(/{customerName}/g, customerName);
        
        // 各行固有のメッセージがある場合は優先
        if (row.message || row.J) {
          content = row.message || row.J || '';
        }
        
        // 各行固有のURLがある場合
        const rowUrl = row.original_url || row.K || '';
        const originalUrl = rowUrl || options.originalUrl || '';
        
        // スキップフラグがある場合は送信しない
        if (row.skip === '1' || row.BZ === '1') {
          return null;
        }
        
        // 文字数を計算
        const characterCount = content.length;
        
        // 送信日時の設定
        const now = new Date();
        let sentAtDate = now;
        
        // 予約送信の場合
        if (options.isScheduled && options.scheduledDate && options.scheduledTime) {
          const scheduledDateTime = new Date(`${options.scheduledDate}T${options.scheduledTime}`);
          if (scheduledDateTime > now) {
            sentAtDate = scheduledDateTime;
          }
        }
        
        // 行ごとに送信日時が指定されている場合
        if (row.send_datetime || row.Q) {
          const rowDateTime = new Date(row.send_datetime || row.Q || '');
          if (!isNaN(rowDateTime.getTime()) && rowDateTime > now) {
            sentAtDate = rowDateTime;
          }
        }
        
        return {
          id: `bulk-sms-${Date.now()}-${index}`,
          recipient,
          sender: options.sender || 'SMSOne',
          content,
          status: sentAtDate > now ? 'pending' : 'sent',
          createdAt: now.toISOString(),
          sentAt: sentAtDate.toISOString(),
          userId: '1',
          originalUrl,
          memo: row.memo || row.F || '',
          isInternational: options.isInternational || false,
          characterCount,
          price: calculateSMSPrice({
            content,
            isInternational: options.isInternational || false,
            characterCount,
            recipient,
            sender: options.sender || 'SMSOne',
            status: sentAtDate > now ? 'pending' : 'sent',
            createdAt: now.toISOString(),
            sentAt: sentAtDate.toISOString(),
            id: `price-calc-${Date.now()}-${index}`,
            userId: '1'
          }),
        };
      }).filter(Boolean) as SMSMessage[];
      
      // Add to the messages list
      set({ 
        messages: [...bulkMessages, ...get().messages], 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send bulk messages', 
        isLoading: false 
      });
    }
  }
}));

export default useSMSStore;