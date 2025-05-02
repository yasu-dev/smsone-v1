import React, { useState, useEffect } from 'react';
import { Link2, Lock, Info, ExternalLink, FileCode, Copy, AlertCircle } from 'lucide-react';
import useShortenedUrlStore from '../../store/shortenedUrlStore';
import toast from 'react-hot-toast';

interface ShortenedUrlInputProps {
  onUpdate: (url: string, index?: number) => void;
  onInsertTag: (tag: string) => void;
  initialUrl?: string;
  urlIndex?: number; // 複数URLサポート用（1-4）
  showMultipleUrls?: boolean;
  disabled?: boolean;
}

const ShortenedUrlInput: React.FC<ShortenedUrlInputProps> = ({
  onUpdate,
  onInsertTag,
  initialUrl = '',
  urlIndex = 1,
  showMultipleUrls = false,
  disabled = false
}) => {
  const { 
    validateUrl,
    shortenUrl,
    hasAccessCodeFeature,
    isLoading,
    error
  } = useShortenedUrlStore();
  
  const [originalUrl, setOriginalUrl] = useState(initialUrl);
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [isUrlProcessed, setIsUrlProcessed] = useState(false);
  
  // 初期値設定
  useEffect(() => {
    if (initialUrl && initialUrl !== originalUrl) {
      setOriginalUrl(initialUrl);
    }
  }, [initialUrl]);
  
  // 元のURLが変更されたら結果をリセット
  useEffect(() => {
    if (originalUrl !== initialUrl) {
      setShortenedUrl('');
      setIsUrlProcessed(false);
      setUrlError('');
    }
  }, [originalUrl, initialUrl]);
  
  // URLタグ挿入
  const handleInsertTag = () => {
    // urlIndexに基づいてタグを生成（1の場合は数字なし、それ以外は数字付き）
    const tag = `{URL${urlIndex}}`;
    onInsertTag(tag);
  };
  
  // URL短縮ボタンハンドラ
  const handleShortenUrl = async () => {
    if (!originalUrl.trim()) {
      setUrlError('短縮元URLを入力してください');
      return;
    }
    
    if (!validateUrl(originalUrl)) {
      setUrlError('有効なURLを入力してください');
      return;
    }
    
    if (originalUrl.length > 2083) {
      setUrlError('URLは2083文字以内で入力してください');
      return;
    }
    
    setUrlError('');
    
    try {
      const shortened = await shortenUrl(originalUrl, urlIndex);
      setShortenedUrl(shortened);
      setIsUrlProcessed(true);
      onUpdate(originalUrl, urlIndex);
    } catch (error) {
      setUrlError('URL短縮に失敗しました');
      console.error(error);
    }
  };
  
  // アクセスコード保存
  const handleSaveAccessCode = () => {
    if (!accessCode.trim()) {
      toast.error('アクセスコードを入力してください');
      return;
    }
    
    // アクセスコードの検証（英数字と特殊文字、1-20文字）
    const validCodePattern = /^[@%+'!#$^?:;.,()\[\]{}~\-_a-zA-Z0-9]{1,20}$/;
    if (!validCodePattern.test(accessCode)) {
      toast.error('無効なアクセスコードです。英数字および一部の特殊文字のみ使用可能です（1～20文字）');
      return;
    }
    
    toast.success('アクセスコードを設定しました');
    setShowAccessCodeInput(false);
  };
  
  // プレビューURLをクリップボードにコピー
  const handleCopyUrl = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl)
        .then(() => toast.success('URLをコピーしました'))
        .catch(() => toast.error('コピーに失敗しました'));
    }
  };
  
  // タグの表示文字列
  const tagText = `{URL${urlIndex}}`;
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`original-url-${urlIndex}`} className="form-label flex items-center">
          <Link2 className="h-4 w-4 mr-1" />
          短縮元URL {urlIndex > 1 ? urlIndex : ''}
        </label>
        
        <div className="flex mt-1">
          <input
            type="url"
            id={`original-url-${urlIndex}`}
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://example.com/page"
            className={`form-input flex-grow ${urlError ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
            disabled={disabled}
          />
          
          <div className="flex ml-2">
            <button
              type="button"
              onClick={handleShortenUrl}
              disabled={isLoading || !originalUrl.trim() || disabled}
              className="btn-secondary whitespace-nowrap"
            >
              短縮URL生成
            </button>
            
            <button
              type="button"
              onClick={handleInsertTag}
              className="btn-secondary whitespace-nowrap ml-2"
              title={`本文に${tagText}タグを挿入`}
              disabled={disabled}
            >
              挿入
            </button>
          </div>
        </div>
        
        {urlError && (
          <p className="mt-1 text-sm text-error-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {urlError}
          </p>
        )}
      </div>
      
      {/* 短縮URL結果表示 */}
      {isUrlProcessed && shortenedUrl && (
        <div className="p-3 border border-grey-200 rounded-md bg-grey-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-grey-700 flex items-center">
              <FileCode className="h-4 w-4 mr-1 text-primary-500" />
              短縮URL {urlIndex > 1 ? urlIndex : ''}
            </h4>
            
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1 text-grey-500 hover:text-grey-700"
                title="URLをコピー"
                disabled={disabled}
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={shortenedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-grey-500 hover:text-grey-700"
                title="新しいタブで開く"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <p className="text-sm text-primary-600 font-mono bg-white p-2 rounded border border-grey-200">
            {shortenedUrl}
          </p>
        </div>
      )}
      
      {/* アクセスコード設定オプション（折りたたみ） */}
      {hasAccessCodeFeature && !disabled && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowAccessCodeInput(!showAccessCodeInput)}
            className="text-sm text-grey-600 hover:text-grey-800 flex items-center"
          >
            <Lock className="h-3 w-3 mr-1" />
            {showAccessCodeInput ? 'アクセスコードを隠す' : 'アクセスコードを設定'}
          </button>
          
          {showAccessCodeInput && (
            <div className="mt-2 p-3 border border-grey-200 rounded-md bg-grey-50">
              <label htmlFor={`access-code-${urlIndex}`} className="block text-sm font-medium text-grey-700 mb-1">
                アクセスコード
              </label>
              
              <div className="flex">
                <input
                  type="text"
                  id={`access-code-${urlIndex}`}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="英数字 1～20文字"
                  className="form-input flex-grow"
                  maxLength={20}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={handleSaveAccessCode}
                  className="ml-2 btn-primary"
                  disabled={disabled}
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShortenedUrlInput;