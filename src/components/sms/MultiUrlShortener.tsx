import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, RefreshCw, Copy, CheckCircle, AlertCircle, X, Info, ArrowDown } from 'lucide-react';
import useShortenedUrlStore from '../../store/shortenedUrlStore';
import toast from 'react-hot-toast';

interface ShortenedUrlMapping {
  originalUrl: string;
  shortenedUrl: string;
  placeholder: string;
}

const MultiUrlShortener: React.FC = () => {
  const { validateUrl, shortenUrl } = useShortenedUrlStore();
  
  // State for input and processing
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedText, setProcessedText] = useState<string>('');
  const [urlMappings, setUrlMappings] = useState<ShortenedUrlMapping[]>([]);
  const [error, setError] = useState<string>('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  // Parse input and process URLs
  const handleSubmit = async () => {
    setError('');
    setIsProcessing(true);
    setIsSuccessful(false);
    
    try {
      // Split input by empty line to separate URLs and text
      const parts = input.split(/\n\s*\n/);
      
      if (parts.length < 2) {
        throw new Error('入力形式が正しくありません。URLと本文の間に空行を入れてください。');
      }
      
      const urlsText = parts[0];
      const contentText = parts.slice(1).join('\n\n');
      
      // Parse URLs (one per line)
      const urls = urlsText.split('\n')
        .filter(line => line.trim())
        .map(url => url.trim());
      
      if (urls.length === 0) {
        throw new Error('URLが入力されていません。');
      }
      
      if (urls.length > 10) {
        throw new Error('URLは最大10個までです。');
      }
      
      // Validate URLs
      for (const url of urls) {
        if (!validateUrl(url)) {
          throw new Error(`不正なURL形式です: ${url}`);
        }
      }
      
      // Check if content has placeholders
      const placeholderRegex = /{URL\d+}/g;
      const placeholders = contentText.match(placeholderRegex) || [];
      
      // Create URL mappings and shorten URLs
      const mappings: ShortenedUrlMapping[] = [];
      
      for (let i = 0; i < urls.length; i++) {
        const originalUrl = urls[i];
        const placeholder = `{URL${i + 1}}`;
        
        // Shorten URL
        const shortenedUrl = await shortenUrl(originalUrl, i + 1);
        
        mappings.push({
          originalUrl,
          shortenedUrl,
          placeholder
        });
      }
      
      // Replace placeholders in the content
      let processedContent = contentText;
      mappings.forEach(mapping => {
        const regex = new RegExp(mapping.placeholder, 'g');
        processedContent = processedContent.replace(regex, mapping.shortenedUrl);
      });
      
      setUrlMappings(mappings);
      setProcessedText(processedContent);
      setIsSuccessful(true);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy processed text to clipboard
  const handleCopyProcessedText = () => {
    navigator.clipboard.writeText(processedText)
      .then(() => toast.success('テキストをコピーしました'))
      .catch(() => toast.error('コピーに失敗しました'));
  };

  // Reset everything
  const handleReset = () => {
    setInput('');
    setProcessedText('');
    setUrlMappings([]);
    setError('');
    setIsSuccessful(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="card"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mb-5">
        <h2 className="text-lg font-medium text-grey-900">複数URL短縮ツール</h2>
        <p className="mt-1 text-sm text-grey-500">
          複数のURLを一括で短縮し、テキスト内のプレースホルダーに自動挿入します
        </p>
      </div>

      {!isSuccessful ? (
        <>
          <motion.div variants={itemVariants} className="mb-4">
            <label className="form-label">入力フォーム</label>
            <div className="p-4 bg-grey-50 rounded-md border border-grey-200">
              <p className="text-sm text-grey-700 mb-2">入力手順:</p>
              <ol className="text-sm text-grey-600 list-decimal ml-5 mb-3 space-y-1">
                <li>変換したい元のURLを1行に1つずつ入力</li>
                <li>空行を1行入れる</li>
                <li>短縮URLを挿入したい本文テキストを入力（{'{URL1}'}、{'{URL2}'} などで挿入位置を指定）</li>
              </ol>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-4">
            <div className="mt-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="form-input font-mono text-sm"
                rows={12}
                placeholder={`https://example.com/very/long/url/1\nhttps://example.com/very/long/url/2\n\nこちらの{URL1}をご確認ください。詳細は{URL2}にあります。`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-4 flex justify-end">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  URLを短縮して挿入
                </>
              )}
            </button>
          </motion.div>

          {error && (
            <motion.div
              variants={itemVariants}
              className="p-3 rounded-md bg-error-50 text-error-700 flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-error-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </motion.div>
          )}
        </>
      ) : (
        <>
          <motion.div variants={itemVariants} className="mb-6 flex justify-between items-center">
            <h3 className="text-base font-medium text-grey-900 flex items-center">
              <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
              処理完了
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                新しい入力
              </button>
            </div>
          </motion.div>
          
          {/* URL変換マッピング表 */}
          <motion.div variants={itemVariants} className="mb-6">
            <h4 className="text-sm font-medium text-grey-700 mb-2">URL変換対応表</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-grey-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase">プレースホルダー</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase">元URL</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase">短縮URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-200">
                  {urlMappings.map((mapping, index) => (
                    <tr key={index} className="hover:bg-grey-50">
                      <td className="px-4 py-3 text-sm text-grey-900 font-mono">{mapping.placeholder}</td>
                      <td className="px-4 py-3 text-sm text-grey-900">
                        <div className="max-w-md truncate font-mono">{mapping.originalUrl}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-primary-600 font-mono">{mapping.shortenedUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* 処理結果テキスト */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-grey-700">処理結果テキスト</h4>
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                onClick={handleCopyProcessedText}
              >
                <Copy className="h-4 w-4 mr-1" />
                コピー
              </button>
            </div>
            <div className="p-4 bg-grey-50 rounded-md border border-grey-200">
              <pre className="whitespace-pre-wrap text-sm text-grey-800">{processedText}</pre>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-3 rounded-md bg-primary-50 flex items-start">
            <Info className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700">
              <p className="font-medium">ヒント</p>
              <p className="mt-1">URLが多い場合やURLパターンが決まっている場合は、テンプレート機能を使うと便利です。</p>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default MultiUrlShortener;