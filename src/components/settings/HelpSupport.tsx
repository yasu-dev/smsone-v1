import React from 'react';
import { Mail, FileText, HelpCircle, ExternalLink } from 'lucide-react';

const HelpSupport: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">ヘルプ＆サポート</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded-lg border border-grey-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-start mb-3">
            <Mail className="w-5 h-5 text-primary-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-grey-900">メールサポート</h3>
              <p className="text-grey-600 text-sm mt-1">
                平日9:00～18:00（土日祝日・年末年始を除く）
              </p>
              <a 
                href="mailto:contact@topaz.jp" 
                className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block font-medium"
              >
                contact@topaz.jp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">よくある質問</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              SMSの送信に失敗する場合はどうすればよいですか？
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              送信エラーが発生した場合は、電話番号の形式が正しいか（国際形式の場合は国コードから始まるか）、送信可能な時間帯か（22:00～8:00は配信制限がある場合があります）、アカウントの残高が十分かを確認してください。エラーコードが表示されている場合は、そのコードをメールサポートにお知らせいただくとスムーズに対応できます。
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              CSVで一括送信する際の正しいフォーマットを教えてください
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              CSVファイルの1行目には必ずヘッダー（電話番号、メッセージ内容など）を入れてください。電話番号列は「phone」または「tel」、メッセージ内容列は「message」または「text」というヘッダー名を使用すると自動認識されます。電話番号は「09012345678」のようにハイフンなしの形式が推奨です。文字コードはUTF-8を使用してください。サンプルCSVは「送信履歴」画面からダウンロードできます。
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              Excelファイルで一括送信する方法を教えてください
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              Excel形式（.xlsx）の一括送信にも対応しています。CSVと同様に1行目にヘッダーを設定してください。「電話番号」「メッセージ」という列名が推奨されますが、英語の「phone」「message」なども自動認識されます。複数のシートがある場合は、最初のシート（Sheet1）のみが読み込まれます。日本語や絵文字を含む場合もExcel形式であれば文字化けの心配はありません。送信前には必ずプレビュー機能で内容を確認してください。
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              送信予約したSMSをキャンセルする方法は？
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              送信予約したSMSは「送信履歴」画面から確認できます。ステータスが「予約済」のメッセージを選択し、「予約キャンセル」ボタンをクリックすることでキャンセルできます。ただし、予約時刻の10分前を過ぎるとキャンセルできなくなりますのでご注意ください。
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              メッセージテンプレートで変数を使用する方法は？
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              メッセージテンプレートでは、「&#123;&#123;名前&#125;&#125;」のように二重波括弧で囲んだ文字を変数として使用できます。一括送信時にCSVの列名と変数名が一致すると、自動的に置換されます。例えば、CSVに「名前」という列があれば、メッセージ内の「&#123;&#123;名前&#125;&#125;」がその値に置き換わります。日時や番号などの書式設定も可能です。詳細はマニュアルをご参照ください。
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-grey-200">
            <h4 className="font-medium text-grey-900 flex items-center">
              <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
              送信したSMSの配信状況を確認するには？
            </h4>
            <p className="text-grey-600 mt-2 text-sm">
              送信したSMSの配信状況は「送信履歴」画面で確認できます。各メッセージには「送信済」「配信済」「不達」などのステータスが表示されます。詳細な配信レポートが必要な場合は、送信履歴の「レポート出力」ボタンからCSVまたはPDF形式でダウンロードできます。なお、キャリアからの配信状況の反映には数分から最大24時間かかる場合があります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport; 