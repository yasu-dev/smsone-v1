/**
 * 日付を「YYYY/MM/DD」形式にフォーマットする
 * @param date 日付オブジェクトまたは日付文字列
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  
  // 無効な日付の場合は空文字を返す
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};

/**
 * 日付と時刻を「YYYY/MM/DD HH:MM」形式にフォーマットする
 * @param date 日付オブジェクトまたは日付文字列
 * @returns フォーマットされた日付時刻文字列
 */
export const formatDateTime = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  
  // 無効な日付の場合は空文字を返す
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

/**
 * 現在の日付を「YYYY-MM-DD」形式で取得する
 * @returns 現在の日付文字列
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 現在の時刻を「HH:MM」形式で取得する
 * @returns 現在の時刻文字列
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}; 