/**
 * タグ管理ユーティリティ
 */

/**
 * タグ定義インターフェース
 */
export interface Tag {
  id: string;       // タグID (一意の識別子)
  name: string;     // タグ表示名
  value?: string;   // タグに設定された値
  description?: string; // タグの説明
  createdAt: string;    // 作成日時
  updatedAt: string;    // 更新日時
  createdBy: string;    // 作成者ID
}

/**
 * タグパターンを正規表現で判定
 * {お客様の名前を入力}のようなパターンにマッチする
 */
export const TAG_PATTERN = /{([^}]+)}/g;

/**
 * テキスト内のタグを抽出する
 * 
 * @param text タグを含むテキスト
 * @returns 抽出されたタグの配列
 */
export const extractTags = (text: string): string[] => {
  if (!text) return [];
  
  const tags: string[] = [];
  const matches = text.match(TAG_PATTERN);
  
  if (matches) {
    matches.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
  }
  
  return tags;
};

/**
 * テキスト内のタグをスタイル適用済み要素に変換する
 * 
 * @param text タグを含むテキスト
 * @param tagValues タグ値のマッピング (オプション)
 * @returns HTMLとして安全に表示できるタグ変換済みテキスト
 */
export const formatTaggedText = (text: string, tagValues?: Record<string, string>): string => {
  if (!text) return '';
  
  // タグをHTML要素に置換
  return text.replace(TAG_PATTERN, (match, tagName) => {
    // タグ値が指定されている場合はその値を使用、なければタグ名だけを表示（{}なし）
    const displayValue = tagValues && tagValues[tagName] ? tagValues[tagName] : tagName;
    return `<span class="tag-highlight">${displayValue}</span>`;
  });
};

/**
 * タグ名からタグパターン文字列を生成
 * 
 * @param tagName タグ名（"お客様の名前を入力"など）
 * @returns タグパターン文字列（"{お客様の名前を入力}"など）
 */
export const createTagPattern = (tagName: string): string => {
  return `{${tagName}}`;
};

/**
 * タグパターン文字列からタグ名を抽出
 * 
 * @param tagPattern タグパターン文字列（"{お客様の名前を入力}"など）
 * @returns タグ名（"お客様の名前を入力"など）
 */
export const extractTagName = (tagPattern: string): string => {
  const match = tagPattern.match(/^{([^}]+)}$/);
  return match ? match[1] : '';
};

/**
 * タグを生成する際の新しいIDを生成
 * 
 * @returns 一意のタグID
 */
export const generateTagId = (): string => {
  return `tag-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}; 