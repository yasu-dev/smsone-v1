import { create } from 'zustand';
import { FAQItem, FAQCategory } from '../types';
import { toast } from 'react-hot-toast';

// 現在の日時をISO形式で取得
const getCurrentISODate = () => new Date().toISOString();

// 初期FAQデータ
const initialFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'SMSの送信に失敗する場合はどうすればよいですか？',
    answer: '送信エラーが発生した場合は、電話番号の形式が正しいか（国際形式の場合は国コードから始まるか）、送信可能な時間帯か（22:00～8:00は配信制限がある場合があります）、アカウントの残高が十分かを確認してください。エラーコードが表示されている場合は、そのコードをメールサポートにお知らせいただくとスムーズに対応できます。',
    category: '送信',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    question: 'CSVで一括送信する際の正しいフォーマットを教えてください',
    answer: 'CSVファイルの1行目には必ずヘッダー（電話番号、メッセージ内容など）を入れてください。電話番号列は「phone」または「tel」、メッセージ内容列は「message」または「text」というヘッダー名を使用すると自動認識されます。電話番号は「09012345678」のようにハイフンなしの形式が推奨です。文字コードはUTF-8を使用してください。サンプルCSVは「送信履歴」画面からダウンロードできます。',
    category: '送信',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    question: 'Excelファイルで一括送信する方法を教えてください',
    answer: 'Excel形式（.xlsx）の一括送信にも対応しています。CSVと同様に1行目にヘッダーを設定してください。「電話番号」「メッセージ」という列名が推奨されますが、英語の「phone」「message」なども自動認識されます。複数のシートがある場合は、最初のシート（Sheet1）のみが読み込まれます。日本語や絵文字を含む場合もExcel形式であれば文字化けの心配はありません。送信前には必ずプレビュー機能で内容を確認してください。',
    category: '送信',
    createdAt: '2023-01-03T00:00:00.000Z',
    updatedAt: '2023-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    question: '送信予約したSMSをキャンセルする方法は？',
    answer: '送信予約したSMSは「送信履歴」画面から確認できます。ステータスが「予約済」のメッセージを選択し、「予約キャンセル」ボタンをクリックすることでキャンセルできます。ただし、予約時刻の10分前を過ぎるとキャンセルできなくなりますのでご注意ください。',
    category: '送信',
    createdAt: '2023-01-04T00:00:00.000Z',
    updatedAt: '2023-01-04T00:00:00.000Z',
  },
  {
    id: '5',
    question: 'メッセージテンプレートで変数を使用する方法は？',
    answer: 'メッセージテンプレートでは、「{{名前}}」のように二重波括弧で囲んだ文字を変数として使用できます。一括送信時にCSVの列名と変数名が一致すると、自動的に置換されます。例えば、CSVに「名前」という列があれば、メッセージ内の「{{名前}}」がその値に置き換わります。日時や番号などの書式設定も可能です。詳細はマニュアルをご参照ください。',
    category: 'テンプレート',
    createdAt: '2023-01-05T00:00:00.000Z',
    updatedAt: '2023-01-05T00:00:00.000Z',
  },
  {
    id: '6',
    question: '送信したSMSの配信状況を確認するには？',
    answer: '送信したSMSの配信状況は「送信履歴」画面で確認できます。各メッセージには「送信済」「配信済」「不達」などのステータスが表示されます。詳細な配信レポートが必要な場合は、送信履歴の「レポート出力」ボタンからCSVまたはPDF形式でダウンロードできます。なお、キャリアからの配信状況の反映には数分から最大24時間かかる場合があります。',
    category: '履歴',
    createdAt: '2023-01-06T00:00:00.000Z',
    updatedAt: '2023-01-06T00:00:00.000Z',
  },
  {
    id: '7',
    question: 'SMSのURLリンクが途中で切れてしまう場合の対処法は？',
    answer: 'SMSは全角70文字/半角160文字を超えると複数のメッセージに分割されるため、URLが途切れることがあります。対策として、1) 短縮URLサービスを使用する、2) メッセージの長さを調整する、3) URLをメッセージの最初または最後に配置する、のいずれかを試してください。本システムには短縮URL機能が組み込まれていますので、そちらの使用をお勧めします。',
    category: '送信',
    createdAt: '2023-07-01T00:00:00.000Z',
    updatedAt: '2023-07-01T00:00:00.000Z',
  },
  {
    id: '8',
    question: 'アカウント情報を変更するにはどうすればよいですか？',
    answer: '画面右上のプロフィールアイコンをクリックし、「プロフィール」を選択します。表示された画面でアカウント情報を編集できます。メールアドレス変更後は確認メールが送信されるため、新しいメールアドレスで認証を完了させる必要があります。パスワードを変更する場合は、現在のパスワードの入力が必要です。',
    category: 'アカウント',
    createdAt: '2023-07-15T00:00:00.000Z',
    updatedAt: '2023-07-15T00:00:00.000Z',
  },
  {
    id: '9',
    question: 'アンケートの回答率を上げるコツはありますか？',
    answer: 'アンケートの回答率を上げるには、1) 質問数を最小限に抑える（5問以内が理想的）、2) 回答しやすい選択肢を用意する、3) スマホで見やすいデザインにする、4) ランディングページに明確な説明文を入れる、5) 可能であれば回答者への特典を用意する、などが効果的です。また、SMSでアンケートを送信する時間帯は平日の10:00〜17:00が最も回答率が高い傾向にあります。',
    category: 'アンケート',
    createdAt: '2023-08-10T00:00:00.000Z',
    updatedAt: '2023-08-10T00:00:00.000Z',
  },
  {
    id: '10',
    question: '二段階認証を有効にする方法を教えてください',
    answer: 'プロフィール画面の「セキュリティ設定」タブを選択し、「二段階認証を有効にする」ボタンをクリックします。表示されるQRコードをGoogle AuthenticatorやMicrosoft Authenticatorなどの認証アプリでスキャンし、表示されるコードを入力して設定を完了させます。設定後はログイン時にパスワードに加えて認証アプリのコード入力が必要になります。また、万が一認証アプリにアクセスできなくなった場合に備えて、リカバリーコードをダウンロードして安全な場所に保管してください。',
    category: 'セキュリティ',
    createdAt: '2023-09-05T00:00:00.000Z',
    updatedAt: '2023-09-05T00:00:00.000Z',
  },
  {
    id: '11',
    question: 'SMS送信に適した時間帯はありますか？',
    answer: 'SMS送信の最適な時間帯は、用途によって異なります。一般的にはビジネス目的なら平日10:00～17:00が効果的です。リマインダーは予定の2～3時間前、緊急通知は時間帯を問わず送信できます。ただし、早朝（7:00以前）と深夜（22:00以降）の送信はユーザー体験を損なう可能性があるため避けるのが望ましいでしょう。また、国際SMS送信の場合は、相手国の時間帯も考慮してください。',
    category: '送信',
    createdAt: '2023-10-01T00:00:00.000Z',
    updatedAt: '2023-10-01T00:00:00.000Z',
  },
  {
    id: '12',
    question: 'APIを使用したSMS送信方法を教えてください',
    answer: '当サービスでは、RESTful APIを提供しています。APIドキュメントは「設定」>「API設定」から確認できます。利用には、API認証キーが必要です。基本的なリクエスト形式はJSONで、送信先電話番号、メッセージ内容、送信タイミングなどを指定できます。サンプルコードや詳細な実装例も用意していますので、APIドキュメントをご参照ください。セキュリティ上の理由から、API認証キーを第三者と共有しないようご注意ください。',
    category: 'その他',
    createdAt: '2023-11-15T00:00:00.000Z',
    updatedAt: '2023-11-15T00:00:00.000Z',
  }
];

interface FAQStore {
  faqs: FAQItem[];
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchFAQs: () => Promise<void>;
  createFAQ: (faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FAQItem>;
  updateFAQ: (id: string, faq: Partial<FAQItem>) => Promise<FAQItem>;
  deleteFAQ: (id: string) => Promise<void>;
  getAllCategories: () => string[];
}

const useFAQStore = create<FAQStore>((set, get) => ({
  faqs: initialFAQs,
  isLoading: false,
  error: null,
  
  fetchFAQs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // 実際の実装ではAPIから取得する
      // ここではモックデータを使用
      set({ faqs: initialFAQs, isLoading: false });
    } catch (error) {
      set({ error: 'FAQの取得に失敗しました', isLoading: false });
    }
  },
  
  createFAQ: async (faqData) => {
    set({ isLoading: true, error: null });
    
    try {
      // 実際の実装ではAPIを呼び出す
      const newFAQ: FAQItem = {
        id: Math.random().toString(36).substring(2, 11),
        ...faqData,
        createdAt: getCurrentISODate(),
        updatedAt: getCurrentISODate(),
      };
      
      // 現在のFAQリストに新しいFAQを追加
      set(state => ({ 
        faqs: [...state.faqs, newFAQ],
        isLoading: false 
      }));
      
      toast.success('FAQを作成しました');
      return newFAQ;
    } catch (error) {
      set({ error: 'FAQの作成に失敗しました', isLoading: false });
      throw error;
    }
  },
  
  updateFAQ: async (id, faqData) => {
    set({ isLoading: true, error: null });
    
    try {
      // 実際の実装ではAPIを呼び出す
      const updatedFAQ: FAQItem = {
        ...get().faqs.find(faq => faq.id === id)!,
        ...faqData,
        updatedAt: getCurrentISODate(),
      };
      
      // 現在のFAQリストを更新
      set(state => ({
        faqs: state.faqs.map(faq => faq.id === id ? updatedFAQ : faq),
        isLoading: false
      }));
      
      toast.success('FAQを更新しました');
      return updatedFAQ;
    } catch (error) {
      set({ error: 'FAQの更新に失敗しました', isLoading: false });
      throw error;
    }
  },
  
  deleteFAQ: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // 実際の実装ではAPIを呼び出す
      
      // 現在のFAQリストから削除
      set(state => ({
        faqs: state.faqs.filter(faq => faq.id !== id),
        isLoading: false
      }));
      
      toast.success('FAQを削除しました');
    } catch (error) {
      set({ error: 'FAQの削除に失敗しました', isLoading: false });
      throw error;
    }
  },
  
  getAllCategories: () => {
    const categories = Array.from(new Set(get().faqs.map(faq => faq.category)));
    return categories;
  }
}));

export default useFAQStore; 