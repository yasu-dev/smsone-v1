import React from 'react';
import { TAG_PATTERN } from '../../utils/tagUtils';
import useTagStore from '../../store/tagStore';

interface TagHighlighterProps {
  text: string;
  interactive?: boolean; // 対話的なタグの場合はtrueを設定
  onTagClick?: (tagName: string) => void; // タグがクリックされたときのコールバック
  isPreview?: boolean; // プレビュー表示かどうか（true:プレビュー, false:タグ一覧表示）
  showAsText?: boolean; // タグをテキストとして表示するかどうか
}

/**
 * テキスト内のタグをバッジスタイルでハイライト表示するコンポーネント
 */
const TagHighlighter: React.FC<TagHighlighterProps> = ({ 
  text, 
  interactive = false,
  onTagClick,
  isPreview = false,
  showAsText = false
}) => {
  const { tags } = useTagStore();
  
  if (!text) return null;
  
  // タグ値のマッピングを作成
  const tagValues: Record<string, string> = {};
  tags.forEach(tag => {
    if (tag.value) {
      tagValues[tag.name] = tag.value;
    }
  });
  
  // テキストをパース
  const parts: Array<{ text: string; isTag: boolean; tagName?: string; isUrlTag?: boolean }> = [];
  let lastIndex = 0;
  let match;
  
  // 正規表現を使用してすべてのタグを見つける
  const regex = new RegExp(TAG_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    // タグの前にあるテキストを追加
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), isTag: false });
    }
    
    // タグ自体を追加
    const fullTag = match[0];
    const tagName = match[1];
    const isUrlTag = /^URL\d*$/.test(tagName);
    parts.push({ text: fullTag, isTag: true, tagName, isUrlTag });
    
    lastIndex = match.index + fullTag.length;
  }
  
  // 最後の部分を追加
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isTag: false });
  }
  
  // タグクリックハンドラ
  const handleTagClick = (tagName: string) => {
    if (interactive && onTagClick) {
      onTagClick(tagName);
    }
  };

  // 表示用のデフォルトテキストを決定
  const getDefaultDisplayText = (tagName: string) => {
    // サンプル表示テキストをタグの種類に応じて返す
    if (tagName.includes('お知らせ')) {
      return 'お知らせ内容を入力';
    } else if (tagName.includes('URL')) {
      if (showAsText) {
        return 'https://example.jp/abcdefg';
      }
      return 'URLを入力';
    } else if (tagName.includes('名前') || tagName.includes('氏名')) {
      return '山田太郎';
    } else if (tagName.includes('会社')) {
      return '株式会社サンプル';
    } else if (tagName.includes('日付') || tagName.includes('日時')) {
      return '2023年12月1日';
    } else if (tagName.includes('時間')) {
      return '14:00';
    } else if (tagName.includes('場所')) {
      return '東京都渋谷区';
    } else if (tagName.includes('注文') || tagName.includes('伝票') || tagName.includes('番号')) {
      return 'ABC123456';
    } else if (tagName.includes('アンケート')) {
      if (showAsText) {
        return 'https://survey.example.jp/s/abc123';
      }
      return 'アンケートURLを入力';
    } else {
      return 'カスタム情報';
    }
  };
  
  return (
    <span className="tag-highlighter">
      {parts.map((part, index) => {
        if (!part.isTag) {
          return <span key={index}>{part.text}</span>;
        }
        
        // タグの場合、値が設定されていればその値を表示
        // 値が設定されていない場合は、説明テキストを表示
        const displayValue = part.tagName && tagValues[part.tagName] 
          ? tagValues[part.tagName] 
          : (part.tagName ? getDefaultDisplayText(part.tagName) : '');
        
        // テキストとして表示する場合
        if (showAsText) {
          return <span key={index}>{displayValue}</span>;
        }
        
        // URLタグの場合
        if (part.isUrlTag) {
          // プレビュー表示の場合は元のタグ（{お客様の名前を入力}など）を表示
          if (isPreview) {
            return (
              <span 
                key={index} 
                className="tag-badge-url cursor-pointer hover:underline"
                onClick={() => part.tagName && handleTagClick(part.tagName)}
                title={`${part.text}をクリックして編集`}
              >
                {part.tagName}
              </span>
            );
          } else {
            // 通常表示の場合は説明テキスト（お客様の名前を入力など）を表示
            return (
              <span 
                key={index} 
                className={`tag-badge-url ${interactive ? 'cursor-pointer hover:underline' : ''}`}
                onClick={() => part.tagName && handleTagClick(part.tagName)}
                title={interactive ? `${part.text}をクリックして編集` : part.text}
              >
                {displayValue}
              </span>
            );
          }
        }
        
        // 通常タグの場合
        // プレビュー表示の場合は元のタグ（{お客様の名前を入力}など）を表示
        if (isPreview) {
          return (
            <span 
              key={index} 
              className={`tag-badge-common ${interactive ? 'cursor-pointer hover:underline' : ''}`}
              onClick={() => part.tagName && handleTagClick(part.tagName)}
              title={interactive ? `${part.text}をクリックして編集` : part.text}
            >
              {part.tagName}
            </span>
          );
        } else {
          // タグ一覧表示の場合は説明テキスト（お客様の名前を入力など）を表示
          return (
            <span 
              key={index} 
              className={`tag-badge-common ${interactive ? 'cursor-pointer hover:underline' : ''}`}
              onClick={() => part.tagName && handleTagClick(part.tagName)}
              title={interactive ? `${part.text}をクリックして編集` : part.text}
            >
              {displayValue}
            </span>
          );
        }
      })}
    </span>
  );
};

export default TagHighlighter; 